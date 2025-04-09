// ==UserScript==
// @name         Video URL Extractor
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Tự động lấy URL video và tạo lệnh ffmpeg
// @author       You
// @match        https://*.microsoftstream.com/*
// @match        https://*.sharepoint.com/*
// @match        https://*.office.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function () {
  "use strict";

  // Tạo button
  const btn = document.createElement("button");
  btn.innerHTML = "📋 Copy FFmpeg Command";
  btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 10px;
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    `;

  // Thêm xử lý click
  btn.addEventListener("click", () => {
    // Theo dõi Network requests
    let foundUrl = "";

    // Lấy URL từ Network requests
    const entries = performance.getEntriesByType("resource");
    for (let entry of entries) {
      if (entry.name.includes("videomanifest")) {
        foundUrl = entry.name;
        break;
      }
    }

    if (!foundUrl) {
      alert("Không tìm thấy URL video!");
      return;
    }

    // Thay thế đoạn xử lý URL cũ
    const cleanUrl = foundUrl.split('&alt')[0];

    // Tạo lệnh ffmpeg
    const filename = "video_" + new Date().getTime() + ".mp4";
    const ffmpegCmd = `ffmpeg -i "${cleanUrl}" "${filename}"`;

    // Copy vào clipboard
    GM_setClipboard(ffmpegCmd);

    // Thông báo
    alert("Đã copy lệnh ffmpeg:\n" + ffmpegCmd);
  });

  // Thêm button vào trang
  document.body.appendChild(btn);
})();
