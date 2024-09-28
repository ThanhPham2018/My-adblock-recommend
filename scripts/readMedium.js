// ==UserScript==
// @name         Đọc Medium và các trang tương tự (Nâng cao)
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Tự động chuyển hướng trang Medium và các trang tương tự sang các trang đọc thay thế
// @match        https://medium.com/*
// @match        https://*.medium.com/*
// @match        https://towardsdatascience.com/*
// @match        https://hackernoon.com/*
// @match        https://betterhumans.pub/*
// @match        https://codeburst.io/*
// @run-at       document-start
// @grant        none
// @priority     1
// ==/UserScript==

(function () {
  "use strict";

  const alternativeSites = [
    "https://readmedium.com/",
    "https://scribe.rip/",
    "https://freedium.cfd/",
  ];

  const mediumHosts = new Set([
    "medium.com",
    "towardsdatascience.com",
    "hackernoon.com",
    "betterhumans.pub",
    "codeburst.io",
  ]);

  function isMediumLike(url) {
    try {
      const hostname = new URL(url).hostname;
      return (
        mediumHosts.has(hostname) ||
        [...mediumHosts].some((host) => hostname.endsWith(`.${host}`))
      );
    } catch (error) {
      console.error("URL không hợp lệ:", error);
      return false;
    }
  }

  function redirectToAlternative(index = 0) {
    if (index >= alternativeSites.length) {
      console.error("Không thể chuyển hướng đến bất kỳ trang thay thế nào.");
      return;
    }

    const targetUrl =
      alternativeSites[index] + encodeURIComponent(location.href);

    if (!targetUrl.startsWith("https://")) {
      console.error("URL đích không an toàn:", targetUrl);
      redirectToAlternative(index + 1);
      return;
    }

    fetch(targetUrl, { method: "HEAD", mode: "no-cors" })
      .then(() => {
        location.replace(targetUrl);
      })
      .catch((error) => {
        console.warn(
          `Không thể truy cập ${alternativeSites[index]}, thử trang tiếp theo...`,
          error
        );
        redirectToAlternative(index + 1);
      });
  }

  if (isMediumLike(location.href)) {
    redirectToAlternative();
  }
})();
