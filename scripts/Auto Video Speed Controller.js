// ==UserScript==
// @name         Auto Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      1.18
// @description  Tự động điều chỉnh tốc độ video và thêm controls (Optimized)
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // --- Biến trạng thái và cấu hình ---
  let defaultSpeed = 1.75;
  let isEnabled = true;
  const LISTENER_ATTRIBUTE = "data-speed-listener-added"; // Thuộc tính để đánh dấu listener đã được thêm

  // --- Cache DOM Elements ---
  let speedControlElement = null;
  let toggleSpeedButton = null;
  let speedUpButton = null;
  let speedDownButton = null;
  let showZoneElement = null;

  // --- Hàm xử lý chính ---

  // Lấy tất cả video elements hiện có
  function getAllVideos() {
    return document.querySelectorAll(`video:not([${LISTENER_ATTRIBUTE}])`); // Chỉ lấy video chưa có listener
  }

  // Áp dụng tốc độ và thêm listener cho một video cụ thể
  function applySpeedToVideo(video) {
    if (!video || video.hasAttribute(LISTENER_ATTRIBUTE)) return; // Bỏ qua nếu không phải video hoặc đã có listener

    if (isEnabled) {
      video.playbackRate = defaultSpeed;
    } else {
      video.playbackRate = 1; // Reset nếu đang tắt
    }

    // Thêm listener để giữ speed khi video load lại hoặc bị thay đổi từ bên ngoài
    video.addEventListener("ratechange", handleRateChange);
    video.setAttribute(LISTENER_ATTRIBUTE, "true"); // Đánh dấu đã thêm listener
  }

  // Xử lý sự kiện ratechange
  function handleRateChange(event) {
    const video = event.target;
    // Chỉ can thiệp nếu script đang bật và tốc độ hiện tại khác tốc độ mong muốn
    if (isEnabled && video.playbackRate !== defaultSpeed) {
      // Dùng setTimeout nhỏ để tránh xung đột với các script khác hoặc hành động của người dùng
      setTimeout(() => {
        // Kiểm tra lại isEnabled phòng trường hợp người dùng tắt ngay sau khi ratechange xảy ra
        if (isEnabled) {
          video.playbackRate = defaultSpeed;
        }
      }, 0);
    }
  }

  // Áp dụng tốc độ cho tất cả video hiện có (thường dùng khi bật/tắt hoặc thay đổi tốc độ)
  function applySpeedToAllExistingVideos() {
    const videos = document.querySelectorAll("video"); // Lấy tất cả video, kể cả đã có listener
    videos.forEach((video) => {
      if (isEnabled) {
        if (video.playbackRate !== defaultSpeed) {
          video.playbackRate = defaultSpeed;
        }
      } else {
        if (video.playbackRate !== 1) {
          video.playbackRate = 1;
        }
      }
      // Đảm bảo listener được gắn nếu chưa có (trường hợp video có sẵn trước khi script chạy)
      if (!video.hasAttribute(LISTENER_ATTRIBUTE)) {
        applySpeedToVideo(video);
      }
    });
  }

  // Cập nhật hiển thị nút toggle
  function updateToggleButton() {
    if (toggleSpeedButton) {
      toggleSpeedButton.textContent = isEnabled
        ? `Speed: ${defaultSpeed}x`
        : "Speed: OFF";
    }
  }

  // Điều chỉnh speed
  function adjustSpeed(change) {
    if (!isEnabled) return; // Không làm gì nếu đang tắt
    defaultSpeed = Math.min(Math.max(defaultSpeed + change, 0.25), 16);
    updateToggleButton();
    applySpeedToAllExistingVideos(); // Áp dụng tốc độ mới cho tất cả video
  }

  // Bật/tắt điều khiển speed
  function toggleSpeedControl() {
    isEnabled = !isEnabled;
    updateToggleButton();
    applySpeedToAllExistingVideos(); // Áp dụng trạng thái mới (speed hoặc 1x)
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
    controlContainer.style.cssText =
      "position: fixed; bottom: 0; left: 0; width: 0; height: 0; z-index: 9998;";

    // Tạo show zone
    const showZone = document.createElement("div");
    showZone.id = "speed-control-show-zone";
    showZone.style.cssText =
      "position: absolute; bottom: 0; left: 0; width: 50px; height: 100px; cursor: pointer;";

    // Tạo panel
    const panel = document.createElement("div");
    panel.id = "speed-control-panel";
    panel.style.cssText =
      "position: absolute; bottom: 20px; left: -100px; background: rgba(0,0,0,0.8); padding: 8px; border-radius: 5px; z-index: 9999; color: white; display: none; flex-direction: row; gap: 5px; transition: left 0.3s ease-in-out;";

    // Tạo các buttons
    const toggleBtn = document.createElement("button");
    toggleBtn.id = "speed-control-toggle";
    toggleBtn.textContent = `Speed: ${defaultSpeed}x`;
    toggleBtn.style.cssText =
      "padding: 5px 8px; border: none; background-color: #555; color: white; border-radius: 3px; cursor: pointer;";

    const upBtn = document.createElement("button");
    upBtn.id = "speed-control-up";
    upBtn.textContent = "+";
    upBtn.style.cssText =
      "padding: 5px 8px; border: none; background-color: #555; color: white; border-radius: 3px; cursor: pointer;";

    const downBtn = document.createElement("button");
    downBtn.id = "speed-control-down";
    downBtn.textContent = "-";
    downBtn.style.cssText =
      "padding: 5px 8px; border: none; background-color: #555; color: white; border-radius: 3px; cursor: pointer;";

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
        // Chỉ hiện nếu panel đang được phép hiển thị (có video)
        speedControlElement.style.left = "10px"; // Hiện panel
      }
    });

    // Sử dụng container bao ngoài để bắt mouseleave, tránh việc rời chuột từ nút ra khoảng trống giữa các nút làm ẩn panel
    controlContainer.addEventListener("mouseleave", () => {
      speedControlElement.style.left = "-100px"; // Ẩn panel
    });

    toggleSpeedButton.onclick = toggleSpeedControl;
    speedUpButton.onclick = () => adjustSpeed(0.25);
    speedDownButton.onclick = () => adjustSpeed(-0.25);

    // Kiểm tra video ban đầu và định kỳ để ẩn/hiện control panel
    checkAndToggleControlVisibility();
    setInterval(checkAndToggleControlVisibility, 1500); // Giảm tần suất kiểm tra một chút
  }

  // --- Observer để theo dõi video mới ---
  const observer = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          // Kiểm tra node được thêm trực tiếp
          if (node.nodeName === "VIDEO") {
            applySpeedToVideo(node);
            checkAndToggleControlVisibility(); // Cập nhật hiển thị control panel khi có video mới
          }
          // Kiểm tra các node con nếu node được thêm là một element khác
          else if (node.nodeType === Node.ELEMENT_NODE) {
            node
              .querySelectorAll(`video:not([${LISTENER_ATTRIBUTE}])`)
              .forEach((video) => {
                applySpeedToVideo(video);
              });
            // Nếu tìm thấy video con thì cũng cập nhật hiển thị control panel
            if (node.querySelector("video")) {
              checkAndToggleControlVisibility();
            }
          }
        });
        // Kiểm tra nếu video bị xóa khỏi DOM thì cũng cập nhật visibility
        mutation.removedNodes.forEach((node) => {
          if (
            node.nodeName === "VIDEO" ||
            (node.nodeType === Node.ELEMENT_NODE && node.querySelector("video"))
          ) {
            checkAndToggleControlVisibility();
          }
        });
      }
    }
  });

  // --- Khởi tạo ---
  createSpeedControl(); // Tạo UI trước
  applySpeedToAllExistingVideos(); // Áp dụng tốc độ cho video có sẵn khi script chạy

  // Bắt đầu observe body cho các thay đổi con và trong cây con
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Không cần setInterval(applySpeedToVideos, 2000) nữa
})();
