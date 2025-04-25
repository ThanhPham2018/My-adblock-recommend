// ==UserScript==
// @name         Copy Studio Content to MD
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Copy chat content to markdown format
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllStudioContent.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllStudioContent.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://aistudio.google.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  function extractContent() {
    const turns = document.querySelectorAll("ms-chat-turn");
    let mdContent = "";

    turns.forEach((turn) => {
      const isUser = turn.querySelector(".user-prompt-container");

      if (isUser) {
        const userText = turn.querySelector(".turn-content")?.innerText?.trim();
        if (userText) {
          mdContent += `\n\n### User:\n${userText}\n`;
        }
      } else {
        const responseContent = turn.querySelector(".turn-content");
        if (!responseContent) return;

        mdContent += `\n\n### Assistant:\n`;

        responseContent.querySelectorAll("p, pre, ul, ol").forEach((el) => {
          if (el.tagName === "PRE") {
            const code = el.querySelector("code");
            if (code) {
              mdContent += "\n```\n" + code.innerText + "\n```\n";
            }
          } else if (el.tagName === "UL" || el.tagName === "OL") {
            el.querySelectorAll("li").forEach((li) => {
              mdContent += `- ${li.innerText.trim()}\n`;
            });
          } else {
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

  // Đăng ký context menu với emoji
  GM_registerMenuCommand("📋 Copy to Markdown", copyToMarkdown);
  GM_registerMenuCommand("💾 Export to MD", exportToMD);
})();
