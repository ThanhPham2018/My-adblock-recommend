// ==UserScript==
// @name         Add language in Google services url (no high browser load)
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Tự động thêm ?hl=vi vào URL khi truy cập các dịch vụ của Google, ngoại trừ các trang trong whitelist. Không gây cao tải trình duyệt.
// @author       ThanhPN & Nguyễn Đức Nguyện (optimize)
// @downloadURL  https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @updateURL    https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @homepageURL  https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @exclude      *://*accounts.google.com/*
// @exclude      *://*firebase.google.com/*
// @match        *://*.google.com/*
// @match        *://*.notebooklm.google.com/*
// @match        *://*.aistudio.google.com/*
// @match        *://*.gemini.google.com/*
// ==/UserScript==

(function () {
  "use strict";

const excludedDomains = [
    "mail.google.com",
    "calendar.google.com",
    "drive.google.com",
    "docs.google.com",
    "meet.google.com",
  ];

function shouldAddLangParam() {
    const { hostname, href } = window.location;
    return (
      !href.includes("?hl=vi") &&
      !href.includes("&hl=vi") &&
      !excludedDomains.includes(hostname)
    );
  }

function addLangParam() {
    if (shouldAddLangParam()) {
      const { href } = window.location;
      const separator = href.includes("?") ? "&" : "?";
      const newUrl = href + separator + "hl=vi";
      // Sử dụng replaceState để tránh push vào lịch sử
      history.replaceState(null, "", newUrl);
    }
  }

// Chạy khi trang load
  addLangParam();

// Theo dõi thay đổi URL (SPA navigation)
  let lastUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      addLangParam();
    }
  }, 500);

// Đảm bảo chạy cả khi back/forward
  window.addEventListener("popstate", addLangParam);
})();
