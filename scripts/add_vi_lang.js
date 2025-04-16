// ==UserScript==
// @name         Add language in Google services url
// @namespace    http://tampermonkey.net/
// @version      2.3
// @description  Tự động thêm ?hl=vi vào URL khi truy cập các dịch vụ của Google, ngoại trừ các trang trong whitelist.
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @exclude        *://*accounts.google.com/*
// @exclude        *://*firebase.google.com/*
// @match        *://*.google.com/*
// @match        *://*.notebooklm.google.com/*
// @match        *://*.aistudio.google.com/*
// @match        *://*.gemini.google.com/*

// ==/UserScript==

(function () {
  "use strict";

  // Danh sách các domain không cần thêm tham số ngôn ngữ
  const excludedDomains = [
    "mail.google.com",
    "calendar.google.com",
    "drive.google.com",
    "docs.google.com",
    "meet.google.com",
  ];

  // Thêm hàm xử lý URL
  function processUrl() {
    if (
      !window.location.href.includes("?hl=vi") &&
      !window.location.href.includes("&hl=vi") &&
      !excludedDomains.some((domain) => window.location.hostname === domain)
    ) {
      const separator = window.location.href.includes("?") ? "&" : "?";
      const newUrl = window.location.href + separator + "hl=vi";
      history.pushState(null, "", newUrl);
    }
  }

  // Theo dõi thay đổi URL
  const observer = new MutationObserver(() => {
    processUrl();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Xử lý lần đầu load trang
  processUrl();
})();
