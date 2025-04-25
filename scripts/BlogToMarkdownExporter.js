// ==UserScript==
// @name         Blog to Markdown Exporter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Export blog content to Markdown from Medium and similar sites
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/BlogToMarkdownExporter.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/BlogToMarkdownExporter.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://*.medium.com/*
// @match        https://readmedium.com/*
// @grant        GM_registerMenuCommand
// @grant        GM_setClipboard
// @grant        GM_download
// @require      https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.1/turndown.min.js
// ==/UserScript==

(function () {
  "use strict";

  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });

  turndownService.addRule("figures", {
    filter: "figure",
    replacement: function (content, node) {
      const img = node.querySelector("img");
      const caption = node.querySelector("figcaption");
      if (img) {
        const imgMd = `![${caption ? caption.textContent : ""}](${img.src})`;
        return `${imgMd}\n\n`;
      }
      return "";
    },
  });

  function extractContent() {
    let article;
    if (window.location.hostname.includes("medium.com")) {
      article = document.querySelector("article");
    } else if (window.location.hostname.includes("readmedium.com")) {
      article = document.querySelector(".prose");
    }

    if (!article) {
      alert("Không tìm thấy nội dung bài viết!");
      return;
    }

    const title = document.title;
    const author =
      document.querySelector('[rel="author"]')?.textContent || "Unknown";
    const date = new Date().toISOString().split("T")[0];
    const filename = `${
      window.location.pathname.split("/").pop() || "article"
    }.md`;

    let markdown = `---
title: ${title}
author: ${author}
date: ${date}
---

`;
    markdown += turndownService.turndown(article);

    // Tạo một đối tượng Blob với nội dung markdown
    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });

    // Tải file trực tiếp
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Chỉ giữ lại menu command
  GM_registerMenuCommand("Export to Markdown", extractContent);
})();
