// ==UserScript==
// @name         FB Reel Comments + Video Content Auto Export
// @namespace    local.fb.reel.comments.content
// @version      1.3.0
// @author       ThanhPN (mod by request)
// @downloadURL  https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/export-fb-reel-comments.js
// @updateURL    https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/export-fb-reel-comments.js
// @homepageURL  https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://www.facebook.com/reel/*
// @match        https://web.facebook.com/reel/*
// @grant        GM_download
// ==/UserScript==

(() => {
  'use strict';

  const CFG = {
    maxIdleRounds: 25,
    delayMin: 700,
    delayMax: 1600,
    scrollStep: 900,
    storagePrefix: 'fb_reel_comments_',
    filePrefix: 'fb-reel-data'
  };

  let running = false;
  let currentReelKey = getReelKey(location.href);
  let currentStorageKey = makeStorageKey(currentReelKey);
  let exportedKeys = new Set();

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a));
  const all = (sel, root = document) => [...root.querySelectorAll(sel)];
  const txt = el => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim();

  function getReelKey(url) {
    const m = url.match(/\/reel\/([^/?#]+)/);
    return m?.[1] || location.pathname.replace(/\W+/g, '_');
  }

  function makeStorageKey(reelKey) {
    return `${CFG.storagePrefix}${reelKey}`;
  }

  const visible = el => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const setStatus = () => {};

  const loadStore = (key = currentStorageKey) => {
    try {
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  };

  const saveRecords = records => {
    const db = loadStore();
    for (const r of records) db[r.key] = r;
    localStorage.setItem(currentStorageKey, JSON.stringify(db));
    return Object.values(db);
  };

  const getVideoContent = () => {
    const reelUrl = location.href.split('?')[0];

    const video = document.querySelector('video');
    const videoSrc =
      video?.currentSrc ||
      video?.src ||
      document.querySelector('meta[property="og:video"]')?.content ||
      null;

    const title =
      document.querySelector('meta[property="og:title"]')?.content ||
      document.title ||
      null;

    const desc =
      document.querySelector('meta[property="og:description"]')?.content ||
      document.querySelector('meta[name="description"]')?.content ||
      null;

    const authorLink = all('a[href]')
      .filter(visible)
      .filter(a => txt(a).length > 0)
      .filter(a => !/comment|reaction|reply|like|share|watch|reel/i.test(a.href))[0];

    const textCandidates = all('div[dir="auto"], span[dir="auto"]')
      .filter(visible)
      .map(txt)
      .filter(Boolean)
      .filter(s => s.length > 3)
      .filter(s => !/^(thích|like|bình luận|comment|chia sẻ|share|follow|theo dõi|reply|phản hồi)$/i.test(s));

    const caption = textCandidates
      .filter(s => s !== txt(authorLink))
      .sort((a, b) => b.length - a.length)[0] || desc || null;

    return {
      reel_id: currentReelKey,
      reel_url: reelUrl,
      page_title: title,
      description_meta: desc,
      caption_text: caption,
      author_name: txt(authorLink) || null,
      author_url: authorLink?.href || null,
      video_src: videoSrc,
      video_duration: Number.isFinite(video?.duration) ? video.duration : null,
      captured_at: new Date().toISOString()
    };
  };

  const exportJSON = (reason = 'manual', key = currentStorageKey, reelKey = currentReelKey) => {
    if (exportedKeys.has(`${key}:${reason}`) && reason !== 'manual') return;

    const comments = Object.values(loadStore(key));
    if (!comments.length && reason !== 'manual') return;

    exportedKeys.add(`${key}:${reason}`);

    const payload = {
      reel_id: reelKey,
      reel_url: `https://www.facebook.com/reel/${reelKey}`,
      reason,
      exported_at: new Date().toISOString(),
      count: comments.length,
      video: getVideoContent(),
      comments
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });

    const name = `${CFG.filePrefix}-${reelKey}-${reason}-${Date.now()}.json`;
    const url = URL.createObjectURL(blob);

    if (typeof GM_download === 'function') GM_download(url, name);
    else {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
    }
  };

  const clickByText = async patterns => {
    const nodes = all('[role="button"], span, a, div[aria-label]')
      .filter(visible)
      .filter(el => {
        const s = `${txt(el)} ${el.getAttribute?.('aria-label') || ''}`;
        return patterns.some(p => p.test(s));
      });

    for (const el of nodes.slice(0, 8)) {
      const btn = el.closest('[role="button"], a') || el;
      try {
        btn.scrollIntoView({ block: 'center' });
        await sleep(rand(150, 350));
        btn.click();
        await sleep(rand(500, 900));
      } catch {}
    }

    return nodes.length;
  };

  const getPanel = () => {
    const candidates = [
      ...all('div[role="complementary"]'),
      ...all('div[role="dialog"]'),
      ...all('div[style*="overflow"]')
    ].filter(visible);

    return candidates
      .map(el => ({
        el,
        score:
          all('div[role="article"]', el).length * 10 +
          (/bình luận|comment|phản hồi|reply/i.test(txt(el)) ? 20 : 0) +
          el.scrollHeight / 1000
      }))
      .sort((a, b) => b.score - a.score)[0]?.el || document.scrollingElement;
  };

  const openCommentsIfNeeded = async () => {
    const alreadyOpen =
      /bình luận|comment|phản hồi|reply/i.test(txt(getPanel())) &&
      all('div[role="article"]').filter(visible).length > 0;

    if (alreadyOpen) return true;

    return !!await clickByText([
      /bình luận/i,
      /comment/i,
      /comments/i
    ]);
  };

  const extractId = article => {
    const a = article.querySelector('a[href*="comment_id"], a[href*="comment"], a[href*="/reel/"]');
    const href = a?.href || '';
    const m = href.match(/comment_id=([^&]+)/) || href.match(/comment\/([^/?#]+)/);
    return m?.[1] || null;
  };

  const extractAuthor = article => {
    const a = all('a[href]', article)
      .filter(x => !/comment|reaction|reply|like/i.test(x.href))
      .filter(x => txt(x).length > 0)[0];

    return {
      author_name: txt(a) || null,
      author_url: a?.href || null
    };
  };

  const extractCommentText = article => {
    const { author_name } = extractAuthor(article);
    const bad = /^(thích|like|reply|phản hồi|xem thêm|see more|\d+[smhdw]|vừa xong)$/i;

    return all('div[dir="auto"], span[dir="auto"]', article)
      .map(txt)
      .filter(Boolean)
      .filter(s => !bad.test(s))
      .filter(s => s !== author_name)
      .filter(s => s.length > 1)
      .sort((a, b) => b.length - a.length)[0] || null;
  };

  const extractTime = article => {
    const a = article.querySelector('a[href*="comment_id"], a[href*="comment"]');
    return txt(a) || null;
  };

  const extractAll = () => {
    const reel_url = location.href.split('?')[0];

    return all('div[role="article"]')
      .filter(visible)
      .map(article => {
        const { author_name, author_url } = extractAuthor(article);
        const text = extractCommentText(article);
        const comment_id = extractId(article);

        if (!text && !author_name) return null;

        const key = comment_id || `${author_name || ''}::${text || ''}`.slice(0, 240);

        return {
          key,
          reel_id: currentReelKey,
          reel_url,
          comment_id,
          author_name,
          author_url,
          text,
          timestamp_raw: extractTime(article),
          crawled_at: new Date().toISOString()
        };
      })
      .filter(Boolean);
  };

  const crawl = async () => {
    if (running) return;

    running = true;

    await openCommentsIfNeeded();
    await sleep(rand(700, 1200));

    let idle = 0;
    let lastCount = 0;
    const crawlReelKey = currentReelKey;

    while (running && idle < CFG.maxIdleRounds) {
      if (getReelKey(location.href) !== crawlReelKey) break;

      await clickByText([
        /xem thêm bình luận/i,
        /view more comments/i,
        /xem thêm phản hồi/i,
        /view replies/i,
        /see more/i,
        /xem thêm/i
      ]);

      const panel = getPanel();

      try {
        panel.scrollBy?.(0, CFG.scrollStep);
        document.scrollingElement.scrollBy(0, 300);
      } catch {}

      const saved = saveRecords(extractAll());
      const count = saved.length;

      if (count === lastCount) idle++;
      else idle = 0;

      lastCount = count;
      await sleep(rand(CFG.delayMin, CFG.delayMax));
    }

    running = false;
    exportJSON('completed');
  };

  const stop = () => {
    running = false;
    exportJSON('stopped');
  };

  const clearStore = () => {
    localStorage.removeItem(currentStorageKey);
  };

  const handleUrlChange = async () => {
    const newKey = getReelKey(location.href);
    if (newKey === currentReelKey) return;

    const oldKey = currentStorageKey;
    const oldReelKey = currentReelKey;

    running = false;
    exportJSON('url-changed', oldKey, oldReelKey);

    currentReelKey = newKey;
    currentStorageKey = makeStorageKey(newKey);

    await sleep(1200);

    if (document.querySelector('#fbcc-auto')?.checked) crawl();
  };

  const hookHistory = () => {
    const wrap = fn => function (...args) {
      const ret = fn.apply(this, args);
      setTimeout(handleUrlChange, 300);
      return ret;
    };

    history.pushState = wrap(history.pushState);
    history.replaceState = wrap(history.replaceState);
    window.addEventListener('popstate', () => setTimeout(handleUrlChange, 300));
    setInterval(handleUrlChange, 1000);
  };

  const createUI = () => {
    if (document.querySelector('#fbcc-panel')) return;

    const css = document.createElement('style');
    css.textContent = `
      #fbcc-panel {
        position: fixed;
        left: 12px;
        bottom: 12px;
        z-index: 2147483647;
        font: 12px/1.4 system-ui, sans-serif;
        color: #fff;
      }
      #fbcc-panel * { box-sizing: border-box; }
      #fbcc-box {
        display: none;
        width: 230px;
        margin-bottom: 8px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(18,18,18,.94);
        box-shadow: 0 4px 18px rgba(0,0,0,.35);
        backdrop-filter: blur(8px);
      }
      #fbcc-panel.open #fbcc-box { display: block; }
      #fbcc-box button {
        width: 100%;
        margin-top: 6px;
        padding: 7px 8px;
        border: 0;
        border-radius: 8px;
        cursor: pointer;
        background: #333;
        color: #fff;
        font-weight: 600;
      }
      #fbcc-start { background: #1877f2 !important; }
      #fbcc-stop { background: #8b1e1e !important; }
      #fbcc-export { background: #245c2a !important; }
      #fbcc-toggle {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: 0;
        background: #1877f2;
        color: #fff;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0,0,0,.28);
        font-weight: 800;
        font-size: 18px;
      }
      #fbcc-row {
        margin-top: 8px;
        display: flex;
        gap: 6px;
        align-items: center;
        opacity: .9;
      }
    `;

    document.documentElement.appendChild(css);

    const panel = document.createElement('div');
    panel.id = 'fbcc-panel';
    panel.innerHTML = `
      <div id="fbcc-box">
        <b>Reel Data</b>
        <button id="fbcc-start">Start crawl</button>
        <button id="fbcc-stop">Stop + export</button>
        <button id="fbcc-export">Export now</button>
        <button id="fbcc-clear">Clear current</button>
        <label id="fbcc-row">
          <input id="fbcc-auto" type="checkbox" checked>
          Auto crawl next video
        </label>
      </div>
      <button id="fbcc-toggle">💬</button>
    `;

    document.body.appendChild(panel);

    const $ = sel => panel.querySelector(sel);

    $('#fbcc-toggle').onclick = () => panel.classList.toggle('open');
    $('#fbcc-start').onclick = () => crawl();
    $('#fbcc-stop').onclick = () => stop();
    $('#fbcc-export').onclick = () => exportJSON('manual');
    $('#fbcc-clear').onclick = () => clearStore();
  };

  window.FBReelCommentsCrawler = {
    start: crawl,
    stop,
    export: () => exportJSON('manual'),
    clear: clearStore,
    video: getVideoContent,
    data: () => ({
      video: getVideoContent(),
      comments: Object.values(loadStore())
    })
  };

  createUI();
  hookHistory();
})();
