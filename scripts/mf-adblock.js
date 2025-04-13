// ==UserScript==
// @name         mf-adblock
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  a basic anti-adblock workaround that can remove or click elements on a website with whitelist support
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/mf-adblock.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/mf-adblock.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    const whitelistUrl = 'https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/filter%20list/whitelist.txt';
    const currentHostname = window.location.hostname;
    let interval = null;
    const hostname = document.location.hostname;

    // Cấu hình sites
    const sites = {
        'www.a-website-name.com': {
            click: ['.class','#element'],
            remove: ['.ad','#banner'],
            interaction: true,
            timeout: 0,
            interval: 0,
            background: '#ffffff'
        },
        'stackoverflow.com': {remove: ['.js-consent-banner']},
        'superuser.com': {remove: ['.js-consent-banner']},
        'stackexchange.com': {remove: ['.js-consent-banner']}
    };

    function isHostnameExcluded(hostnameToCheck, whitelistEntry) {
        if (!whitelistEntry) return false;
        const cleanedEntry = whitelistEntry.replace(/^\*|\*$/g, '');
        return whitelistEntry.startsWith('*') ? hostnameToCheck.endsWith(cleanedEntry) :
               whitelistEntry.endsWith('*') ? hostnameToCheck.startsWith(cleanedEntry) :
               hostnameToCheck === cleanedEntry;
    }

    function cleanup() {
        if (!sites[hostname]) return;

        const {interaction, remove, background, click} = sites[hostname];

        try {
            if (interaction) {
                document.body.dispatchEvent(new MouseEvent('mousemove'));
            }

            if (remove?.length) {
                remove.forEach(selector => {
                    document.querySelectorAll(selector)?.forEach(elem => {
                        Object.assign(elem.style, {
                            visibility: 'hidden',
                            width: '1px',
                            height: '1px',
                            overflow: 'hidden',
                            opacity: '0'
                        });
                    });
                });
            }

            if (background) {
                Object.assign(document.body.style, {
                    background,
                    overflow: 'scroll',
                    position: 'static'
                });
            }

            if (click?.length) {
                click.forEach(selector => {
                    document.querySelector(selector)?.click();
                });
            }
        } catch (error) {
            console.error('[mf-adblock] Cleanup error:', error);
        }
    }

    function initAdBlock(whitelist = '') {
        const excludedHostnames = whitelist.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'));

        if (excludedHostnames.some(entry => isHostnameExcluded(currentHostname, entry))) {
            console.log(`[mf-adblock] Site whitelisted: ${currentHostname}`);
            return;
        }

        const isConfiguredSite = Object.keys(sites).some(key => hostname.match(key));
        if (!isConfiguredSite) return;

        const timeout = sites[hostname]?.timeout || 1800;

        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                cleanup();
                if (sites[hostname]?.interval > 0) {
                    interval = setInterval(cleanup, sites[hostname].interval);
                }
            }, timeout);
        });
    }

    GM_xmlhttpRequest({
        method: "GET",
        url: whitelistUrl,
        onload: response => {
            initAdBlock(response.status === 200 ? response.responseText : '');
        },
        onerror: () => {
            console.error("[mf-adblock] Failed to load whitelist");
            initAdBlock();
        }
    });
})();
