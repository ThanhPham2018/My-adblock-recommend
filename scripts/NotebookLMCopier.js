// ==UserScript==
// @name         NotebookLM Copier
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Copy nội dung NotebookLM
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/NotebookLMCopier.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/NotebookLMCopier.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://notebooklm.google.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // Đăng ký menu chuột phải của TamperMonkey
  GM_registerMenuCommand("Copy toàn bộ nội dung", copyAllContent);
  GM_registerMenuCommand("Copy phần được chọn", copySelectedSection);
  GM_registerMenuCommand("Copy phần nguồn", copySourcePanel);
  GM_registerMenuCommand("Copy phần tóm tắt", copySummaryPanel);

    GM_registerMenuCommand("Copy phần tóm tắt (giữ định dạng)", copySummaryPanelWithStyle);
    GM_registerMenuCommand("Tải phần tóm tắt (giữ định dạng)", downloadSummaryPanelWithStyle);
    GM_registerMenuCommand("Tải phần tóm tắt (PDF)", downloadSummaryPanelAsPDF);
    GM_registerMenuCommand("Tải phần tóm tắt (TXT)", downloadSummaryPanelAsTXT);

function downloadSummaryPanelAsTXT() {
  const summaryPanel = document.querySelector(".ql-editor");
  if (!summaryPanel) return showNotification("Không tìm thấy nội dung tóm tắt!");

  const markdownContent = convertToMarkdown(summaryPanel);
  if (!markdownContent) return;

  const blob = new Blob([markdownContent], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "notebook-summary.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showNotification("Đã tải phần tóm tắt dưới dạng file .txt!");
}


function downloadSummaryPanelAsPDF() {
  const summaryPanel = document.querySelector(".ql-editor");
  if (!summaryPanel) return showNotification("Không tìm thấy nội dung tóm tắt!");
  const markdownContent = extractMarkdownWithStyle(summaryPanel);
  if (!markdownContent) return;

  // Tạo nội dung HTML cơ bản từ markdown (đơn giản hóa để in PDF)
  const htmlContent = markdownContent
    .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
    .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
    .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    .replace(/\n/g, "<br>");

  const win = window.open("", "_blank");
  win.document.write(`
    <html>
      <head>
        <title>Notebook Summary PDF</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
          h1, h2, h3, h4, h5, h6 { font-weight: bold; }
          a { color: #0645ad; }
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print(); // Mở hộp thoại in để người dùng lưu PDF
  showNotification("Đang chuẩn bị nội dung PDF, vui lòng chọn 'Lưu dưới dạng PDF'!");
}


function downloadSummaryPanelWithStyle() {
  const summaryPanel = document.querySelector(".ql-editor");
  if (!summaryPanel) return showNotification("Không tìm thấy nội dung tóm tắt!");
  const markdownContent = extractMarkdownWithStyle(summaryPanel);
  if (markdownContent) {
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "notebook-summary.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("Đã tải nội dung tóm tắt dưới dạng file .md!");
  }
}



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

  function copySummaryPanelWithStyle() {
    const summaryPanel = document.querySelector(".ql-editor");
    if (!summaryPanel) return showNotification("Không tìm thấy nội dung tóm tắt!");
    const markdownContent = extractMarkdownWithStyle(summaryPanel);
    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép nội dung tóm tắt có định dạng!");
    }
  }

  function extractMarkdownWithStyle(element) {
    function processNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent;
  if (node.nodeType === Node.ELEMENT_NODE) {
    let tag = node.tagName.toLowerCase();
    let children = Array.from(node.childNodes).map(processNode).join("");

    if (tag === "b" || tag === "strong" || getComputedStyle(node).fontWeight >= 600) {
      // Chèn khoảng trắng nếu phần tiếp theo không phải là dấu câu
      return `**${children.trim()}** `;
    }

    if (tag === "i" || tag === "em" || getComputedStyle(node).fontStyle === "italic") {
      return `*${children.trim()}* `;
    }

    if (tag === "a" && node.href) {
      return `[${children.trim()}](${node.href}) `;
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

  function copySourcePanel() {
    // Tìm nội dung phần nguồn (source panel)
    const sourcePanel = document.querySelector(".source-panel-view-content");

    if (!sourcePanel) {
      showNotification("Không tìm thấy nội dung nguồn!");
      return;
    }

    const markdownContent = convertToMarkdown(sourcePanel);

    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép nội dung phần nguồn!");
    }
  }

  function copySummaryPanel() {
    // Tìm nội dung phần tóm tắt/studio (markdown-editor)
    const summaryPanel = document.querySelector(".ql-editor");

    if (!summaryPanel) {
      showNotification("Không tìm thấy nội dung tóm tắt!");
      return;
    }

    const markdownContent = convertToMarkdown(summaryPanel);

    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép nội dung phần tóm tắt!");
    }
  }

  function copyAllContent() {
    let markdownContent = "";

    const titleElement = document.querySelector("h1.notebook-title");
    if (titleElement) {
      markdownContent += `# ${titleElement.textContent.trim()}\n\n`;
    }

    const contentElements = document.querySelectorAll(
      ".editor.ql-container .ql-editor, .source-panel-view-content"
    );

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

    // Tìm phần tử cha chứa nội dung cần copy
    while (
      container &&
      (!container.classList ||
        (!container.classList.contains("ql-editor") &&
          !container.classList.contains("paragraph") &&
          !container.classList.contains("source-panel-view-content")))
    ) {
      container = container.parentElement;
    }

    if (!container) {
      showNotification("Vui lòng chọn nội dung hợp lệ!");
      return;
    }

    const markdownContent = convertToMarkdown(container);

    if (markdownContent) {
      GM_setClipboard(markdownContent, "text");
      showNotification("Đã sao chép phần được chọn!");
    }
  }

  function convertToMarkdown(element) {
    let markdown = "";

    // Nếu là phần tóm tắt (ql-editor), xử lý theo thứ tự DOM
    if (element.classList.contains("ql-editor")) {
      // Xử lý tất cả các phần tử con theo đúng thứ tự DOM
      const childNodes = Array.from(element.childNodes);
      childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tagName = node.tagName.toLowerCase();

          // Xử lý heading
          if (tagName.match(/^h[1-6]$/)) {
            const level = tagName[1];
            let prefix = "#".repeat(parseInt(level));
            markdown += `${prefix} ${node.textContent.trim()}\n\n`;
          }
          // Xử lý đoạn văn
          else if (tagName === "p") {
            markdown += `${node.textContent.trim()}\n\n`;
          }
          // Xử lý danh sách có thứ tự
          else if (tagName === "ol") {
            let index = 1;
            node.querySelectorAll("li").forEach((item) => {
              let indentLevel = 0;
              if (item.className && item.className.includes("ql-indent")) {
                const match = item.className.match(/ql-indent-(\d+)/);
                if (match) indentLevel = parseInt(match[1], 10);
              }
              let indentPrefix = "  ".repeat(indentLevel);
              markdown += `${indentPrefix}${index}. ${item.textContent.trim()}\n`;
              index++;
            });
            markdown += "\n";
          }
          // Xử lý danh sách không thứ tự
          else if (tagName === "ul") {
            node.querySelectorAll("li").forEach((item) => {
              let indentLevel = 0;
              if (item.className && item.className.includes("ql-indent")) {
                const match = item.className.match(/ql-indent-(\d+)/);
                if (match) indentLevel = parseInt(match[1], 10);
              }
              let indentPrefix = "  ".repeat(indentLevel);
              markdown += `${indentPrefix}- ${item.textContent.trim()}\n`;
            });
            markdown += "\n";
          }
        }
      });
    }
    // Xử lý phần nguồn
    else if (element.classList.contains("source-panel-view-content")) {
      // Tìm tất cả phần tử paragraph theo thứ tự
      const paragraphs = element.querySelectorAll(".paragraph");
      paragraphs.forEach((para) => {
        // Dùng data-start-index để sắp xếp đúng
        const span = para.querySelector("span[data-start-index]");
        if (span) {
          const text = span.textContent.trim();
          if (text) {
            markdown += `${text}\n\n`;
          }
        }
      });
    }
    // Xử lý các trường hợp khác
    else {
      // Giữ lại code xử lý cũ cho các trường hợp chọn nội dung
      // Xử lý các heading
      const headings = element.querySelectorAll("h1, h2, h3, h4, h5, h6");
      headings.forEach((heading) => {
        const level = heading.tagName[1];
        let prefix = "#".repeat(parseInt(level));
        markdown += `${prefix} ${heading.textContent.trim()}\n\n`;
      });

      // Xử lý đoạn văn
      const paragraphs = element.querySelectorAll("p, .paragraph");
      paragraphs.forEach((para) => {
        markdown += `${para.textContent.trim()}\n\n`;
      });

      // Xử lý danh sách
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
})();
