// ==UserScript==
// @name         Copy NotebookLM Text Content
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Copy toàn bộ nội dung text từ transcript
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllNotebookLMContent.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllNotebookLMContent.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://notebooklm.google.com/*
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  function getAllContent() {
    // Thử nhiều selectors khác nhau
    const selectors = [
      '[class^="panel-content source-panel-view-content"]',
      '[class*="panel-content"]',
      '[class*="conversation-"]',
      '[role="main"]',
      "main",
      "#content",
    ];

    let activeContainer = null;

    // Tìm container đầu tiên tồn tại và có nội dung
    for (const selector of selectors) {
      const container = document.querySelector(selector);
      if (container && container.textContent?.trim()) {
        activeContainer = container;
        break;
      }
    }

    if (!activeContainer) {
      console.warn("Không tìm thấy panel content");
      return null;
    }

    // Lọc các elements chứa nội dung text
    const textElements = Array.from(
      activeContainer.querySelectorAll("*")
    ).filter((el) => {
      // Chỉ lấy các elements hiển thị và có text
      const style = window.getComputedStyle(el);
      return (
        el.textContent?.trim() &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !el.closest('[aria-hidden="true"]')
      );
    });

    // Loại bỏ các elements trùng lặp và join text
    const uniqueTexts = new Set();
    const content = textElements
      .map((el) => el.textContent.trim())
      .filter((text) => {
        if (!uniqueTexts.has(text)) {
          uniqueTexts.add(text);
          return true;
        }
        return false;
      })
      .join("\n");

    return content || null;
  }

  async function copyToClipboard() {
    const content = getAllContent();
    if (!content) {
      alert("Không tìm thấy nội dung để copy!");
      return;
    }

    try {
      await navigator.clipboard.writeText(content);
      console.log("✅ Đã copy thành công!");
    } catch (error) {
      console.error("Lỗi khi copy:", error);
      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  }

  function exportToFile() {
    const content = getAllContent();
    if (!content) {
      alert("Không tìm thấy nội dung để xuất!");
      return;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..+/, "")
      .replace("T", "_");

    const filename = `${timestamp}.txt`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Đăng ký menu commands
  GM_registerMenuCommand("📋 Copy Text", copyToClipboard);
  GM_registerMenuCommand("💾 Export to TXT", exportToFile);
})();
