// ==UserScript==
// @name         Add language in Google services url
// @namespace    http://tampermonkey.net/
// @version      1.8
// @description  Tự động thêm ?hl=vi vào URL khi truy cập các dịch vụ của Google, ngoại trừ các trang trong whitelist.
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @exclude        *://*accounts.google.com/*
// @exclude        *://*firebase.google.com/*
// @match        *://*.google.com/*
// @match        *://*.notebooklm.google.com/*
// @match        *://*.aistudio.google.com/*
// @match        *://*.gemini.google.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
    'use strict';

    const CACHE_DURATION = 3600000; // 1 giờ tính bằng milliseconds
    const WHITELIST_URL = 'https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/filter%20list/whitelist.txt';
    const currentHostname = window.location.hostname;

    function isHostnameExcluded(hostnameToCheck, whitelistEntry) {
        if (!whitelistEntry || !hostnameToCheck) return false;
        
        const cleanedEntry = whitelistEntry.replace(/^\*|\*$/g, '');
        return (whitelistEntry.startsWith('*') && hostnameToCheck.endsWith(cleanedEntry)) ||
               (whitelistEntry.endsWith('*') && hostnameToCheck.startsWith(cleanedEntry)) ||
               (hostnameToCheck === cleanedEntry);
    }

    function addLanguageParameter() {
        const url = new URL(window.location.href);
        if (!url.searchParams.has('hl')) {
            url.searchParams.set('hl', 'vi');
            window.location.href = url.toString();
        }
    }

    function processWhitelist(whitelistText) {
        if (!whitelistText) return addLanguageParameter();

        const excludedHostnames = whitelistText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));

        const isExcluded = excludedHostnames.some(hostname => 
            isHostnameExcluded(currentHostname, hostname));

        if (!isExcluded) {
            addLanguageParameter();
        } else {
            console.log(`[Language Script] Hostname ${currentHostname} trong whitelist, bỏ qua.`);
        }
    }

    function loadWhitelist() {
        const cachedData = GM_getValue('whitelistCache');
        const now = Date.now();

        if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
            processWhitelist(cachedData.content);
            return;
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: WHITELIST_URL,
            timeout: 5000,
            onload: function(response) {
                if (response.status === 200) {
                    GM_setValue('whitelistCache', {
                        content: response.responseText,
                        timestamp: now
                    });
                    processWhitelist(response.responseText);
                } else {
                    console.warn("[Language Script] Lỗi tải whitelist:", response.status);
                    addLanguageParameter();
                }
            },
            onerror: function(error) {
                console.warn("[Language Script] Lỗi kết nối:", error);
                addLanguageParameter();
            },
            ontimeout: function() {
                console.warn("[Language Script] Timeout khi tải whitelist");
                addLanguageParameter();
            }
        });
    }

    loadWhitelist();
})();
