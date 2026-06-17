// ==UserScript==
// @name         FB Reel Comments + Video Content Auto Export
// @namespace    local.fb.reel.comments.content
// @version      1.3.2
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
    filePrefix: 'fb-reel-data',
    videoRetry: 5,
    videoRetryDelay: 450,
    panelStateKey: 'fbcc_panel_open'
  };

  let running = false;
  let showLog = true;
  let videoCache = null;
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

  function setStatus(msg) {
    const el = document.querySelector('#fbcc-status');
    if (!el) return;
    el.style.display = showLog ? 'block' : 'none';
    el.textContent = msg || '';
  }

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

  const uniq = arr => [...new Set(arr.filter(Boolean))];

  const scoreVideoContent = v => [
    v.video_src,
    v.thumbnail,
    v.caption_text,
    v.description_meta,
    v.full_text,
    v.author_name
  ].filter(Boolean).join('').length;

  const mergeVideoContent = (oldData, newData) => {
    if (!oldData) return newData;
    if (!newData) return oldData;

    const out = { ...oldData, ...newData };

    for (const k of Object.keys(out)) {
      if (
        oldData[k] &&
        (!newData[k] ||
          String(oldData[k]).length > String(newData[k]).length)
      ) {
        out[k] = oldData[k];
      }
    }

    out.captured_at = new Date().toISOString();
    return out;
  };

  const extractJsonTexts = () => {
    const out = [];

    for (const s of document.scripts) {
      const t = s.textContent || '';
      if (!/creation_story|message|story|attachments|video/i.test(t)) continue;

      const matches = t.match(/"text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*){0,2000})"/g) || [];

      for (const m of matches) {
        try {
          const raw = m.replace(/^"text"\s*:\s*"/, '').replace(/"$/, '');
          const decoded = JSON.parse(`"${raw}"`);
          if (decoded && decoded.length > 10) out.push(decoded);
        } catch {}
      }
    }

    return uniq(out)
      .map(s => s.replace(/\s+/g, ' ').trim())
      .filter(s => s.length > 10)
      .sort((a, b) => b.length - a.length)
      .slice(0, 30);
  };

  const getVideoContentNow = () => {
    const reelUrl = location.href.split('?')[0];

    const video = document.querySelector('video');
    const videoSrc =
      video?.currentSrc ||
      video?.src ||
      document.querySelector('meta[property="og:video"]')?.content ||
      document.querySelector('meta[property="og:video:url"]')?.content ||
      null;

    const thumbnail =
      document.querySelector('meta[property="og:image"]')?.content ||
      video?.poster ||
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

    const badText =
      /^(thích|like|bình luận|comment|chia sẻ|share|follow|theo dõi|reply|phản hồi|xem thêm|see more|more)$/i;

    const textCandidates = all('div[dir="auto"], span[dir="auto"]')
      .filter(visible)
      .map(txt)
      .filter(Boolean)
      .filter(s => s.length > 3)
      .filter(s => !badText.test(s));

    const jsonTexts = extractJsonTexts();

    const authorName = txt(authorLink) || null;

    const contentTexts = uniq([
      ...textCandidates,
      ...jsonTexts
    ])
      .filter(s => s !== authorName)
      .filter(s => !badText.test(s));

    const caption =
      contentTexts.sort((a, b) => b.length - a.length)[0] ||
      desc ||
      null;

    const fullText =
      contentTexts.join('\n\n') ||
      caption ||
      desc ||
      null;

    return {
      reel_id: currentReelKey,
      reel_url: reelUrl,
      page_title: title,
      description_meta: desc,
      caption_text: caption,
      full_text: fullText,
      json_texts: jsonTexts,
      author_name: authorName,
      author_url: authorLink?.href || null,
      video_src: videoSrc,
      thumbnail,
      video_duration: Number.isFinite(video?.duration) ? video.duration : null,
      video_width: video?.videoWidth || null,
      video_height: video?.videoHeight || null,
      captured_at: new Date().toISOString()
    };
  };

  const getVideoContent = () => {
    const fresh = getVideoContentNow();
    videoCache = mergeVideoContent(videoCache, fresh);
    return videoCache || fresh;
  };

  const refreshVideoContent = async () => {
    let best = getVideoContent();

    for (let i = 0; i < CFG.videoRetry; i++) {
      await sleep(CFG.videoRetryDelay);
      const fresh = getVideoContent();
      if (scoreVideoContent(fresh) > scoreVideoContent(best)) best = fresh;
    }

    videoCache = mergeVideoContent(videoCache, best);
    return videoCache;
  };

  const exportJSON = async (reason = 'manual', key = currentStorageKey, reelKey = currentReelKey) => {
    if (exportedKeys.has(`${key}:${reason}`) && reason !== 'manual') return;

    const comments = Object.values(loadStore(key));
    if (!comments.length && reason !== 'manual') return;

    exportedKeys.add(`${key}:${reason}`);
    setStatus('Exporting JSON...');

    const video = await refreshVideoContent();

    const payload = {
      reel_id: reelKey,
      reel_url: `https://www.facebook.com/reel/${reelKey}`,
      reason,
      exported_at: new Date().toISOString(),
      count: comments.length,
      video,
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

    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus(`Exported ${comments.length} comments`);
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

  const expandVideoContent = async () => {
    await clickByText([
      /^xem thêm$/i,
      /^see more$/i,
      /^more$/i,
      /xem thêm/i,
      /see more/i
    ]);

    await sleep(rand(350, 700));
    await refreshVideoContent();
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
    setStatus('Opening comments...');

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

    await expandVideoContent();
    await openCommentsIfNeeded();
    await sleep(rand(700, 1200));

    let idle = 0;
    let lastCount = 0;
    const crawlReelKey = currentReelKey;

    while (running && idle < CFG.maxIdleRounds) {
      if (getReelKey(location.href) !== crawlReelKey) break;

      setStatus('Loading replies...');

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

      await expandVideoContent();

      const saved = saveRecords(extractAll());
      const count = saved.length;

      setStatus(`Extracted ${count} comments`);

      if (count === lastCount) idle++;
      else idle = 0;

      lastCount = count;
      await sleep(rand(CFG.delayMin, CFG.delayMax));
    }

    running = false;
    setStatus('Crawl completed');
    await exportJSON('completed');
  };

  const stop = async () => {
    running = false;
    setStatus('Crawl stopped');
    await exportJSON('stopped');
  };

  const clearStore = () => {
    localStorage.removeItem(currentStorageKey);
    setStatus('Cleared current Reel data');
  };

  const handleUrlChange = async () => {
    const newKey = getReelKey(location.href);
    if (newKey === currentReelKey) return;

    const oldKey = currentStorageKey;
    const oldReelKey = currentReelKey;

    running = false;
    setStatus('URL changed');
    await exportJSON('url-changed', oldKey, oldReelKey);

    currentReelKey = newKey;
    currentStorageKey = makeStorageKey(newKey);
    videoCache = null;

    await sleep(1200);
    await expandVideoContent();

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
        width: 240px;
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
      #fbcc-status {
        margin-top: 7px;
        padding-top: 6px;
        border-top: 1px solid rgba(255,255,255,.12);
        color: #42ff73;
        font-size: 11px;
        min-height: 16px;
        word-break: break-word;
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

        <label id="fbcc-row">
          <input id="fbcc-log" type="checkbox" checked>
          Show green log
        </label>

        <div id="fbcc-status">Ready</div>
      </div>
      <button id="fbcc-toggle">💬</button>
    `;

    document.body.appendChild(panel);

    const $ = sel => panel.querySelector(sel);

    if (localStorage.getItem(CFG.panelStateKey) === '1') {
      panel.classList.add('open');
    }

    $('#fbcc-toggle').onclick = () => {
      panel.classList.toggle('open');
      localStorage.setItem(
        CFG.panelStateKey,
        panel.classList.contains('open') ? '1' : '0'
      );
    };

    $('#fbcc-start').onclick = () => crawl();
    $('#fbcc-stop').onclick = () => stop();
    $('#fbcc-export').onclick = () => exportJSON('manual');
    $('#fbcc-clear').onclick = () => clearStore();

    $('#fbcc-log').onchange = e => {
      showLog = e.target.checked;
      setStatus(showLog ? 'Log enabled' : '');
    };
  };

  window.FBReelCommentsCrawler = {
    start: crawl,
    stop,
    export: () => exportJSON('manual'),
    clear: clearStore,
    video: getVideoContent,
    refreshVideo: refreshVideoContent,
    expandVideo: expandVideoContent,
    data: () => ({
      video: getVideoContent(),
      comments: Object.values(loadStore())
    })
  };

  createUI();
  hookHistory();
  expandVideoContent();
})();
