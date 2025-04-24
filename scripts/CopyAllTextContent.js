// ==UserScript==
// @name         Copy All Text Content
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Copy toàn bộ nội dung text từ transcript
// @author       ThanhPN
// @match        https://notebooklm.google.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
  "use strict";

  let observer;
  let copyBtn;

  // Styles cho các thành phần
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
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
      `,
    button: `
        padding: 12px 24px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        transition: all 0.3s;
      `,
    exportButton: `
        padding: 12px 24px;
        background: #2196F3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 18px;
        font-weight: bold;
        transition: all 0.3s;
        margin-left: 10px;
      `,
  };

  function createCopyButton() {
    try {
      const oldButton = document.getElementById("copy-control");
      if (oldButton) oldButton.remove();

      const html = `
          <div id="copy-control" style="${styles.container}">
            <button id="copy-btn" style="${styles.button}">Copy All Text</button>
            <button id="export-btn" style="${styles.exportButton}">Export TXT</button>
          </div>
        `;

      const template = document.createElement("template");

      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        const policy = window.trustedTypes.createPolicy("copyButtonTemplate", {
          createHTML: (string) => string,
        });
        template.innerHTML = policy.createHTML(html);
      } else {
        template.innerHTML = html;
      }

      const container = template.content.cloneNode(true);
      document.body.appendChild(container);

      copyBtn = document.getElementById("copy-btn");
      copyBtn.onclick = copyAllContent;

      copyBtn.onmouseover = () => {
        copyBtn.style.transform = "scale(1.1)";
        copyBtn.style.background = "#45a049";
      };
      copyBtn.onmouseout = () => {
        copyBtn.style.transform = "scale(1)";
        copyBtn.style.background = "#4CAF50";
      };

      const exportBtn = document.getElementById("export-btn");
      exportBtn.onclick = exportToTxt;

      exportBtn.onmouseover = () => {
        exportBtn.style.transform = "scale(1.1)";
        exportBtn.style.background = "#1976D2";
      };
      exportBtn.onmouseout = () => {
        exportBtn.style.transform = "scale(1)";
        exportBtn.style.background = "#2196F3";
      };
    } catch (error) {
      console.error("Lỗi khi tạo nút copy:", error);
    }
  }

  async function copyAllContent() {
    try {
      // Lấy container có class panel-content
      const activeContainer = document.querySelector(
        '[class^="panel-content source-panel-view-content"]'
      );

      if (!activeContainer) {
        console.warn("Không tìm thấy panel content");
        copyBtn.textContent = "No content!";
        copyBtn.style.background = "#f44336";
        setTimeout(() => {
          copyBtn.textContent = "Copy All Text";
          copyBtn.style.background = "#4CAF50";
        }, 2000);
        return;
      }

      // Lấy text từ panel content
      const textElements = activeContainer.querySelectorAll("*");
      const allText = Array.from(textElements)
        .filter((el) => el.textContent?.trim())
        .map((el) => el.textContent.trim())
        .join("\n");

      if (!allText) {
        console.warn("Không tìm thấy nội dung để copy");
        copyBtn.textContent = "No content!";
        copyBtn.style.background = "#f44336";
        setTimeout(() => {
          copyBtn.textContent = "Copy All Text";
          copyBtn.style.background = "#4CAF50";
        }, 2000);
        return;
      }

      // Sử dụng Clipboard API
      await navigator.clipboard.writeText(allText);

      // UI feedback
      copyBtn.textContent = "Copied!";
      copyBtn.style.background = "#45a049";

      setTimeout(() => {
        copyBtn.textContent = "Copy All Text";
        copyBtn.style.background = "#4CAF50";
      }, 2000);
    } catch (error) {
      console.error("Lỗi khi copy:", error);

      // Fallback method
      const textArea = document.createElement("textarea");
      textArea.value = allText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy All Text"), 2000);
    }
  }

  function exportToTxt() {
    try {
      const activeContainer = document.querySelector(
        '[class^="panel-content source-panel-view-content"]'
      );

      if (!activeContainer) {
        alert("Không tìm thấy nội dung để xuất!");
        return;
      }

      const textElements = activeContainer.querySelectorAll("*");
      const allText = Array.from(textElements)
        .filter((el) => el.textContent?.trim())
        .map((el) => el.textContent.trim())
        .join("\n");

      if (!allText) {
        alert("Không có nội dung để xuất!");
        return;
      }

      const blob = new Blob([allText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "content_" + new Date().toISOString().slice(0, 10) + ".txt";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Lỗi khi xuất file:", error);
      alert("Có lỗi khi xuất file!");
    }
  }

  function initObserver() {
    try {
      observer?.disconnect();

      const mainContainer =
        document.querySelector("labs-tailwind-doc-viewer") || document.body;

      const config = {
        childList: true,
        subtree: true,
        attributes: true,
      };

      observer = new MutationObserver(() => {
        if (!document.getElementById("copy-control")) {
          requestAnimationFrame(createCopyButton);
        }
      });

      observer.observe(mainContainer, config);
      createCopyButton();
    } catch (error) {
      console.error("Lỗi khởi tạo observer:", error);
    }
  }

  // Khởi tạo script
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initObserver);
  } else {
    initObserver();
  }
})();
