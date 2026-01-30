// ==UserScript==
// @name         Facebook Sponsored Auto-Hider (Upgraded 2025)
// @namespace    devguru.fb
// @version      1.3.0
// @description  Auto hide Sponsored posts (HTML mới), popup killer, blur mode, fallback ads link detection
// @downloadURL  https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/fb.js
// @updateURL    https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/fb.js
// @homepageURL  https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://www.facebook.com/*
// @match        https://web.facebook.com/*
// @match        https://m.facebook.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

(() => {
  "use strict";

  /*****************************************************************
   * CONFIG
   *****************************************************************/
  const MODE_KEY = "fbhf_mode"; // auto | blur
  const DEFAULT_MODE = "auto";

  const UI = {
    MENU_LABELS: ["Hành động với bài viết này", "Actions for this post"],
    HIDE_AD_TEXTS: ["Ẩn quảng cáo", "Hide ad", "Ẩn quảng cáo này"],
  };

  /*****************************************************************
   * STORAGE
   *****************************************************************/
  const getV = (k, d) => {
    try {
      return GM_getValue(k, d);
    } catch {
      return localStorage.getItem(k) ?? d;
    }
  };

  const setV = (k, v) => {
    try {
      GM_setValue(k, v);
    } catch {
      localStorage.setItem(k, v);
    }
  };

  let mode = getV(MODE_KEY, DEFAULT_MODE);
  if (!["auto", "blur"].includes(mode)) mode = DEFAULT_MODE;

  /*****************************************************************
   * STABLE SELECTORS (HTML MỚI)
   *****************************************************************/
  const POST_SELECTOR = 'div[role="article"], article';

  const AD_ABOUT_SEL = `
    a[href*="/ads/about"],
    a[attributionsrc*="/ads/about"],
    a[attributionsrc*="/privacy_sandbox"]
  `;

  /*****************************************************************
   * RANDOM CLASS (ANTI COLLISION)
   *****************************************************************/
  const magic =
    "fbhf-" +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36);
  const blurCls = `${magic}-blur`;

  /*****************************************************************
   * UTILS
   *****************************************************************/
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = async (fn, timeout = 5000, interval = 120) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const v = fn();
      if (v) return v;
      await sleep(interval);
    }
    return null;
  };

  const findPostContainer = (el) =>
    el?.closest?.(POST_SELECTOR) || null;

  /*****************************************************************
   * FIND MENU BUTTON (3 DOTS)
   *****************************************************************/
  function findActionBtnIn(container) {
    if (!container) return null;

    // Ưu tiên aria-label
    for (const label of UI.MENU_LABELS) {
      const btn = container.querySelector(
        `div[role="button"][aria-label="${label}"]`
      );
      if (btn) return btn;
    }

    // Chuẩn HTML mới
    return container.querySelector(
      'div[role="button"][aria-haspopup="menu"]'
    );
  }

  const getMenuItemByText = (texts) => {
    const items = Array.from(
      document.querySelectorAll('[role="menuitem"]')
    );
    return items.find((i) =>
      texts.some((t) => (i.textContent || "").includes(t))
    );
  };

  /*****************************************************************
   * POPUP KILLER (GIỮ NGUYÊN – ỔN)
   *****************************************************************/
  const POPUP_CLOSE_TEXTS = [
    "đóng",
    "xong",
    "ok",
    "hoàn tất",
    "bỏ qua",
    "không phải bây giờ",
    "close",
    "done",
    "got it",
    "continue",
  ];

  const norm = (s) =>
    (s || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();

  function findCloseBtn(root) {
    const byAria = root.querySelector?.(
      '[aria-label*="Đóng" i], [aria-label*="Close" i]'
    );
    if (byAria) return byAria;

    const buttons = Array.from(
      root.querySelectorAll?.("button,[role=button]") || []
    );
    return buttons.find((b) =>
      POPUP_CLOSE_TEXTS.includes(norm(b.textContent))
    );
  }

  function killPopup(root) {
    const btn = findCloseBtn(root);
    if (btn) btn.click();
  }

  function observePopups() {
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          if (
            n.matches?.(
              'div[role="dialog"],div[aria-modal="true"]'
            )
          ) {
            killPopup(n);
          }
        });
      }
    });

    obs.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /*****************************************************************
   * AUTO HIDE LOGIC
   *****************************************************************/
  const autoHandled = new WeakSet();
  let lastAction = 0;

  function rateLimit(ms = 300) {
    const now = Date.now();
    if (now - lastAction < ms) return false;
    lastAction = now;
    return true;
  }

  async function runHideSequence(post) {
    if (!post || autoHandled.has(post)) return;

    const menuBtn = findActionBtnIn(post);
    if (!menuBtn) return;

    menuBtn.click();

    const item = await waitFor(() =>
      getMenuItemByText(UI.HIDE_AD_TEXTS)
    );

    if (!item) {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
        })
      );
      return;
    }

    item.click();
    autoHandled.add(post);
  }

  /*****************************************************************
   * FALLBACK: ADS LINK DETECTION (HTML MỚI)
   *****************************************************************/
  function tryAutoHideByAdLink(node) {
    if (!(node instanceof HTMLElement)) return;

    const link = node.matches?.(AD_ABOUT_SEL)
      ? node
      : node.querySelector?.(AD_ABOUT_SEL);

    if (!link) return;

    const post = findPostContainer(link);
    if (!post || autoHandled.has(post)) return;

    if (mode === "auto") {
      if (rateLimit()) runHideSequence(post);
    } else {
      post.classList.add(blurCls);
    }
  }

  /*****************************************************************
   * OBSERVE FEED
   *****************************************************************/
  function observeFeed() {
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes.forEach((n) => {
          if (!(n instanceof HTMLElement)) return;
          tryAutoHideByAdLink(n);
          n.querySelectorAll?.(AD_ABOUT_SEL).forEach(tryAutoHideByAdLink);
        });
      }
    });

    obs.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /*****************************************************************
   * CSS
   *****************************************************************/
  GM_addStyle(`
    .${blurCls}{
      filter: blur(4px) saturate(.9) !important;
      outline: 3px solid #e11d48 !important;
      outline-offset: -3px;
      transition: filter .15s ease;
    }
    .${blurCls}:hover{
      filter:none !important;
    }
  `);

  /*****************************************************************
   * BOOTSTRAP
   *****************************************************************/
  function start() {
    observePopups();
    observeFeed();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
