// ==UserScript==
// @name         Auto Video Speed Controller
// @namespace    http://tampermonkey.net/
// @version      1.30
// @description  Tự động điều chỉnh tốc độ cho mọi HTML5 media (video + audio), và thêm controls + hotkeys (Shift+., Shift+,, Shift+'). Bản tối ưu hiệu năng (no setInterval, hotkeys throttle) + chống mất khi đổi URL (SPA) + UI giữa cạnh trái + fix YouTube autoplay next.
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
  let defaultSpeed = 1.75;     // Giữ theo yêu cầu
  let isEnabled = true;
  const LISTENER_ATTRIBUTE = "data-speed-listener-added";

  // --- Cache DOM (UI) ---
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

  const isMediaEl = (el) => el instanceof HTMLMediaElement; // video hoặc audio

  // --- Media ---
  function applySpeedToMedia(media) {
    if (!media || media.hasAttribute(LISTENER_ATTRIBUTE)) return;
    media.playbackRate = isEnabled ? defaultSpeed : 1;
    media.addEventListener("ratechange", handleRateChange);
    media.setAttribute(LISTENER_ATTRIBUTE, "true");
  }

  function handleRateChange(event) {
    const media = event.target;
    if (isEnabled && media.playbackRate !== defaultSpeed) {
      // reset về tốc độ mặc định nếu bị trang can thiệp
      setTimeout(() => {
        if (isEnabled) media.playbackRate = defaultSpeed;
      }, 0);
    }
  }

  function applySpeedToAllExistingMediaInDocument(doc) {
    doc.querySelectorAll("video, audio").forEach((media) => {
      const targetRate = isEnabled ? defaultSpeed : 1;
      if (media.playbackRate !== targetRate) media.playbackRate = targetRate;
      if (!media.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToMedia(media);
    });
  }

  function applySpeedToActiveMediaInDocument(doc) {
    doc.querySelectorAll("video, audio").forEach((media) => {
      if (!isEnabled) return;
      if (!media.paused || media.readyState > 0) {
        if (media.playbackRate !== defaultSpeed) media.playbackRate = defaultSpeed;
        if (!media.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToMedia(media);
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
    applySpeedToActiveMediaInDocument(document);
    // không động tới iframe ở đây cho nhẹ; sẽ đồng bộ lại qua observer/URL hooks
  }

  function toggleSpeedControl() {
    isEnabled = !isEnabled;
    if (isEnabled) defaultSpeed = 1.75;
    updateToggleButton();
    // Áp dụng cho tài liệu chính & các iframe same-origin
    applySpeedEverywhere();
  }

  function checkAndToggleControlVisibility() {
    if (!speedControlElement) return;
    const anyMedia = !!document.querySelector("video, audio");
    speedControlElement.style.display = anyMedia ? "flex" : "none";
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
      // Hiện panel khi có media
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

    // Khi có media mới hoặc mất, observer sẽ gọi scheduleVisibilityCheck
    checkAndToggleControlVisibility();
  }

  // --- Observer đa tài liệu (main + iframe same-origin) ---
  const docObservers = new WeakMap(); // Document -> MutationObserver

  function observeDocument(doc) {
    if (!doc || docObservers.has(doc)) return;

    const mo = new MutationObserver((mutationsList) => {
      let needVisibilityUpdate = false;

      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;

            // Media trực tiếp
            if (isMediaEl(node)) {
              applySpeedToMedia(node);
              needVisibilityUpdate = (doc === document);
              return;
            }

            // Media trong cây con
            if (node.querySelectorAll) {
              node.querySelectorAll("video, audio").forEach(applySpeedToMedia);
              if (doc === document && node.querySelector && node.querySelector("video, audio")) {
                needVisibilityUpdate = true;
              }
            }

            // Iframe same-origin
            if (node.tagName === "IFRAME") {
              hookIframe(node);
            }
          });

          mutation.removedNodes.forEach((node) => {
            if (doc === document) {
              if (node.nodeName === "VIDEO" || node.nodeName === "AUDIO" ||
                  (node.nodeType === Node.ELEMENT_NODE && node.querySelector && node.querySelector("video, audio"))) {
                needVisibilityUpdate = true;
              }
            }
          });
        }

        if (mutation.type === "attributes") {
          const t = mutation.target;
          if (isMediaEl(t)) {
            if (isEnabled && t.playbackRate !== defaultSpeed) {
              t.playbackRate = defaultSpeed;
            }
            if (!t.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToMedia(t);
            if (doc === document) needVisibilityUpdate = true;
          }
        }
      }

      if (needVisibilityUpdate) scheduleVisibilityCheck();
    });

    try {
      mo.observe(doc.documentElement || doc, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src"],
      });
      docObservers.set(doc, mo);
    } catch (e) {
      // Bỏ qua nếu không thể observe
    }

    // Quét sẵn media & hook iframe hiện có
    try {
      applySpeedToAllExistingMediaInDocument(doc);
      doc.querySelectorAll("iframe").forEach(hookIframe);
    } catch (e) {}
  }

  function hookIframe(frame) {
    // Chỉ xử lý iframe same-origin
    try {
      const doc = frame.contentDocument;
      if (doc) {
        // Observe tài liệu trong iframe
        observeDocument(doc);

        // Khi iframe reload, rehook
        frame.addEventListener("load", () => {
          try {
            observeDocument(frame.contentDocument);
          } catch (e) {}
        }, { passive: true });
      }
    } catch (e) {
      // cross-origin -> bỏ qua
    }
  }

  function applySpeedEverywhere() {
    // Main
    applySpeedToAllExistingMediaInDocument(document);
    // Iframe same-origin
    document.querySelectorAll("iframe").forEach((f) => {
      try {
        if (f.contentDocument) applySpeedToAllExistingMediaInDocument(f.contentDocument);
      } catch (e) {}
    });
    scheduleVisibilityCheck();
  }

  function ensureUIAttached() {
    if (!document.body) return;
    const container = document.getElementById("speed-control-container");
    if (!container || !document.body.contains(container)) {
      if (container && container.parentElement) container.parentElement.remove();
      createSpeedControl();
    }
  }

  // --- Hook thay đổi URL (SPA) ---
  function onUrlChange() {
    raf(() => {
      ensureUIAttached();
      applySpeedEverywhere();
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
    // Sự kiện đặc thù YouTube
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
    // Quan sát tài liệu chính + quét media hiện có
    observeDocument(document);

    const mediaReadyHandler = (e) => {
      const el = e.target;
      if (!el || !isMediaEl(el)) return;
      if (isEnabled && el.playbackRate !== defaultSpeed) {
        el.playbackRate = defaultSpeed;
      }
      if (!el.hasAttribute(LISTENER_ATTRIBUTE)) applySpeedToMedia(el);
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
          toggleSpeedControl(); // bật nếu đang tắt (về 1.75x)
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

  // (Không dùng Slash / double-tap)
})();
