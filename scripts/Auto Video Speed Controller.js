// ==UserScript==
// @name         Auto Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      1.14
// @description  Tự động điều chỉnh tốc độ video và thêm controls
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Biến lưu trạng thái
  let defaultSpeed = 2.0;
  let isEnabled = true;

  // Tạo control panel
  function createSpeedControl() {
    const container = document.createElement("div");
    container.innerHTML = `
        <div id="speed-control" style="
            position: fixed;
            top: 100px;
            right: -80px; /* Ban đầu ẩn sang phải */
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
            z-index: 9999;
            color: white;
            transition: right 0.3s; /* Hiệu ứng transition */
            display: flex;
            gap: 5px;
        ">
            <button id="toggle-speed">Speed: ${defaultSpeed}x</button>
            <button id="speed-up">+</button>
            <button id="speed-down">-</button>
        </div>
    `;
    document.body.appendChild(container);

    // Thêm xử lý hover
    const speedControl = container.querySelector("#speed-control");

    // Hiện khi hover vào vùng cạnh phải
    const showZone = document.createElement("div");
    showZone.style.cssText = `
      position: fixed;
      top: 0;
      right: 0;
      width: 50px;
      height: 100vh;
      z-index: 9998;
    `;
    document.body.appendChild(showZone);

    showZone.addEventListener("mouseenter", () => {
      speedControl.style.right = "20px";
    });

    // Ẩn khi rời khỏi control
    speedControl.addEventListener("mouseleave", () => {
      speedControl.style.right = "-80px";
    });

    // Thêm sự kiện cho các nút
    document.getElementById("toggle-speed").onclick = toggleSpeedControl;
    document.getElementById("speed-up").onclick = () => adjustSpeed(0.25);
    document.getElementById("speed-down").onclick = () => adjustSpeed(-0.25);
  }

  // Điều chỉnh speed
  function adjustSpeed(change) {
    if (!isEnabled) return;
    defaultSpeed = Math.min(Math.max(defaultSpeed + change, 0.25), 16);
    document.getElementById(
      "toggle-speed"
    ).textContent = `Speed: ${defaultSpeed}x`;
    applySpeedToVideos();
  }

  // Bật/tắt điều khiển speed
  function toggleSpeedControl() {
    isEnabled = !isEnabled;
    if (isEnabled) {
      applySpeedToVideos();
    } else {
      // Reset về 1x
      getAllVideos().forEach((video) => (video.playbackRate = 1));
    }
  }

  // Lấy tất cả video elements
  function getAllVideos() {
    return document.querySelectorAll("video");
  }

  // Áp dụng speed cho videos
  function applySpeedToVideos() {
    if (!isEnabled) return;
    getAllVideos().forEach((video) => {
      video.playbackRate = defaultSpeed;

      // Thêm listener để giữ speed khi video load lại
      video.addEventListener("ratechange", () => {
        if (video.playbackRate !== defaultSpeed && isEnabled) {
          video.playbackRate = defaultSpeed;
        }
      });
    });
  }

  // Khởi tạo
  createSpeedControl();

  // Observer để theo dõi video mới
  const observer = new MutationObserver(() => {
    if (isEnabled) applySpeedToVideos();
  });

  // Bắt đầu observe
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Check định kỳ
  setInterval(applySpeedToVideos, 2000);
})();
