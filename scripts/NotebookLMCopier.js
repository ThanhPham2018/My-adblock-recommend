// ==UserScript==
// @name         NotebookLM Copier
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Copy nội dung NotebookLM
// @author       ThanhPN + Nguyện Dev
// @downloadURL  https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/NotebookLMCopier.js
// @updateURL    https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/NotebookLMCopier.js
// @homepageURL  https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://notebooklm.google.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  GM_registerMenuCommand("Copy toàn bộ nội dung", copyAllContent);
  GM_registerMenuCommand("Copy phần được chọn", copySelectedSection);
  GM_registerMenuCommand("Copy phần nguồn", copySourcePanel);
  GM_registerMenuCommand("Copy phần tóm tắt", copySummaryPanel);
  GM_registerMenuCommand("Copy phần tóm tắt (giữ định dạng)", copySummaryPanelWithStyle);

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.cssText =
      "position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;padding:10px;border-radius:5px;z-index:10000;opacity:0.9";
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.5s";
      setTimeout(() => notification.remove(), 500);
    }, 2000);
  }

  function copySourcePanel() {
    const sourcePanel = document.querySelector(".source-panel-view-content");
    if (!sourcePanel) return showNotification("Không tìm thấy nội dung nguồn!");
    const markdownContent = convertToMarkdown(sourcePanel);
    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép nội dung phần nguồn!");
    }
  }

  function copySummaryPanel() {
    const summaryPanel = document.querySelector(".ql-editor");
    if (!summaryPanel) return showNotification("Không tìm thấy nội dung tóm tắt!");
    const markdownContent = convertToMarkdown(summaryPanel);
    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép nội dung phần tóm tắt!");
    }
  }

  function copySummaryPanelWithStyle() {
    const summaryPanel = document.querySelector(".ql-editor");
    if (!summaryPanel) return showNotification("Không tìm thấy nội dung tóm tắt!");
    const markdownContent = extractMarkdownWithStyle(summaryPanel);
    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép nội dung tóm tắt có định dạng!");
    }
  }

  function copyAllContent() {
    let markdownContent = "";
    const titleElement = document.querySelector("h1.notebook-title");
    if (titleElement) markdownContent += `# ${titleElement.textContent.trim()}\n\n`;
    const contentElements = document.querySelectorAll(".editor.ql-container .ql-editor, .source-panel-view-content");
    contentElements.forEach((element) => {
      markdownContent += convertToMarkdown(element);
      markdownContent += "\n\n---\n\n";
    });
    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép toàn bộ nội dung!");
    }
  }

  function copySelectedSection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let container = selection.getRangeAt(0).commonAncestorContainer;
    while (
      container &&
      (!container.classList ||
        (!container.classList.contains("ql-editor") &&
          !container.classList.contains("paragraph") &&
          !container.classList.contains("source-panel-view-content")))
    ) {
      container = container.parentElement;
    }
    if (!container) return showNotification("Vui lòng chọn nội dung hợp lệ!");
    const markdownContent = convertToMarkdown(container);
    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép phần được chọn!");
    }
  }

  function convertToMarkdown(element) {
    let markdown = "";

    if (element.classList.contains("ql-editor")) {
      const childNodes = Array.from(element.childNodes);
      childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();

          if (tagName.match(/^h[1-6]$/)) {
            const level = tagName[1];
            markdown += `${"#".repeat(parseInt(level))} ${node.textContent.trim()}\n\n`;
          }

          else if (tagName === "p") {
            let paragraphText = "";
            node.childNodes.forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) {
                paragraphText += child.textContent;
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const tag = child.tagName.toLowerCase();
                const isBold = tag === "strong" || tag === "b" || getComputedStyle(child).fontWeight >= 600;
                const text = child.textContent.trim();
                if (text) paragraphText += isBold ? `**${text}**` : text;
              }
            });
            markdown += `${paragraphText.trim()}\n\n`;
          }

          else if (tagName === "ol") {
            let index = 1;
            node.querySelectorAll("li").forEach((item) => {
              let indentLevel = 0;
              const match = item.className?.match(/ql-indent-(\d+)/);
              if (match) indentLevel = parseInt(match[1], 10);
              markdown += `${"  ".repeat(indentLevel)}${index++}. ${item.textContent.trim()}\n`;
            });
            markdown += "\n";
          }

          else if (tagName === "ul") {
            node.querySelectorAll("li").forEach((item) => {
              let indentLevel = 0;
              const match = item.className?.match(/ql-indent-(\d+)/);
              if (match) indentLevel = parseInt(match[1], 10);
              markdown += `${"  ".repeat(indentLevel)}- ${item.textContent.trim()}\n`;
            });
            markdown += "\n";
          }
        }
      });
    }

    else if (element.classList.contains("source-panel-view-content")) {
      const paragraphs = element.querySelectorAll(".paragraph");
      paragraphs.forEach((para) => {
        const span = para.querySelector("span[data-start-index]");
        if (span) markdown += `${span.textContent.trim()}\n\n`;
      });
    }

    else {
      const headings = element.querySelectorAll("h1, h2, h3, h4, h5, h6");
      headings.forEach((heading) => {
        markdown += `${"#".repeat(parseInt(heading.tagName[1]))} ${heading.textContent.trim()}\n\n`;
      });
      const paragraphs = element.querySelectorAll("p, .paragraph");
      paragraphs.forEach((para) => {
        markdown += `${para.textContent.trim()}\n\n`;
      });
      const lists = element.querySelectorAll("ol, ul");
      lists.forEach((list) => {
        const isOrdered = list.tagName.toLowerCase() === "ol";
        list.querySelectorAll("li").forEach((item, index) => {
          const prefix = isOrdered ? `${index + 1}. ` : "- ";
          markdown += `${prefix}${item.textContent.trim()}\n`;
        });
        markdown += "\n";
      });
    }

    return markdown.trim();
  }

  function extractMarkdownWithStyle(element) {
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent;
      if (node.nodeType === Node.ELEMENT_NODE) {
        let tag = node.tagName.toLowerCase();
        let children = Array.from(node.childNodes).map(processNode).join("");

        if (tag === "b" || tag === "strong" || getComputedStyle(node).fontWeight >= 600) {
          return `**${children.trim()}**`;
        }

        if (tag === "i" || tag === "em" || getComputedStyle(node).fontStyle === "italic") {
          return `*${children.trim()}*`;
        }

        if (tag === "a" && node.href) {
          return `[${children.trim()}](${node.href})`;
        }

        if (tag === "br") return `  \n`;

        return children;
      }
      return "";
    }

    let output = "";
    element.childNodes.forEach((block) => {
      const tag = block.nodeType === 1 ? block.tagName.toLowerCase() : null;
      if (tag === "p" || tag?.startsWith("h")) {
        output += processNode(block).trim() + "\n\n";
      } else if (tag === "ul" || tag === "ol") {
        const isOrdered = tag === "ol";
        block.querySelectorAll("li").forEach((li, i) => {
          const prefix = isOrdered ? `${i + 1}. ` : "- ";
          output += prefix + processNode(li).trim() + "\n";
        });
        output += "\n";
      }
    });

    return output.trim();
  }
})();
