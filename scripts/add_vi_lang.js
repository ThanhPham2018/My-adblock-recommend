// ==UserScript==
// @name         Add language in Google services url
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Tự động thêm ?hl=vi vào URL khi truy cập các dịch vụ của Google, ngoại trừ các trang trong whitelist.
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/add_vi_lang.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @exclude        *://*accounts.google.com/*
// @exclude        *://*firebase.google.com/*
// @match        *://*.google.com/*
// @match        *://*.notebooklm.google.com/*
// @match        *://*.aistudio.google.com/*
// @match        *://*.gemini.google.com/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    // URL của file chứa danh sách hostname cần loại trừ (whitelist)
    const whitelistUrl = 'https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/filter%20list/whitelist.txt';

    // Lấy hostname hiện tại của trang web
    const currentHostname = window.location.hostname;

    // Hàm để kiểm tra xem một hostname có khớp với một dòng whitelist (có thể chứa wildcard)
    function isHostnameExcluded(hostnameToCheck, whitelistEntry) {
        const cleanedEntry = whitelistEntry.startsWith('*') ? whitelistEntry.substring(1) : (whitelistEntry.endsWith('*') ? whitelistEntry.slice(0, -1) : whitelistEntry);

        if (whitelistEntry.startsWith('*') && hostnameToCheck.endsWith(cleanedEntry)) {
            return true;
        }
        if (whitelistEntry.endsWith('*') && hostnameToCheck.startsWith(cleanedEntry)) {
            return true;
        }
        if (hostnameToCheck === cleanedEntry) {
            return true;
        }
        return false;
    }

    // Hàm chính để thêm tham số ngôn ngữ
    function addLanguageParameter() {
        if (
            !window.location.href.includes("?hl=vi") &&
            !window.location.href.includes("&hl=vi")
        ) {
            const separator = window.location.href.includes("?") ? "&" : "?";
            const newUrl = window.location.href + separator + "hl=vi";
            window.location.href = newUrl;
        }
    }

    // Hàm được gọi sau khi tải xong danh sách whitelist
    function processWhitelist(whitelistText) {
        const excludedHostnames = whitelistText.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '' && !line.startsWith('#')); // Loại bỏ dòng trống và dòng comment

        // Kiểm tra xem hostname hiện tại có nằm trong danh sách loại trừ không
        for (const excludedHostname of excludedHostnames) {
            if (isHostnameExcluded(currentHostname, excludedHostname)) {
                console.log(`[Tampermonkey Script] Đã phát hiện hostname trong whitelist: ${currentHostname} (khớp với: ${excludedHostname}). Sẽ không thêm tham số ngôn ngữ.`);
                return; // Dừng việc thêm tham số ngôn ngữ
            }
        }

        // Nếu không bị loại trừ, tiến hành thêm tham số ngôn ngữ
        addLanguageParameter();
    }

    // Sử dụng GM_xmlhttpRequest để tải nội dung của file whitelist
    GM_xmlhttpRequest({
        method: "GET",
        url: whitelistUrl,
        onload: function(response) {
            if (response.status === 200) {
                processWhitelist(response.responseText);
            } else {
                console.error("[Tampermonkey Script] Lỗi khi tải file whitelist:", response.status, response.statusText);
                // Trong trường hợp lỗi tải whitelist, vẫn thực hiện thêm tham số ngôn ngữ (hoặc bạn có thể thay đổi logic này)
                addLanguageParameter();
            }
        },
        onerror: function(error) {
            console.error("[Tampermonkey Script] Lỗi mạng khi tải file whitelist:", error);
            // Tương tự như onload, xử lý trường hợp lỗi tải
            addLanguageParameter();
        }
    });

})();
