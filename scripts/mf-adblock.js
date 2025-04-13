// ==UserScript==
// @name         mf-adblock
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  a basic anti-adblock workaround that can remove or click elements on a website with whitelist support
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/mf-adblock.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/mf-adblock.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
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

    // Hàm chính thực hiện các hành động chống adblock
    function cleanup() {
        try{
            if(sites[hostname].interaction) {
                document.body.dispatchEvent(new MouseEvent('mousemove'));
            }

            if(sites[hostname].remove) {
                let selectors = sites[hostname].remove;

                selectors.forEach(function(selector) {
                    let elements = document.querySelectorAll(selector);

                    console.log(selector, elements);

                    elements.forEach(function(elem) {
                        elem.style.visibility = 'hidden';
                        elem.style.width = '1px';
                        elem.style.height = '1px';
                        elem.style.overflow = 'hidden';
                        elem.style.opacity = 0;
                    });
                });
            }

            if(sites[hostname].background) {
                document.body.style.background = sites[hostname].background;
                document.body.style.overflow = 'scroll';
                document.body.style.position = 'static';
            }

            if(sites[hostname].click) {
                let selectors = sites[hostname].click;

                selectors.forEach(function(selector) {
                    let element = document.querySelector(selector);

                    if(element !== null) {
                        element.click();
                    }
                });
            }
        }catch(r){console.log(r)}
    }

    // Khai báo biến sites (cấu hình)
    let sites = {
        'www.a-website-name.com': { // website domain
            click: ['.class','#element'], // click this elements (used for cookie consent)
            remove: ['.ad','#banner'], // hide this elements (used for ads)
            interaction: true, // move mouse cursor to trigger onmousemove ads
            timeout: 0, // in ms wait timeout before doing something
            interval: 0, // in ms interval redo everything after this time (used if ads are added onscroll or timeout)
            background: '#ffffff' // set a background-color, overflow:scroll and position for custom fullpage ads
        },
        'stackoverflow.com': {remove: ['.js-consent-banner']},
        'superuser.com': {remove: ['.js-consent-banner']},
        'stackexchange.com': {remove: ['.js-consent-banner']}
    };

    let interval = null;
    let hostname = document.location.hostname;

    const isConfiguredSite = Object.keys(sites).some(keyword => hostname.match(keyword));

    // Hàm được gọi sau khi tải xong danh sách whitelist
    function processWhitelist(whitelistText) {
        const excludedHostnames = whitelistText.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '' && !line.startsWith('#')); // Loại bỏ dòng trống và dòng comment

        // Kiểm tra xem hostname hiện tại có nằm trong danh sách loại trừ không
        for (const excludedHostname of excludedHostnames) {
            if (isHostnameExcluded(currentHostname, excludedHostname)) {
                console.log(`[Tampermonkey Script] Trang web nằm trong whitelist: ${currentHostname} (khớp với: ${excludedHostname}). Script sẽ không thực hiện hành động.`);
                return; // Dừng thực thi script trên trang này
            }
        }

        // Nếu không bị loại trừ và trang có cấu hình, tiến hành thực hiện cleanup
        if (isConfiguredSite) {
            try {
                let timeout = sites[hostname]?.timeout || 1800; // Sử dụng timeout từ cấu hình hoặc mặc định là 1800ms

                $(document).ready(function() {
                    setTimeout(function() {
                        cleanup();
                        if (sites[hostname]?.interval > 0) {
                            interval = setInterval(cleanup, sites[hostname].interval);
                        }
                    }, timeout);
                });
            } catch (r) {
                console.error("[Tampermonkey Script] Lỗi khi thực hiện cleanup:", r);
            }
        }
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
                // Nếu không tải được whitelist, vẫn tiến hành thực hiện script trên các trang đã cấu hình
                if (isConfiguredSite) {
                    try {
                        let timeout = sites[hostname]?.timeout || 1800;

                        $(document).ready(function() {
                            setTimeout(function() {
                                cleanup();
                                if (sites[hostname]?.interval > 0) {
                                    interval = setInterval(cleanup, sites[hostname].interval);
                                }
                            }, timeout);
                        });
                    } catch (r) {
                        console.error("[Tampermonkey Script] Lỗi khi thực hiện cleanup (không tải được whitelist):", r);
                    }
                }
            }
        },
        onerror: function(error) {
            console.error("[Tampermonkey Script] Lỗi mạng khi tải file whitelist:", error);
            // Tương tự như onload, vẫn tiến hành thực hiện script trên các trang đã cấu hình
            if (isConfiguredSite) {
                try {
                    let timeout = sites[hostname]?.timeout || 1800;

                    $(document).ready(function() {
                        setTimeout(function() {
                            cleanup();
                            if (sites[hostname]?.interval > 0) {
                                interval = setInterval(cleanup, sites[hostname].interval);
                            }
                        }, timeout);
                    });
                } catch (r) {
                    console.error("[Tampermonkey Script] Lỗi khi thực hiện cleanup (lỗi mạng whitelist):", r);
                }
            }
        }
    });

})();
