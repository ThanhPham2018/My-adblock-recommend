// ==UserScript==
// @name         Copy Page Text Button (Idle + Toast, iOS Safe)
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Nút 📋 giữa cạnh trái; sau khi trang idle. Copy tương thích iOS (GM_setClipboard -> Clipboard API -> execCommand). Có toast.
// @downloadURL  https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/copyAll.js
// @updateURL    https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/copyAll.js
// @homepageURL  https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @grant        GM_setClipboard
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // --- Toast ---
  function showToast(msg, color = '#28a745') {
    const el = document.createElement('div');
    el.textContent = msg;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: color,
      color: '#fff',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '14px',
      zIndex: 2147483647,
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      opacity: '0',
      transition: 'opacity .35s, transform .35s',
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateX(-50%) translateY(-8px)';
    });
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(-50%) translateY(0)';
      setTimeout(() => el.remove(), 400);
    }, 2000);
  }

  // --- Copy helpers (ưu tiên GM -> Clipboard API -> execCommand) ---
  async function copyTextUniversal(text) {
    // 1) Tampermonkey API (nếu có, thường OK trên desktop, đôi khi không có trên iOS)
    if (typeof GM_setClipboard === 'function') {
      try {
        GM_setClipboard(text);
        return true;
      } catch (_) {}
    }
    // 2) Clipboard API (yêu cầu gesture & HTTPS; iOS hỗ trợ phiên bản giới hạn)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {}
    }
    // 3) Fallback execCommand (cách bền vững nhất cho iOS Safari)
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      Object.assign(ta.style, {
        position: 'fixed',
        top: '-1000px',
        left: '0',
        opacity: '0',
        // iOS: cần font-size >= 16px để tránh zoom
        fontSize: '16px'
      });
      document.body.appendChild(ta);
      ta.focus({ preventScroll: true });
      ta.select();
      ta.setSelectionRange(0, ta.value.length); // iOS cần gọi rõ ràng
      const ok = document.execCommand('copy');
      ta.blur();
      ta.remove();
      return ok;
    } catch (_) {
      return false;
    }
  }

  // --- Tạo nút ---
  function createButton() {
    if (!document.body || document.getElementById('__dg_copy_btn')) return;

    const btn = document.createElement('button');
    btn.id = '__dg_copy_btn';
    btn.textContent = '📋';
    Object.assign(btn.style, {
      position: 'fixed',
      // safe-area cho iPhone tai thỏ
      left: 'calc(env(safe-area-inset-left, 0px) + 6px)',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 2147483646,
      background: '#007aff',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 10px',
      cursor: 'pointer',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      opacity: '0.7',
      transition: 'opacity .2s',
      // iOS touch UX
      WebkitTapHighlightColor: 'transparent',
      touchAction: 'manipulation',
      fontSize: '16px' // >=16 để tránh iOS zoom on tap
    });

    btn.addEventListener('mouseenter', () => (btn.style.opacity = '1'));
    btn.addEventListener('mouseleave', () => (btn.style.opacity = '0.7'));

    // Hỗ trợ tap trên iOS tốt hơn
    btn.addEventListener('touchstart', () => (btn.style.opacity = '1'), { passive: true });
    btn.addEventListener('touchend', () => (btn.style.opacity = '0.7'), { passive: true });

    btn.addEventListener('click', async () => {
      const text = (document.body && document.body.innerText ? document.body.innerText.trim() : '') || '';
      if (!text) {
        showToast('⚠️ Không có nội dung để copy!', '#ff9800');
        return;
      }
      const ok = await copyTextUniversal(text);
      showToast(ok ? '✅ Đã copy nội dung!' : '❌ Copy thất bại!', ok ? '#28a745' : '#e53935');
    });

    document.body.appendChild(btn);
  }

  // --- Gắn nút sau khi trang idle; nếu body chưa sẵn → chờ DOMContentLoaded ---
  if (document.body) {
    createButton();
  } else {
    window.addEventListener('DOMContentLoaded', createButton, { once: true });
  }
})();
