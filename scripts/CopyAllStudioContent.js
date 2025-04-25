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

  // Thêm nút vào menu
  GM_registerMenuCommand("Copy to Markdown", copyToMarkdown);
  GM_registerMenuCommand("Export to MD file", exportToMD);

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
  }
})();
