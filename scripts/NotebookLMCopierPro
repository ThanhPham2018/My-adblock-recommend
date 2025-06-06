// ==UserScript==
// @name         NotebookLM Copier Pro (Clean)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Sao chép/tải NotebookLM sạch, loại bỏ citation
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/NotebookLMCopierPro.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/NotebookLMCopierPro.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://notebooklm.google.com/*
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==


(function () {
  "use strict";

  GM_registerMenuCommand("Copy phần nguồn", () => exportContent(".source-panel-view-content", false));
  GM_registerMenuCommand("Copy phần tóm tắt", () => exportContent(".ql-editor, labs-tailwind-doc-viewer", false));
  GM_registerMenuCommand("Copy phần tóm tắt (MD)", () => exportContent(".ql-editor, labs-tailwind-doc-viewer", true));
  GM_registerMenuCommand("Tải phần tóm tắt (TXT)", () => exportToFile(".ql-editor, labs-tailwind-doc-viewer", "notebook-summary.txt", false));
  GM_registerMenuCommand("Tải phần tóm tắt (MD)", () => exportToFile(".ql-editor, labs-tailwind-doc-viewer", "notebook-summary.md", true));
  GM_registerMenuCommand("Xem tóm tắt đầy đủ (HTML)", viewFullHTML);

  function exportContent(selector, formatted) {
    const el = document.querySelector(selector);
    if (!el) return notify("Không tìm thấy nội dung!");
    removeCitations(el);
    const text = formatted ? toMarkdownFormatted(el) : toMarkdown(el);
    GM_setClipboard(text, "text");
    notify("Đã sao chép nội dung!");
  }

  function exportToFile(selector, filename, formatted) {
    const el = document.querySelector(selector);
    if (!el) return notify("Không tìm thấy nội dung!");
    removeCitations(el);
    const text = formatted ? toMarkdownFormatted(el) : toMarkdown(el);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    notify("Đã tải xuống!");
  }

  function viewFullHTML() {
    const el = document.querySelector(".ql-editor, labs-tailwind-doc-viewer");
    if (!el) return notify("Không tìm thấy nội dung!");

    const cloned = el.cloneNode(true);
    removeCitations(cloned);

    const html = `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Tóm tắt đầy đủ</title>
        <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
        <style>
          body {
            padding: 40px;
            font-family: "Segoe UI", Roboto, sans-serif;
            background: #fff;
            max-width: 960px;
            margin: auto;
            line-height: 1.6;
          }
          .ql-editor { padding: 0; }
          labs-tailwind-doc-viewer { display: block; margin-top: 20px; }
          labs-tailwind-structural-element-view-v2 {
            display: flex; flex-direction: row; margin-bottom: 0.5rem;
          }
          .paragraph { display: inline-block; width: calc(100% - 2rem); }
          .bold { font-weight: bold; }
          .code {
            font-family: monospace;
            background: #f5f5f5;
            padding: 0 4px;
            border-radius: 4px;
          }
          pre > code {
            display: block;
            background: #f5f5f5;
            padding: 12px;
            border-radius: 6px;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <h1>Tóm tắt đầy đủ</h1>
        ${cloned.outerHTML}
      </body>
    </html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }

  function removeCitations(container) {
    container.querySelectorAll(".citation-marker").forEach(btn => btn.remove());
  }

  function toMarkdown(el) {
    let out = "";
    if (el.classList.contains("ql-editor")) {
      el.childNodes.forEach((n) => {
        const tag = n.tagName?.toLowerCase();
        if (tag?.startsWith("h")) out += `${"#".repeat(+tag[1])} ${n.textContent.trim()}\n\n`;
        else if (tag === "p") out += n.textContent.trim() + "\n\n";
        else if (tag === "ul" || tag === "ol") {
          const ordered = tag === "ol";
          n.querySelectorAll("li").forEach((li, i) => {
            const indent = "  ".repeat((li.className.match(/ql-indent-(\d+)/)?.[1] || 0));
            const bullet = ordered ? `${i + 1}.` : "-";
            out += `${indent}${bullet} ${li.textContent.trim()}\n`;
          });
          out += "\n";
        }
      });
    } else if (el.tagName?.toLowerCase() === "labs-tailwind-doc-viewer") {
      el.querySelectorAll("labs-tailwind-structural-element-view-v2").forEach((b) => {
        const pre = b.querySelector("pre > code");
        if (pre) out += "```\n" + pre.textContent.trim() + "\n```\n\n";
        const para = b.querySelector(".paragraph");
        if (para) {
          const indent = "  ".repeat(Math.floor((+window.getComputedStyle(para).marginLeft.replace("px", "") || 0) / 20));
          const spans = Array.from(para.querySelectorAll("span"));
          const text = spans.map(s => s.textContent.trim()).join(" ").replace(/\s+/g, " ");
          if (text) out += `${indent}${text}\n\n`;
        }
      });
    } else if (el.classList.contains("source-panel-view-content")) {
      el.querySelectorAll(".paragraph span[data-start-index]").forEach(span => {
        out += span.textContent.trim() + "\n\n";
      });
    }
    return out.trim();
  }

  function toMarkdownFormatted(el) {
    function fmtSpan(s) {
      if (s.matches(".code")) return "`" + s.textContent.trim() + "`";
      if (s.matches(".bold")) return "**" + s.textContent.trim() + "**";
      return s.textContent.trim();
    }
    let out = "";
    if (el.classList.contains("ql-editor")) {
      el.childNodes.forEach((n) => {
        const tag = n.tagName?.toLowerCase();
        if (tag === "p" || tag?.startsWith("h")) out += n.textContent.trim() + "\n\n";
        else if (tag === "ul" || tag === "ol") {
          const ord = tag === "ol";
          n.querySelectorAll("li").forEach((li, i) => {
            const bullet = ord ? `${i + 1}.` : "-";
            out += `${bullet} ${li.textContent.trim()}\n`;
          });
          out += "\n";
        }
      });
    } else if (el.tagName?.toLowerCase() === "labs-tailwind-doc-viewer") {
      el.querySelectorAll("labs-tailwind-structural-element-view-v2").forEach(b => {
        const pre = b.querySelector("pre > code");
        if (pre) out += "```\n" + pre.textContent.trim() + "\n```\n\n";
        const para = b.querySelector(".paragraph");
        if (para) {
          const indent = "  ".repeat(Math.floor((+window.getComputedStyle(para).marginLeft.replace("px", "") || 0) / 20));
          const text = Array.from(para.querySelectorAll("span")).map(fmtSpan).join(" ").replace(/\s+/g, " ");
          if (text) out += `${indent}${text}\n\n`;
        }
      });
    }
    return out.trim();
  }

  function notify(msg) {
    const note = document.createElement("div");
    note.textContent = msg;
    note.style.cssText = "position:fixed;bottom:20px;right:20px;background:#4CAF50;color:white;padding:10px;border-radius:5px;z-index:10000;";
    document.body.appendChild(note);
    setTimeout(() => { note.style.opacity = "0"; setTimeout(() => note.remove(), 500); }, 2000);
  }
})();
