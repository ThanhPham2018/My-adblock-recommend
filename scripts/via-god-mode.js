// ==UserScript==
// @name         Via God Mode v30.1 OrangeMonkey Final
// @namespace    http://tampermonkey.net/
// @version      30.1
// @description  Modular Floating Menu, Anti-Hijack, URL Cleaner, Crypto PassGen, Dark Mode, Media Tools, Video Tools, Reader, Force Copy
// @author       ThanhPN (mod by request)
// @downloadURL  https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/via-god-mode.js
// @updateURL    https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/via-god-mode.js
// @homepageURL  https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        *://*/*
// @exclude      *://*.google.com/*
// @exclude      *://*.facebook.com/*
// @exclude      *://*.zalo.me/*
// @exclude      *://*.youtube.com/*
// @exclude      *://*.messenger.com/*
// @exclude      *://*.shopee.vn/*
// @exclude      *://*.tiki.vn/*
// @exclude      *://*.lazada.vn/*
// @exclude      *://*.momo.vn/*
// @exclude      *://*.vnpay.vn/*
// @exclude      *://*.apple.com/*
// @exclude      *://*.microsoft.com/*
// @exclude      *://*.netflix.com/*
// @exclude      *://accounts.google.com/*
// @exclude      *://*.github.com/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const Core = {
        ids: {
            fab: 'vgm-fab',
            menu: 'vgm-menu',
            style: 'vgm-style',
            readerStyle: 'vgm-reader-style',
            forceCopyStyle: 'vgm-force-copy-style'
        },
        state: {
            observer: null,
            hooksInstalled: false,
            uiInstalled: false,
            forceCopyEnabled: false,
            originalOpen: window.open
        },
        config: {
            windowOpenPolicy: 'same-tab',
            trackingParams: ['utm_', 'fbclid', 'gclid', 'ref', 'mc_', 'igshid', 'yclid', 'dclid'],
            mediaLazyAttrs: ['src', 'currentSrc', 'poster', 'data-src', 'data-original', 'data-lazy-src', 'data-srcset'],
            eventBlockers: ['mousedown', 'mouseup', 'touchstart', 'touchend', 'pointerdown', 'pointerup', 'pointercancel', 'dragstart', 'contextmenu']
        },
        safeRun(name, fn) {
            try {
                return fn();
            } catch (err) {
                console.warn('[Via God Mode][' + name + ']', err);
                try { alert('Via God Mode lỗi: ' + name); } catch (_) {}
                return null;
            }
        },
        isGodModeElement(el) {
            return !!(el && el.closest && el.closest('#' + Core.ids.fab + ', #' + Core.ids.menu));
        },
        init() {
            Core.safeRun('installHooks', HookManager.install);
            Core.safeRun('buildUI', UIManager.build);
            Core.safeRun('startObserver', Core.startObserver);
        },
        startObserver() {
            if (Core.state.observer || !document.documentElement) return;
            Core.state.observer = new MutationObserver(function () {
                if (!document.getElementById(Core.ids.fab) || !document.getElementById(Core.ids.menu) || !document.getElementById(Core.ids.style)) {
                    Core.state.uiInstalled = false;
                    UIManager.build();
                }
            });
            Core.state.observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    };

    const HookManager = {
        install() {
            if (Core.state.hooksInstalled) return;
            Core.state.hooksInstalled = true;

            window.open = function (url) {
                if (url && url !== 'about:blank' && Core.config.windowOpenPolicy === 'same-tab') {
                    window.location.href = url;
                    return { close: function () {}, focus: function () {}, blur: function () {}, closed: false };
                }
                return Core.state.originalOpen.apply(window, arguments);
            };

            document.addEventListener('click', function (e) {
                if (Core.isGodModeElement(e.target)) return;
                const anchor = e.target.closest && e.target.closest('a');
                if (anchor && anchor.getAttribute('target') === '_blank') anchor.setAttribute('target', '_self');
            }, true);
        }
    };

    const UIManager = {
        injectStyle() {
            if (document.getElementById(Core.ids.style)) return;
            const style = document.createElement('style');
            style.id = Core.ids.style;
            style.textContent = `
                .vgm-dark { filter: invert(1) hue-rotate(180deg) !important; background: #fff !important; }
                .vgm-dark img, .vgm-dark video, .vgm-dark iframe, .vgm-dark picture, .vgm-dark canvas, .vgm-dark svg { filter: invert(1) hue-rotate(180deg) !important; }
                .vgm-video-focus { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483645 !important; background: #000 !important; object-fit: contain !important; }
                #${Core.ids.fab}, #${Core.ids.menu}, #${Core.ids.menu} * { -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; touch-action: none !important; -webkit-user-drag: none !important; box-sizing: border-box !important; }
                #${Core.ids.fab} { position: fixed !important; right: 0 !important; top: 50% !important; transform: translateY(-50%) !important; width: 42px !important; height: 52px !important; background: rgba(0,0,0,0.84) !important; color: #fff !important; border-radius: 14px 0 0 14px !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 2147483647 !important; font-size: 23px !important; cursor: pointer !important; font-family: Arial, sans-serif !important; box-shadow: 0 4px 16px rgba(0,0,0,0.38) !important; }
                #${Core.ids.menu} { position: fixed !important; right: 10px !important; top: 50% !important; transform: translateY(-50%) !important; display: none; flex-direction: column !important; gap: 9px !important; align-items: flex-end !important; z-index: 2147483646 !important; font-family: Arial, sans-serif !important; max-height: 92vh !important; overflow-y: auto !important; padding: 6px 0 !important; }
                .vgm-menu-item { display: flex !important; align-items: center !important; gap: 10px !important; cursor: pointer !important; }
                .vgm-label { background: rgba(0,0,0,0.86) !important; color: #fff !important; padding: 5px 12px !important; border-radius: 20px !important; font-size: 13px !important; line-height: 1.2 !important; white-space: nowrap !important; pointer-events: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important; }
                .vgm-btn { width: 43px !important; height: 43px !important; border-radius: 50% !important; display: flex !important; align-items: center !important; justify-content: center !important; color: #fff !important; font-size: 18px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.45) !important; flex: 0 0 auto !important; }
                .vgm-menu-item:active .vgm-btn { transform: scale(0.92) !important; }
            `;
            (document.head || document.documentElement).appendChild(style);
        },
        freezeEvent(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        },
        absorbEvent(e) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        },
        bindAbsorb(el) {
            if (!el || el.dataset.vgmAbsorbBound) return;
            el.dataset.vgmAbsorbBound = '1';
            Core.config.eventBlockers.forEach(function (evt) {
                el.addEventListener(evt, UIManager.absorbEvent, true);
            });
        },
        closeMenu() {
            const menu = document.getElementById(Core.ids.menu);
            const fab = document.getElementById(Core.ids.fab);
            if (menu) menu.style.display = 'none';
            if (fab) fab.innerHTML = '⚙️';
        },
        build() {
            UIManager.injectStyle();
            const host = document.body || document.documentElement;
            if (!host) return;

            let fab = document.getElementById(Core.ids.fab);
            let menu = document.getElementById(Core.ids.menu);

            if (!fab) {
                fab = document.createElement('div');
                fab.id = Core.ids.fab;
                fab.innerHTML = '⚙️';
                host.appendChild(fab);
            }

            if (!menu) {
                menu = document.createElement('div');
                menu.id = Core.ids.menu;
                ActionRegistry.items.forEach(function (action) {
                    const item = document.createElement('div');
                    item.className = 'vgm-menu-item';
                    item.innerHTML = '<span class="vgm-label">' + Utils.escapeHtml(action.label) + '</span><div class="vgm-btn" style="background-color:' + action.color + '">' + action.icon + '</div>';
                    item.addEventListener('click', function (e) {
                        UIManager.freezeEvent(e);
                        ActionRegistry.run(action.id);
                        UIManager.closeMenu();
                    }, true);
                    UIManager.bindAbsorb(item);
                    menu.appendChild(item);
                });
                host.appendChild(menu);
            }

            if (!fab.dataset.vgmBound) {
                fab.dataset.vgmBound = '1';
                fab.addEventListener('click', function (e) {
                    UIManager.freezeEvent(e);
                    const opened = menu.style.display === 'flex';
                    menu.style.display = opened ? 'none' : 'flex';
                    fab.innerHTML = opened ? '⚙️' : '❯';
                }, true);
            }

            UIManager.bindAbsorb(fab);

            if (!document.documentElement.dataset.vgmDocBound) {
                document.documentElement.dataset.vgmDocBound = '1';
                document.addEventListener('click', function (e) {
                    if (!Core.isGodModeElement(e.target)) UIManager.closeMenu();
                }, true);
            }

            Core.state.uiInstalled = true;
        }
    };

    const ActionRegistry = {
        map: {},
        items: [],
        register(action) {
            ActionRegistry.map[action.id] = action;
            ActionRegistry.items.push(action);
        },
        run(id) {
            const action = ActionRegistry.map[id];
            if (!action) return;
            return Core.safeRun('action:' + id, action.run);
        }
    };

    const Utils = {
        escapeHtml(text) {
            return String(text).replace(/[&<>"']/g, function (m) {
                return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
            });
        },
        absoluteUrl(url) {
            try { return new URL(url, window.location.href).href; } catch (_) { return null; }
        }
    };

    const PasswordModule = {
        cryptoIndex(max) {
            const arr = new Uint32Array(1);
            crypto.getRandomValues(arr);
            return arr[0] % max;
        },
        pick(pool) {
            return pool[PasswordModule.cryptoIndex(pool.length)];
        },
        shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = PasswordModule.cryptoIndex(i + 1);
                const temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }
            return arr;
        },
        generate() {
            const low = 'abcdefghjkmnpqrstuvwxyz';
            const up = 'ABCDEFGHJKMNPQRSTUVWXYZ';
            const num = '23456789';
            const spec = '!@#$%^&*()_+';
            const opts = [
                { l: 8, s: false, t: '8 ký tự thường' },
                { l: 8, s: true, t: '8 ký tự + đặc biệt' },
                { l: 12, s: false, t: '12 ký tự thường' },
                { l: 12, s: true, t: '12 ký tự + đặc biệt' },
                { l: 16, s: false, t: '16 ký tự thường' },
                { l: 16, s: true, t: '16 ký tự + đặc biệt' }
            ];
            const choice = prompt('Chọn chế độ mật khẩu 1-6:\n' + opts.map(function (o, i) { return (i + 1) + '. ' + o.t; }).join('\n'), '3');
            const opt = opts[parseInt(choice, 10) - 1];
            if (!opt) return;
            const result = [PasswordModule.pick(low), PasswordModule.pick(up), PasswordModule.pick(num)];
            if (opt.s) result.push(PasswordModule.pick(spec));
            const pool = low + up + num + (opt.s ? spec : '');
            while (result.length < opt.l) result.push(PasswordModule.pick(pool));
            ClipboardModule.write(PasswordModule.shuffle(result).join(''), 'Copied password');
        }
    };

    const ClipboardModule = {
        write(text, message) {
            const fallback = function () {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.setAttribute('readonly', 'readonly');
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                ta.style.top = '0';
                (document.body || document.documentElement).appendChild(ta);
                ta.focus();
                ta.select();
                try { document.execCommand('copy'); } catch (_) {}
                ta.remove();
                if (message) alert(message + ': ' + (String(text).length > 120 ? String(text).slice(0, 120) + '...' : text));
            };
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                fallback();
                return Promise.resolve();
            }
            return navigator.clipboard.writeText(text).then(function () {
                if (message) alert(message + ': ' + (String(text).length > 120 ? String(text).slice(0, 120) + '...' : text));
            }).catch(fallback);
        },
        copyRawText() {
            const pre = document.querySelector('pre');
            const text = pre ? pre.innerText : (document.body ? document.body.innerText : '');
            ClipboardModule.write(text, 'Copied raw text');
        },
        enableForceCopy() {
            if (!Core.state.forceCopyEnabled) {
                Core.state.forceCopyEnabled = true;
                ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart'].forEach(function (evt) {
                    document.addEventListener(evt, function (e) {
                        if (Core.isGodModeElement(e.target)) return;
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                    }, true);
                });
            }
            if (!document.getElementById(Core.ids.forceCopyStyle)) {
                const style = document.createElement('style');
                style.id = Core.ids.forceCopyStyle;
                style.textContent = '* { -webkit-user-select: text !important; user-select: text !important; -webkit-touch-callout: default !important; }';
                document.documentElement.appendChild(style);
            }
            alert('Force Copy: ON');
        }
    };

    const VideoModule = {
        getBestVideo() {
            const videos = Array.from(document.querySelectorAll('video'));
            if (!videos.length) return null;
            return videos.map(function (v) {
                const rect = v.getBoundingClientRect();
                const area = Math.max(0, rect.width) * Math.max(0, rect.height);
                const playing = !v.paused && !v.ended ? 100000000 : 0;
                const ready = (v.readyState || 0) * 1000000;
                const size = (v.videoWidth || 0) * (v.videoHeight || 0);
                const duration = isFinite(v.duration) ? v.duration : 0;
                return { video: v, score: playing + ready + size + area + duration };
            }).sort(function (a, b) { return b.score - a.score; })[0].video;
        },
        toggleFocus() {
            const v = VideoModule.getBestVideo();
            if (!v) return alert('Không tìm thấy video!');
            if (document.pictureInPictureEnabled && !v.disablePictureInPicture) {
                if (document.pictureInPictureElement) document.exitPictureInPicture();
                else v.requestPictureInPicture().catch(function () { v.classList.toggle('vgm-video-focus'); });
            } else {
                v.classList.toggle('vgm-video-focus');
            }
        },
        setSpeed() {
            const v = VideoModule.getBestVideo();
            if (!v) return alert('Không tìm thấy video!');
            const value = prompt('Nhập tốc độ video: 0.25, 0.5, 1, 1.5, 2, 3, 4', String(v.playbackRate || 1));
            const speed = parseFloat(value);
            if (!speed || speed < 0.25 || speed > 4) return alert('Tốc độ không hợp lệ.');
            v.playbackRate = speed;
            alert('Video speed: ' + speed + 'x');
        },
        toggleLoop() {
            const v = VideoModule.getBestVideo();
            if (!v) return alert('Không tìm thấy video!');
            v.loop = !v.loop;
            alert('Loop Video: ' + (v.loop ? 'ON' : 'OFF'));
        }
    };

    const MediaModule = {
        addUrl(set, value) {
            if (!value) return;
            const url = Utils.absoluteUrl(String(value).trim());
            if (url && /^https?:\/\//i.test(url)) set.add(url);
        },
        addSrcset(set, srcset) {
            if (!srcset) return;
            srcset.split(',').forEach(function (part) {
                MediaModule.addUrl(set, part.trim().split(/\s+/)[0]);
            });
        },
        collectUrls() {
            const set = new Set();
            document.querySelectorAll('img, video, audio, source').forEach(function (el) {
                Core.config.mediaLazyAttrs.forEach(function (key) {
                    if (key.toLowerCase().includes('srcset')) MediaModule.addSrcset(set, el.getAttribute(key));
                    else MediaModule.addUrl(set, el[key] || el.getAttribute(key));
                });
                MediaModule.addSrcset(set, el.getAttribute('srcset'));
            });
            document.querySelectorAll('*').forEach(function (el) {
                const bg = getComputedStyle(el).backgroundImage;
                if (!bg || bg === 'none') return;
                const matches = bg.match(/url\(["']?(.*?)["']?\)/g);
                if (!matches) return;
                matches.forEach(function (m) {
                    MediaModule.addUrl(set, m.replace(/^url\(["']?/, '').replace(/["']?\)$/, ''));
                });
            });
            return Array.from(set);
        },
        classify(urls) {
            const groups = { Images: [], Videos: [], Audio: [], Other: [] };
            urls.forEach(function (url) {
                const clean = url.split('?')[0].toLowerCase();
                if (/\.(jpg|jpeg|png|gif|webp|avif|svg|bmp)$/i.test(clean)) groups.Images.push(url);
                else if (/\.(mp4|webm|mkv|mov|m4v|avi|flv|ts|m3u8)$/i.test(clean)) groups.Videos.push(url);
                else if (/\.(mp3|wav|ogg|aac|m4a|flac)$/i.test(clean)) groups.Audio.push(url);
                else groups.Other.push(url);
            });
            return groups;
        },
        showList() {
            const groups = MediaModule.classify(MediaModule.collectUrls());
            const w = Core.state.originalOpen.call(window, 'about:blank');
            if (!w) return alert('Không mở được trang media.');
            const html = Object.keys(groups).map(function (group) {
                const items = groups[group];
                return '<h2>' + group + ' (' + items.length + ')</h2>' + (items.length ? '<ol>' + items.map(function (url) {
                    return '<li><a href="' + Utils.escapeHtml(url) + '" target="_blank">' + Utils.escapeHtml(url) + '</a></li>';
                }).join('') + '</ol>' : '<p>Không có.</p>');
            }).join('');
            w.document.write('<html><head><title>Via God Mode Media</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:Arial,sans-serif;padding:16px;line-height:1.5}a{word-break:break-all}</style></head><body><h1>Media URLs</h1>' + html + '</body></html>');
            w.document.close();
        },
        copyUrls() {
            const urls = MediaModule.collectUrls();
            if (!urls.length) return alert('Không tìm thấy media URL.');
            ClipboardModule.write(urls.join('\n'), 'Copied ' + urls.length + ' media URLs');
        }
    };

    const UrlModule = {
        clean() {
            const u = new URL(window.location.href);
            Array.from(u.searchParams.keys()).forEach(function (key) {
                if (Core.config.trackingParams.some(function (p) { return key === p || key.startsWith(p); })) u.searchParams.delete(key);
            });
            window.history.replaceState(null, '', u.toString());
            ClipboardModule.write(u.toString(), 'URL cleaned');
        },
        translate() {
            window.location.href = 'https://translate.google.com/translate?sl=auto&tl=vi&u=' + encodeURIComponent(window.location.href);
        }
    };

    const ReaderModule = {
        open() {
            const source = document.querySelector('article') || document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
            const title = document.title || 'Reader Mode';
            const content = source.cloneNode(true);
            content.querySelectorAll('script, style, iframe, nav, aside, form, button, input, textarea, [class*="ad" i], [id*="ad" i]').forEach(function (el) { el.remove(); });
            document.documentElement.innerHTML = '<head><title>' + Utils.escapeHtml(title) + '</title><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:24px;background:#f7f7f7;color:#1f1f1f;font-family:Arial,sans-serif;line-height:1.65}.reader-wrap{max-width:760px;margin:auto;background:#fff;padding:24px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.08)}img,video{max-width:100%;height:auto}a{color:#1565c0}</style></head><body><div class="reader-wrap"><h1>' + Utils.escapeHtml(title) + '</h1>' + content.innerHTML + '</div></body>';
        }
    };

    const MiscModule = {
        antiAds() {
            const selector = ['iframe', '[class*="adblock" i]', '[class*="popup" i]', '[class*="overlay" i]', '[id*="popup" i]', '[id*="overlay" i]', '[class*="ads" i]', '[id*="ads" i]', '[class*="banner" i]'].join(',');
            document.querySelectorAll(selector).forEach(function (el) {
                if (!Core.isGodModeElement(el)) el.remove();
            });
            alert('Dọn rác xong!');
        },
        darkMode() {
            document.documentElement.classList.toggle('vgm-dark');
        },
        kill() {
            window.history.length > 1 ? window.history.back() : window.location.replace('about:blank');
        }
    };

    ActionRegistry.register({ id: 'kill', icon: '✕', label: 'Thoát/Back', color: '#ff3b30', run: MiscModule.kill });
    ActionRegistry.register({ id: 'videoFocus', icon: '📺', label: 'Full/PiP Video', color: '#e91e63', run: VideoModule.toggleFocus });
    ActionRegistry.register({ id: 'videoSpeed', icon: '⏩', label: 'Tốc độ Video', color: '#673ab7', run: VideoModule.setSpeed });
    ActionRegistry.register({ id: 'videoLoop', icon: '🔁', label: 'Loop Video', color: '#3f51b5', run: VideoModule.toggleLoop });
    ActionRegistry.register({ id: 'antiAds', icon: '🛡️', label: 'Dọn Ads', color: '#4caf50', run: MiscModule.antiAds });
    ActionRegistry.register({ id: 'passGen', icon: '🔑', label: 'Mật khẩu', color: '#000000', run: PasswordModule.generate });
    ActionRegistry.register({ id: 'forceCopy', icon: '📋', label: 'Force Copy', color: '#795548', run: ClipboardModule.enableForceCopy });
    ActionRegistry.register({ id: 'reader', icon: '📖', label: 'Reader', color: '#009688', run: ReaderModule.open });
    ActionRegistry.register({ id: 'rawText', icon: '📄', label: 'Copy Text', color: '#ff9800', run: ClipboardModule.copyRawText });
    ActionRegistry.register({ id: 'translate', icon: '🌏', label: 'Dịch trang', color: '#4285f4', run: UrlModule.translate });
    ActionRegistry.register({ id: 'cleanUrl', icon: '🔗', label: 'Clean URL', color: '#607d8b', run: UrlModule.clean });
    ActionRegistry.register({ id: 'darkMode', icon: '🌙', label: 'Dark Mode', color: '#333333', run: MiscModule.darkMode });
    ActionRegistry.register({ id: 'mediaList', icon: '📥', label: 'Media List', color: '#9c27b0', run: MediaModule.showList });
    ActionRegistry.register({ id: 'mediaCopy', icon: '🔎', label: 'Copy Media URL', color: '#00bcd4', run: MediaModule.copyUrls });

    Core.init();
    window.addEventListener('DOMContentLoaded', Core.init, { once: true });
})();
