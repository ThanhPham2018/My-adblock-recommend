// ==UserScript==
// @name         Thêm tham số ngôn ngữ tiếng Việt vào NotebookLM và AI Studio
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động thêm ?hl=vi vào URL khi truy cập NotebookLM và AI Studio
// @author       You
// @match        *://*.notebooklm.google.com/*
// @match        *://*.aistudio.google.com/*
// @match        *://*.gemini.google.com/*
// @match        https://notebooklm.google.com/*
// @match        https://aistudio.google.com/*
// @match        https://gemini.google.com/*
// @match        *://notebooklm.google.com*
// @match        *://aistudio.google.com*
// @match        *://gemini.google.com*
// @match        *://iask.ai*
// @match        *://you.com*
// @match        *://www.genspark.ai*
// @match        *://www.perplexity.ai*
// @match        *://x.com*
// @match        *://chatgpt.com*
// @match        *://www.meta.ai*
// @match        *://chat.qwen.ai*
// @match        *://chat.deepseek.com*


// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Kiểm tra xem URL đã có tham số ?hl=vi chưa
    if (!window.location.href.includes('?hl=vi') && !window.location.href.includes('&hl=vi')) {
        // Thêm tham số ngôn ngữ vào URL
        const separator = window.location.href.includes('?') ? '&' : '?';
        const newUrl = window.location.href + separator + 'hl=vi';

        // Chuyển hướng đến URL mới với tham số ngôn ngữ tiếng Việt
        window.location.href = newUrl;
    }
})();
