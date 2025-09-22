// ==UserScript==
// @name         Add language in Google services url (no high browser load)
// @namespace    http://tampermonkey.net/
// @version      2.5
// @description  Tự động thêm ?hl=vi vào URL khi truy cập các dịch vụ của Google, ngoại trừ whitelist. Không gây cao tải trình duyệt.
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

  // Whitelist nội bộ (bổ sung cho @exclude nếu cần)
  const excludedHosts = new Set([
    "mail.google.com",
    "calendar.google.com",
    "drive.google.com",
    "docs.google.com",
    "meet.google.com",
  ]);

  let lastAppliedUrl = ""; // tránh lặp vô hạn khi tự replaceState

  function shouldProcess(urlObj) {
    const host = urlObj.hostname;
    if (excludedHosts.has(host)) return false;

    const sp = urlObj.searchParams;
    // Giữ nguyên logic: chỉ thêm khi CHƯA có hl=vi; không đụng vào hl khác.
    const hasHlVi =
      (sp.has("hl") && sp.get("hl") === "vi") ||
      // phòng trường hợp URL chứa thủ công ?hl=vi&... theo thứ tự lạ nhưng vẫn parse được
      false;

    return !hasHlVi;
  }

  function addLangParamIfNeeded() {
    const href = window.location.href;
    if (href === lastAppliedUrl) return;

    let urlObj;
    try {
      urlObj = new URL(href);
    } catch {
      return; // URL không hợp lệ → bỏ qua an toàn
    }

    if (!shouldProcess(urlObj)) return;

    // Nếu đã có ? thì thêm &hl=vi; nếu chưa có thì ?hl=vi (URLSearchParams sẽ lo phần encode)
    if (!urlObj.searchParams.has("hl")) {
      urlObj.searchParams.append("hl", "vi");
    } else if (urlObj.searchParams.get("hl") === "") {
      // góc cạnh hiếm: có 'hl=' rỗng
      urlObj.searchParams.set("hl", "vi");
    } else {
      // có 'hl' khác 'vi' → theo giữ nguyên hành vi, KHÔNG đổi
      return;
    }

    const newUrl = urlObj.toString();
    if (newUrl !== href) {
      lastAppliedUrl = newUrl;
      // replaceState để không đẩy vào lịch sử
      history.replaceState(null, "", newUrl);
    }
  }

  // --- Hook các đường điều hướng không cần polling ---
  const _pushState = history.pushState;
  history.pushState = function (...args) {
    const ret = _pushState.apply(this, args);
    queueMicrotask(addLangParamIfNeeded);
    return ret;
  };

  const _replaceState = history.replaceState;
  history.replaceState = function (...args) {
    const ret = _replaceState.apply(this, args);
    queueMicrotask(addLangParamIfNeeded);
    return ret;
  };

  window.addEventListener("popstate", addLangParamIfNeeded);
  window.addEventListener("hashchange", addLangParamIfNeeded);

  // Chạy ngay khi script nạp
  addLangParamIfNeeded();

  // Trường hợp một số SPA cập nhật URL sau vòng event hiện tại
  // → đảm bảo bắt kịp mà không cần setInterval
  requestAnimationFrame(addLangParamIfNeeded);
})();
