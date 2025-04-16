// ==UserScript==
// @name         Add language in Google services url
// @namespace    http://tampermonkey.net/
// @version      2.2
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

  // Danh sách các domain không cần thêm tham số ngôn ngữ (dùng Set để tối ưu hiệu suất)
  const excludedDomains = new Set([
    "mail.google.com",
    "calendar.google.com",
    "drive.google.com",
    "docs.google.com",
    "meet.google.com",
    "chat.google.com",
    "photos.google.com",
    "keep.google.com",
    "contacts.google.com",
    "translate.google.com",
    "classroom.google.com",
    "firebase.google.com",
    "cloud.google.com",
    "analytics.google.com",
  ]);

  // Tránh redirect loop bằng cách kiểm tra session storage
  const REDIRECT_FLAG = "redirectAttempted";

  // Kiểm tra xem domain hiện tại có nằm trong danh sách loại trừ không
  if (excludedDomains.has(window.location.hostname)) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has("hl") && !sessionStorage.getItem(REDIRECT_FLAG)) {
    // Đánh dấu đã thử redirect để tránh vòng lặp
    sessionStorage.setItem(REDIRECT_FLAG, "true");

    // Tạo URL mới với tham số ngôn ngữ
    const separator = window.location.href.includes("?") ? "&" : "?";
    const newUrl = window.location.href + separator + "hl=vi";

    // Thực hiện redirect
    window.location.href = newUrl;
  }

  // Clear redirect flag sau 5 giây để cho phép thử lại nếu cần
  setTimeout(() => {
    sessionStorage.removeItem(REDIRECT_FLAG);
  }, 3000); // 3s thay vì 5s để trải nghiệm mượt hơn
})();
