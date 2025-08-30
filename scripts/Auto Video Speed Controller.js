// ==UserScript==
// @name         Auto Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      1.23
// @description  Tự động điều chỉnh tốc độ video và thêm controls + hotkeys (Shift+., Shift+,, Shift+/). Bản tối ưu hiệu năng (no setInterval, hotkeys throttle)
// @author       ThanhPN (mod by request)
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @exclude      https://tv.garden/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // --- Biến trạng thái và cấu hình ---
  let defaultSpeed = 2;
  let isEnabled = true;
  const LISTENER_ATTRIBUTE = "data-speed-listener-added"; // Đánh dấu video đã gắn listener

  // --- Cache DOM Elements ---
  let speedControlElement = null;
  let toggleSpeedButton = null;
  let speedUpButton = null;
  let speedDownButton = null;
  let showZoneElement = null;

  // --- Utils hiệu năng ---
  const raf = window.requestAnimationFrame || ((cb) => setTimeout(cb, 16));
  let visibilityRafQueued = false;
  function scheduleVisibilityCheck() {
    if (visibilityRafQueued) return;
    visibilityRafQueued = true;
    raf(() => {
      visibilityRafQueued = false;
      checkAndToggleControlVisibility();
    });
  }

  function throttle(fn, wait) {
    let last = 0; let timer = null; let lastArgs; 
    return function throttled(...args) {
      const now = Date.now();
      lastArgs = args;
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        fn.apply(this, lastArgs);
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null; last = Date.now();
          fn.apply(this, lastArgs);
        }, remaining);
      }
    };
  }

  // --- Hàm xử lý chính ---

  // Áp dụng tốc độ và thêm listener cho một video cụ thể
  function applySpeedToVideo(video) {
    if (!video || video.hasAttribute(LISTENER_ATTRIBUTE)) return;

    video.playbackRate = isEnabled ? defaultSpeed : 1;

    video.addEventListener("ratechange", handleRateChange);
    video.setAttribute(LISTENER_ATTRIBUTE, "true");
  }

  // Xử lý sự kiện ratechange
  function handleRateChange(event) {
    const video = event.target;
    if (isEnabled && video.playbackRate !== defaultSpeed) {
      setTimeout(() => { if (isEnabled) video.playbackRate = defaultSpeed; }, 0);
    }
  }

  // Áp dụng tốc độ cho tất cả video hiện có
  function applySpeedToAllExistingVideos() {
    document.querySelectorAll("video").forEach((video) => {
      const targetRate = isEnabled ? defaultSpeed : 1;
      if (video.playbackRate !== targetRate) video.playbackRate = targetRate;
      if (!video.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToVideo(video);
    });
  }

  // Chỉ áp dụng cho video "liên quan" (đang phát hoặc sẵn sàng)
  function applySpeedToActiveVideos() {
    document.querySelectorAll("video").forEach((video) => {
      if (!isEnabled) return; // chỉ dùng khi đang bật
      if (!video.paused || video.readyState > 0) {
        if (video.playbackRate !== defaultSpeed) video.playbackRate = defaultSpeed;
        if (!video.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToVideo(video);
      }
    });
  }

  // Cập nhật hiển thị nút toggle
  function updateToggleButton() {
    if (toggleSpeedButton) {
      toggleSpeedButton.textContent = isEnabled ? `Speed: ${defaultSpeed}x` : "Speed: OFF";
    }
  }

  // Điều chỉnh speed
  function adjustSpeed(change) {
    if (!isEnabled) return;
    defaultSpeed = Math.min(Math.max(defaultSpeed + change, 0.25), 16);
    updateToggleButton();
    // Chỉ cập nhật video đang phát/sẵn sàng để nhẹ hơn
    applySpeedToActiveVideos();
  }

  // Bật/tắt điều khiển speed (Shift+/ cũng reset về defaultSpeed)
  function toggleSpeedControl() {
    isEnabled = !isEnabled;
    if (isEnabled) {
      defaultSpeed = 1.5; // reset về defaultSpeed khi bật lại
    }
    updateToggleButton();
    // Toggle không diễn ra liên tục, có thể áp dụng cho toàn bộ cho chắc chắn
    applySpeedToAllExistingVideos();
  }

  // Kiểm tra sự tồn tại của video để ẩn/hiện control panel
  function checkAndToggleControlVisibility() {
    if (!speedControlElement) return;
    const videosExist = document.querySelector("video") !== null;
    speedControlElement.style.display = videosExist ? "flex" : "none";
  }

  // Tạo control panel và các thành phần UI
  function createSpeedControl() {
    const container = document.createElement("div");

    // Tạo container chính
    const controlContainer = document.createElement("div");
    controlContainer.id = "speed-control-container";
    controlContainer.style.cssText = "position: fixed; bottom: 0; left: 0; width: 0; height: 0; z-index: 9998;";

    // Tạo show zone
    const showZone = document.createElement("div");
    showZone.id = "speed-control-show-zone";
    showZone.style.cssText = "position: absolute; bottom: 0; left: 0; width: 50px; height: 100px; cursor: pointer;";

    // Tạo panel
    const panel = document.createElement("div");
    panel.id = "speed-control-panel";
    panel.style.cssText = "position: absolute; bottom: 50px; left: -100px; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 5px; z-index: 9999; color: white; display: none; flex-direction: row; gap: 5px; transition: left 0.3s ease-in-out;";

    // Tạo các buttons
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "speed-control-toggle";
    toggleBtn.textContent = `Speed: ${defaultSpeed}x`;
    toggleBtn.style.cssText = "padding: 5px 8px; border: none; background-color: #555; color: white; border-radius: 3px; cursor: pointer;";

    const upBtn = document.createElement("button");
    upBtn.id = "speed-control-up";
    upBtn.textContent = "+";
    upBtn.style.cssText = "padding: 5px 8px; border: none; background-color: #555; color: white; border-radius: 3px; cursor: pointer;";

    const downBtn = document.createElement("button");
    downBtn.id = "speed-control-down";
    downBtn.textContent = "-";
    downBtn.style.cssText = "padding: 5px 8px; border: none; background-color: #555; color: white; border-radius: 3px; cursor: pointer;";

    // Ghép các elements lại
    panel.appendChild(toggleBtn);
    panel.appendChild(upBtn);
    panel.appendChild(downBtn);
    controlContainer.appendChild(showZone);
    controlContainer.appendChild(panel);
    container.appendChild(controlContainer);
    document.body.appendChild(container);

    // Cache elements
    speedControlElement = panel;
    showZoneElement = showZone;
    toggleSpeedButton = toggleBtn;
    speedUpButton = upBtn;
    speedDownButton = downBtn;

    // --- Gắn sự kiện cho UI ---
    showZoneElement.addEventListener("mouseenter", () => {
      if (speedControlElement.style.display === "flex") {
        speedControlElement.style.left = "10px"; // Hiện panel
      }
    });

    controlContainer.addEventListener("mouseleave", () => {
      speedControlElement.style.left = "-100px"; // Ẩn panel
    });

    toggleSpeedButton.onclick = toggleSpeedControl;
    speedUpButton.onclick = () => adjustSpeed(0.25);
    speedDownButton.onclick = () => adjustSpeed(-0.25);

    // Kiểm tra video ban đầu (không dùng setInterval nữa)
    checkAndToggleControlVisibility();
  }

  // --- Observer để theo dõi video mới ---
  const observer = new MutationObserver((mutationsList) => {
    let needVisibilityUpdate = false;
    for (const mutation of mutationsList) {
      if (mutation.type !== "childList") continue;

      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === "VIDEO") {
          applySpeedToVideo(node);
          needVisibilityUpdate = true;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          node.querySelectorAll(`video:not([${LISTENER_ATTRIBUTE}])`).forEach(applySpeedToVideo);
          if (node.querySelector && node.querySelector("video")) needVisibilityUpdate = true;
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node.nodeName === "VIDEO" || (node.nodeType === Node.ELEMENT_NODE && node.querySelector && node.querySelector("video"))) {
          needVisibilityUpdate = true;
        }
      });
    }
    if (needVisibilityUpdate) scheduleVisibilityCheck();
  });

  // --- Khởi tạo ---
  createSpeedControl(); // Tạo UI trước
  applySpeedToAllExistingVideos(); // Áp dụng tốc độ cho video có sẵn khi script chạy

  // Bắt đầu observe body cho các thay đổi con và trong cây con
  observer.observe(document.body, { childList: true, subtree: true });

  // --- Hotkeys ---
  // Shift + .  => tăng tốc 0.25x (throttle)
  // Shift + ,  => giảm tốc 0.25x (throttle)
  // Shift + /  => bật/tắt auto speed (reset về defaultSpeed khi bật)
  const throttledAdjustUp = throttle(() => adjustSpeed(0.25), 60);
  const throttledAdjustDown = throttle(() => adjustSpeed(-0.25), 60);

  document.addEventListener("keydown", (e) => {
    if (!e.shiftKey) return; // chỉ xử lý khi giữ Shift

    const target = e.target || {};
    const tag = (target.tagName || "").toLowerCase();
    const isEditable = target.isContentEditable || tag === "input" || tag === "textarea" || tag === "select";
    if (isEditable) return; // không bắt phím khi đang gõ

    switch (e.code) {
      case "Period": // phím .
        throttledAdjustUp();
        e.preventDefault();
        break;
      case "Comma": // phím ,
        throttledAdjustDown();
        e.preventDefault();
        break;
      case "Slash": // phím /
        toggleSpeedControl();
        e.preventDefault();
        break;
      default:
        break;
    }
  });

})();
