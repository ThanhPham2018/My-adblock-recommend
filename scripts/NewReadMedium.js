// ==UserScript==
// @name         Medium to ReadMedium redirector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Tự động chuyển URL medium sang readmedium.com
// @author       ThanhPN
// @match        *://*.medium.com/*
// @match        *://*.towardsdata.dev/*
// @match        *://*.towardsdatascience.com/*
// @match        *://*.levelup.gitconnected.com/*
// @match        *://*.blog.devgenius.io/*
// @match        *://*.bootcamp.uxdesign.cc/*
// @match        *://*.betterhumans.pub/*
// @match        *://*.bettermarketing.pub/*
// @match        *://*.medium.datadriveninvestor.com/*
// ==/UserScript==

(function() {
    'use strict';

    // Chuyển đổi URL
    function processUrl() {
        if (!window.location.href.includes('readmedium.com')) {
            const newUrl = 'https://readmedium.com' + window.location.pathname + window.location.search;
            window.location.href = newUrl;
        }
    }

    // Xử lý khi load trang
    processUrl();
})();
