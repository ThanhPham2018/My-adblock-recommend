// ==UserScript==
// @name         Auto Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      1.29
// @description  Tự động điều chỉnh tốc độ video và thêm controls + hotkeys (Shift+., Shift+,, Shift+'). Bản tối ưu hiệu năng (no setInterval, hotkeys throttle) + chống mất khi đổi URL (SPA) + UI giữa cạnh trái + fix YouTube autoplay next.
// @author       ThanhPN (mod by request)
// @downloadURL  https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @updateURL    https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/Auto%20Video%20Speed%20Controller.js
// @homepageURL  https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @exclude      https://tv.garden/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // --- Trạng thái & cấu hình ---
  let defaultSpeed = 1.75;
  let isEnabled = true;
  const LISTENER_ATTRIBUTE = "data-speed-listener-added";

  // --- Cache DOM ---
  let speedControlElement = null;
  let toggleSpeedButton = null;
  let speedUpButton = null;
  let speedDownButton = null;
  let showZoneElement = null;

  // --- Utils ---
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
    let last = 0, timer = null, lastArgs;
    return function throttled(...args) {
      const now = Date.now();
      lastArgs = args;
      const remaining = wait - (now - last);
      if (remaining <= 0) {
        last = now;
        fn.apply(this, lastArgs);
      } else if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          last = Date.now();
          fn.apply(this, lastArgs);
        }, remaining);
      }
    };
  }

  // --- Video ---
  function applySpeedToVideo(video) {
    if (!video || video.hasAttribute(LISTENER_ATTRIBUTE)) return;
    video.playbackRate = isEnabled ? defaultSpeed : 1;
    video.addEventListener("ratechange", handleRateChange);
    video.setAttribute(LISTENER_ATTRIBUTE, "true");
  }

  function handleRateChange(event) {
    const video = event.target;
    if (isEnabled && video.playbackRate !== defaultSpeed) {
      setTimeout(() => {
        if (isEnabled) video.playbackRate = defaultSpeed;
      }, 0);
    }
  }

  function applySpeedToAllExistingVideos() {
    document.querySelectorAll("video").forEach((video) => {
      const targetRate = isEnabled ? defaultSpeed : 1;
      if (video.playbackRate !== targetRate) video.playbackRate = targetRate;
      if (!video.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToVideo(video);
    });
  }

  function applySpeedToActiveVideos() {
    document.querySelectorAll("video").forEach((video) => {
      if (!isEnabled) return;
      if (!video.paused || video.readyState > 0) {
        if (video.playbackRate !== defaultSpeed) video.playbackRate = defaultSpeed;
        if (!video.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToVideo(video);
      }
    });
  }

  // --- UI ---
  function updateToggleButton() {
    if (toggleSpeedButton) {
      toggleSpeedButton.textContent = isEnabled ? `Speed: ${defaultSpeed}x` : "Speed: OFF";
    }
  }

  function adjustSpeed(change) {
    if (!isEnabled) return;
    defaultSpeed = Math.min(Math.max(defaultSpeed + change, 0.25), 16);
    updateToggleButton();
    applySpeedToActiveVideos();
  }

  function toggleSpeedControl() {
    isEnabled = !isEnabled;
    if (isEnabled) defaultSpeed = 1.75;
    updateToggleButton();
    applySpeedToAllExistingVideos();
  }

  function checkAndToggleControlVisibility() {
    if (!speedControlElement) return;
    const videosExist = document.querySelector("video") !== null;
    speedControlElement.style.display = videosExist ? "flex" : "none";
  }

  function createSpeedControl() {
    if (!document.body) return;

    const oldContainer = document.getElementById("speed-control-container");
    if (oldContainer && oldContainer.parentElement) oldContainer.parentElement.remove();

    const container = document.createElement("div");
    const controlContainer = document.createElement("div");
    controlContainer.id = "speed-control-container";
    controlContainer.style.cssText = "position: fixed; top: 0; left: 0; width: 0; height: 100vh; z-index: 9998;";

    const showZone = document.createElement("div");
    showZone.id = "speed-control-show-zone";
    showZone.style.cssText = "position: absolute; top: 50%; left: 0; width: 50px; height: 120px; transform: translateY(-50%); cursor: pointer;";

    const panel = document.createElement("div");
    panel.id = "speed-control-panel";
    panel.style.cssText = "position: absolute; top: 50%; left: -120px; transform: translateY(-50%); background: rgba(0,0,0,0.8); padding: 8px; border-radius: 6px; z-index: 9999; color: white; display: none; flex-direction: row; gap: 6px; transition: left 0.25s ease-in-out;";

    const toggleBtn = document.createElement("button");
    toggleBtn.id = "speed-control-toggle";
    toggleBtn.textContent = `Speed: ${defaultSpeed}x`;
    toggleBtn.style.cssText = "padding: 6px 10px; border: none; background-color: #555; color: white; border-radius: 4px; cursor: pointer;";

    const upBtn = document.createElement("button");
    upBtn.id = "speed-control-up";
    upBtn.textContent = "+";
    upBtn.style.cssText = "padding: 6px 10px; border: none; background-color: #555; color: white; border-radius: 4px; cursor: pointer;";

    const downBtn = document.createElement("button");
    downBtn.id = "speed-control-down";
    downBtn.textContent = "-";
    downBtn.style.cssText = "padding: 6px 10px; border: none; background-color: #555; color: white; border-radius: 4px; cursor: pointer;";

    panel.appendChild(toggleBtn);
    panel.appendChild(upBtn);
    panel.appendChild(downBtn);

    controlContainer.appendChild(showZone);
    controlContainer.appendChild(panel);

    container.appendChild(controlContainer);
    document.body.appendChild(container);

    speedControlElement = panel;
    showZoneElement = showZone;
    toggleSpeedButton = toggleBtn;
    speedUpButton = upBtn;
    speedDownButton = downBtn;

    showZoneElement.addEventListener("mouseenter", () => {
      if (speedControlElement.style.display === "flex") {
        speedControlElement.style.left = "10px";
      }
    });
    controlContainer.addEventListener("mouseleave", () => {
      speedControlElement.style.left = "-120px";
    });

    toggleSpeedButton.onclick = toggleSpeedControl;
    speedUpButton.onclick = () => adjustSpeed(0.25);
    speedDownButton.onclick = () => adjustSpeed(-0.25);

    checkAndToggleControlVisibility();
  }

  // --- Tự phục hồi UI/observer khi SPA thay trang/DOM ---
  let observer = null;
  function attachObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutationsList) => {
      let needVisibilityUpdate = false;
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeName === "VIDEO") {
              applySpeedToVideo(node);
              needVisibilityUpdate = true;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              node.querySelectorAll && node.querySelectorAll(`video:not([${LISTENER_ATTRIBUTE}])`).forEach(applySpeedToVideo);
              if (node.querySelector && node.querySelector("video")) needVisibilityUpdate = true;
            }
          });
          mutation.removedNodes.forEach((node) => {
            if (node.nodeName === "VIDEO" || (node.nodeType === Node.ELEMENT_NODE && node.querySelector && node.querySelector("video"))) {
              needVisibilityUpdate = true;
            }
          });
        }
        if (mutation.type === "attributes" && mutation.target && mutation.target.nodeName === "VIDEO") {
          const v = mutation.target;
          if (isEnabled && v.playbackRate !== defaultSpeed) {
            v.playbackRate = defaultSpeed;
          }
          if (!v.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToVideo(v);
          needVisibilityUpdate = true;
        }
      }
      if (needVisibilityUpdate) scheduleVisibilityCheck();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"],
    });
  }

  function ensureUIAttached() {
    if (!document.body) return;
    const container = document.getElementById("speed-control-container");
    if (!container || !document.body.contains(container)) {
      if (container && container.parentElement) container.parentElement.remove();
      createSpeedControl();
    }
    if (!observer) attachObserver();
  }

  // --- Hook thay đổi URL (SPA) ---
  function onUrlChange() {
    raf(() => {
      ensureUIAttached();
      applySpeedToAllExistingVideos();
      scheduleVisibilityCheck();
    });
  }

  (function patchHistoryForSpa() {
    const _push = history.pushState;
    const _replace = history.replaceState;
    history.pushState = function (...args) {
      const r = _push.apply(this, args);
      onUrlChange();
      return r;
    };
    history.replaceState = function (...args) {
      const r = _replace.apply(this, args);
      onUrlChange();
      return r;
    };
    window.addEventListener("popstate", onUrlChange, { passive: true });
    window.addEventListener("yt-navigate-finish", onUrlChange, true);
    window.addEventListener("yt-page-data-updated", onUrlChange, true);
    window.addEventListener("yt-player-updated", onUrlChange, true);
  })();

  // --- Khởi tạo an toàn @document-start ---
  let inited = false;
  function initOnce() {
    if (inited) return;
    if (!document.body) return;
    inited = true;

    createSpeedControl();
    applySpeedToAllExistingVideos();
    attachObserver();

    const mediaReadyHandler = (e) => {
      const v = e.target;
      if (!v || v.nodeName !== "VIDEO") return;
      if (isEnabled && v.playbackRate !== defaultSpeed) {
        v.playbackRate = defaultSpeed;
      }
      if (!v.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToVideo(v);
    };
    document.addEventListener("loadedmetadata", mediaReadyHandler, true);
    document.addEventListener("playing", mediaReadyHandler, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        initOnce();
        onUrlChange();
      },
      { once: true }
    );
  } else {
    initOnce();
  }

  // --- Hotkeys ---
  const throttledAdjustUp = throttle(() => adjustSpeed(0.25), 60);
  const throttledAdjustDown = throttle(() => adjustSpeed(-0.25), 60);

  // Shift+. tăng (hoặc bật nếu đang tắt); Shift+, giảm; Shift+' toggle
  document.addEventListener("keydown", (e) => {
    if (!e.shiftKey) return;
    const target = e.target || {};
    const tag = (target.tagName || "").toLowerCase();
    const isEditable =
      target.isContentEditable ||
      tag === "input" ||
      tag === "textarea" ||
      tag === "select";
    if (isEditable) return;

    switch (e.code) {
      case "Period": { // Shift+.
        if (!isEnabled) {
          toggleSpeedControl(); // bật nếu đang tắt (về 1.75x theo logic hiện tại)
        } else {
          throttledAdjustUp(); // đang bật thì tăng +0.25x
        }
        e.preventDefault();
        break;
      }
      case "Comma": // Shift+,
        throttledAdjustDown();
        e.preventDefault();
        break;
      case "Quote": // Shift+'
        toggleSpeedControl();
        e.preventDefault();
        break;
      default:
        break;
    }
  });

  // (Bỏ hẳn hotkey Slash và cơ chế double-tap)
})();
