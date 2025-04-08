// ==UserScript==
// @name         Auto Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động điều chỉnh tốc độ video và thêm controls
// @author       Your name
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  // Biến lưu trạng thái
  let defaultSpeed = 2.0;
  let isEnabled = true;

  // Tạo control panel
  function createSpeedControl() {
      const container = document.createElement('div');
      container.innerHTML = `
          <div id="speed-control" style="
              position: fixed;
              top: 20px;
              right: 20px;
              background: rgba(0,0,0,0.8);
              padding: 10px;
              border-radius: 5px;
              z-index: 9999;
              color: white;
          ">
              <button id="toggle-speed">Speed: ${defaultSpeed}x</button>
              <button id="speed-up">+</button>
              <button id="speed-down">-</button>
          </div>
      `;
      document.body.appendChild(container);

      // Thêm sự kiện cho các nút
      document.getElementById('toggle-speed').onclick = toggleSpeedControl;
      document.getElementById('speed-up').onclick = () => adjustSpeed(0.25);
      document.getElementById('speed-down').onclick = () => adjustSpeed(-0.25);
  }

  // Điều chỉnh speed
  function adjustSpeed(change) {
      if (!isEnabled) return;
      defaultSpeed = Math.min(Math.max(defaultSpeed + change, 0.25), 16);
      document.getElementById('toggle-speed').textContent = `Speed: ${defaultSpeed}x`;
      applySpeedToVideos();
  }

  // Bật/tắt điều khiển speed
  function toggleSpeedControl() {
      isEnabled = !isEnabled;
      if (isEnabled) {
          applySpeedToVideos();
      } else {
          // Reset về 1x
          getAllVideos().forEach(video => video.playbackRate = 1);
      }
  }

  // Lấy tất cả video elements
  function getAllVideos() {
      return document.querySelectorAll('video');
  }

  // Áp dụng speed cho videos
  function applySpeedToVideos() {
      if (!isEnabled) return;
      getAllVideos().forEach(video => {
          video.playbackRate = defaultSpeed;

          // Thêm listener để giữ speed khi video load lại
          video.addEventListener('ratechange', () => {
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
      subtree: true
  });

  // Check định kỳ
  setInterval(applySpeedToVideos, 2000);
})();
