// ==UserScript==
// @name         Copy Studio Content to MD
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Copy chat content to markdown format
// @author       ThanhPN
// @match        *://*aistudio.google.com//*
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllStudioContent.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllStudioContent.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function () {
  "use strict";

  // Thêm styles cho buttons
  const styles = {
    container: `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #000000cc;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 999999;
      display: flex;
      gap: 10px;
    `,
    button: `
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.3s;
    `,
    exportButton: `
      padding: 10px 20px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      transition: all 0.3s;
    `,
  };

  // Tạo UI buttons
  function createButtons() {
    const oldButtons = document.getElementById("studio-copy-buttons");
    if (oldButtons) oldButtons.remove();

    const container = document.createElement("div");
    container.id = "studio-copy-buttons";
    container.style.cssText = styles.container;

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy to MD";
    copyBtn.style.cssText = styles.button;
    copyBtn.onclick = copyToMarkdown;

    const exportBtn = document.createElement("button");
    exportBtn.textContent = "Export MD";
    exportBtn.style.cssText = styles.exportButton;
    exportBtn.onclick = exportToMD;

    // Hover effects
    [copyBtn, exportBtn].forEach((btn) => {
      btn.onmouseover = () => {
        btn.style.transform = "scale(1.1)";
        btn.style.opacity = "0.9";
      };
      btn.onmouseout = () => {
        btn.style.transform = "scale(1)";
        btn.style.opacity = "1";
      };
    });

    container.appendChild(copyBtn);
    container.appendChild(exportBtn);
    document.body.appendChild(container);
  }

  // Initialize buttons
  createButtons();

  function extractContent() {
    const turns = document.querySelectorAll("ms-chat-turn");
    let mdContent = "";

    turns.forEach((turn) => {
      // Kiểm tra turn của user hay AI
      const isUser = turn.querySelector(".user-prompt-container");

      if (isUser) {
        const userText = turn.querySelector(".turn-content")?.innerText?.trim();
        if (userText) {
          mdContent += `\n\n### User:\n${userText}\n`;
        }
      } else {
        // Extract AI response
        const responseContent = turn.querySelector(".turn-content");
        if (!responseContent) return;

        mdContent += `\n\n### Assistant:\n`;

        // Extract text & code blocks
        responseContent.querySelectorAll("p, pre, ul, ol").forEach((el) => {
          if (el.tagName === "PRE") {
            // Code block
            const code = el.querySelector("code");
            if (code) {
              mdContent += "\n```\n" + code.innerText + "\n```\n";
            }
          } else if (el.tagName === "UL" || el.tagName === "OL") {
            // Lists
            el.querySelectorAll("li").forEach((li) => {
              mdContent += `- ${li.innerText.trim()}\n`;
            });
          } else {
            // Regular text
            mdContent += el.innerText.trim() + "\n\n";
          }
        });
      }
    });

    return mdContent.trim();
  }

  function copyToMarkdown() {
    const md = extractContent();
    GM_setClipboard(md);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy to MD";
    }, 2000);
    alert("Đã copy nội dung vào clipboard!");
  }

  function exportToMD() {
    const md = extractContent();
    const blob = new Blob([md], { type: "text/markdown" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
    exportBtn.textContent = "Exported!";
    setTimeout(() => {
      exportBtn.textContent = "Export MD";
    }, 2000);
  }
})();
