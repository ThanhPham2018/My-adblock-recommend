// ==UserScript==
// @name         Auto Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      1.16
// @description  Tự động điều chỉnh tốc độ video và thêm controls
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  let defaultSpeed = 2.0;
  let isEnabled = true;
  let speedControlElement = null;

  function createSpeedControl() {
    const container = document.createElement("div");
    container.innerHTML = `
            <div id="speed-control" style="
                position: fixed;
                bottom: 20px;
                left: -80px;
                background: rgba(0,0,0,0.8);
                padding: 10px;
                border-radius: 5px;
                z-index: 9999;
                color: white;
                transition: left 0.3s, opacity 0.3s;
                display: none;
                gap: 5px;
            ">
                <button id="toggle-speed">Speed: ${defaultSpeed}x</button>
                <button id="speed-up">+</button>
                <button id="speed-down">-</button>
            </div>
        `;
    document.body.appendChild(container);

    speedControlElement = container.querySelector("#speed-control");

    const showZone = document.createElement("div");
    showZone.style.cssText = `
          position: fixed;
          bottom: 0;
          left: 0;
          width: 50px;
          height: 100px;
          z-index: 9998;
        `;
    document.body.appendChild(showZone);

    function updateControlVisibility() {
      if (!speedControlElement) return;
      const videos = getAllVideos();
      if (videos.length > 0) {
        speedControlElement.style.display = "flex";
      } else {
        speedControlElement.style.display = "none";
        speedControlElement.style.left = "-80px";
      }
    }

    updateControlVisibility();

    showZone.addEventListener("mouseenter", () => {
      if (speedControlElement && speedControlElement.style.display === "flex") {
        speedControlElement.style.left = "20px";
      }
    });

    // Thêm event mouseleave cho showZone
    showZone.addEventListener("mouseleave", () => {
      // Chờ 1 giây rồi kiểm tra xem chuột có đang ở trên speedControl không
      setTimeout(() => {
        const rect = speedControlElement.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;

        // Nếu chuột không nằm trong vùng speedControl thì trượt vào
        if (
          !(
            mouseX >= rect.left &&
            mouseX <= rect.right &&
            mouseY >= rect.top &&
            mouseY <= rect.bottom
          )
        ) {
          speedControlElement.style.left = "-80px";
        }
      }, 1000);
    });

    // Giữ nguyên listener của speedControl
    speedControlElement.addEventListener("mouseleave", () => {
      if (speedControlElement) {
        speedControlElement.style.left = "-80px";
      }
    });

    document.getElementById("toggle-speed").onclick = toggleSpeedControl;
    document.getElementById("speed-up").onclick = () => adjustSpeed(0.25);
    document.getElementById("speed-down").onclick = () => adjustSpeed(-0.25);

    return updateControlVisibility;
  }

  function adjustSpeed(change) {
    if (!isEnabled) return;
    defaultSpeed = Math.min(Math.max(defaultSpeed + change, 0.25), 16);
    document.getElementById(
      "toggle-speed"
    ).textContent = `Speed: ${defaultSpeed}x`;
    applySpeedToVideos();
  }

  function toggleSpeedControl() {
    isEnabled = !isEnabled;
    if (isEnabled) {
      applySpeedToVideos();
    } else {
      getAllVideos().forEach((video) => (video.playbackRate = 1));
    }
  }

  function getAllVideos() {
    return document.querySelectorAll("video");
  }

  function applySpeedToVideos() {
    if (!isEnabled) return;
    getAllVideos().forEach((video) => {
      video.playbackRate = defaultSpeed;
      video.addEventListener("ratechange", () => {
        if (video.playbackRate !== defaultSpeed && isEnabled) {
          video.playbackRate = defaultSpeed;
        }
      });
    });
  }

  const updateVisibilityCallback = createSpeedControl();

  const observer = new MutationObserver((mutationsList) => {
    let videoAddedOrRemoved = false;
    for (const mutation of mutationsList) {
      if (mutation.type === "childList") {
        if (
          mutation.addedNodes.length > 0 &&
          Array.from(mutation.addedNodes).some(
            (node) =>
              node.nodeName === "VIDEO" ||
              (node.querySelector && node.querySelector("video"))
          )
        ) {
          videoAddedOrRemoved = true;
          break;
        }
        if (
          mutation.removedNodes.length > 0 &&
          Array.from(mutation.removedNodes).some(
            (node) =>
              node.nodeName === "VIDEO" ||
              (node.querySelector && node.querySelector("video"))
          )
        ) {
          videoAddedOrRemoved = true;
          break;
        }
      }
    }

    if (videoAddedOrRemoved) {
      if (updateVisibilityCallback) updateVisibilityCallback();
      if (isEnabled) applySpeedToVideos();
    } else if (isEnabled) {
      applySpeedToVideos();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  setInterval(applySpeedToVideos, 2000);
})();
