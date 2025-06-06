// ==UserScript==
// @name         Copy NotebookLM Text Content
// @namespace    http://tampermonkey.net/
// @version      0.5
// @description  Copy toàn bộ nội dung text từ transcript
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllNotebookLMContent.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllNotebookLMContent.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://notebooklm.google.com/*
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

// ==UserScript==
// @name         Copy NotebookLM Text Content
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Copy toàn bộ nội dung text từ transcript
// @author       ThanhPN
// @downloadURL     https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllNotebookLMContent.js
// @updateURL       https://raw.githubusercontent.com/ThanhPham2018/My-adblock-recommend/refs/heads/main/scripts/CopyAllNotebookLMContent.js
// @homepageURL     https://github.com/ThanhPham2018/My-adblock-recommend/tree/main/scripts
// @match        https://notebooklm.google.com/*
// @grant        GM_registerMenuCommand
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    function copyToClipboard(content, format = 'text') {
        GM_setClipboard(content, { type: 'text' });
        console.log(`Đã copy (${format}):`, content.slice(0, 60) + '...');
    }

    function convertBoldSpansToStrong(container) {
        container.querySelectorAll('span.bold').forEach(span => {
            const strong = document.createElement('strong');
            strong.textContent = span.textContent;
            span.replaceWith(strong);
        });
    }

    function cleanParagraph(clone) {
        clone.querySelectorAll('button.citation-marker, .citation-marker').forEach(el => el.remove());
        convertBoldSpansToStrong(clone);
    }

    function formatContent(container, format = 'markdown') {
        if (!container) return '';

        const seen = new Set();
        const fragments = Array.from(container.querySelectorAll('[data-start-index], p, li'))
            .filter(el => !el.classList.contains('citation-marker'))
            .sort((a, b) => {
                const aIdx = parseInt(a.dataset.startIndex || '0');
                const bIdx = parseInt(b.dataset.startIndex || '0');
                return aIdx - bIdx;
            })
            .map(el => {
                const bullet = el.parentElement?.classList.contains('ql-editor') ? '' : el.parentElement?.querySelector('.bullet')?.textContent?.trim();
                const indentMatch = el.className.match(/ql-indent-(\d+)/);
                const level = indentMatch ? parseInt(indentMatch[1]) : 0;

                const clone = el.cloneNode(true);
                cleanParagraph(clone);

                if (format === 'markdown') {
                    clone.querySelectorAll('strong').forEach(strong => {
                        const text = strong.textContent;
                        strong.replaceWith(`**${text}**`);
                    });
                    const tabs = '\t'.repeat(level);
                    const line = `${tabs}${bullet ? bullet + ' ' : ''}${clone.textContent.trim()}`;
                    return seen.has(line) ? '' : (seen.add(line), line);
                } else {
                    const div = document.createElement('div');
                    div.style.marginLeft = `${level * 1.25}rem`;
                    if (bullet) {
                        const b = document.createElement('span');
                        b.style.marginRight = '0.5rem';
                        b.textContent = bullet;
                        div.appendChild(b);
                    }
                    Array.from(clone.childNodes).forEach(n => div.appendChild(n));
                    return div.outerHTML;
                }
            })
            .filter(Boolean);

        return fragments.join(format === 'markdown' ? '\n\n' : '\n\n').replace(/\n{3,}/g, '\n\n');
    }

    function downloadMarkdownFile(content, filename = "note.md") {
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    function handlePanelCommand(panelSelector, format, action, filename = "note.md") {
        const container = document.querySelector(panelSelector);
        if (!container) return alert(`Không tìm thấy panel: ${panelSelector}`);

        const content = formatContent(container, format);
        if (!content) return alert('Không có nội dung để xử lý.');

        if (action === 'copy') {
            copyToClipboard(content, format);
            alert(`✅ Đã copy nội dung (${format}) từ panel.`);
        } else if (action === 'download') {
            downloadMarkdownFile(content, filename);
            copyToClipboard(content, format);
            alert('✅ Đã copy và tải về file Markdown.');
        }
    }

    // Source Panel
    GM_registerMenuCommand("📋 [Source] Copy HTML", () => handlePanelCommand('labs-tailwind-doc-viewer, .note-editor, .note-editor--readonly', 'html', 'copy'));
    GM_registerMenuCommand("📝 [Source] Copy Markdown", () => handlePanelCommand('labs-tailwind-doc-viewer, .note-editor, .note-editor--readonly', 'markdown', 'copy'));
    GM_registerMenuCommand("⬇️ [Source] Tải Markdown", () => handlePanelCommand('labs-tailwind-doc-viewer, .note-editor, .note-editor--readonly', 'markdown', 'download', 'source_note.md'));

    // Studio Panel
    GM_registerMenuCommand("📋 [Studio] Copy HTML", () => handlePanelCommand('.studio-panel', 'html', 'copy'));
    GM_registerMenuCommand("📝 [Studio] Copy Markdown", () => handlePanelCommand('.studio-panel', 'markdown', 'copy'));
    GM_registerMenuCommand("⬇️ [Studio] Tải Markdown", () => handlePanelCommand('.studio-panel', 'markdown', 'download', 'studio_note.md'));

    // Chat Panel (text only)
    GM_registerMenuCommand("💬 [Chat] Copy text", () => {
        const chatPanel = document.querySelector('.chat-panel');
        if (!chatPanel) return alert('Không tìm thấy Chat Panel!');
        const text = chatPanel.innerText.trim();
        if (text) {
            copyToClipboard(text);
            alert('✅ Đã copy nội dung chat.');
        }
    });

    // QL Editor Panel
    GM_registerMenuCommand("📋 [QL-Editor] Copy HTML", () => handlePanelCommand('.ql-editor', 'html', 'copy'));
    GM_registerMenuCommand("📝 [QL-Editor] Copy Markdown", () => handlePanelCommand('.ql-editor', 'markdown', 'copy'));
    GM_registerMenuCommand("⬇️ [QL-Editor] Tải Markdown", () => handlePanelCommand('.ql-editor', 'markdown', 'download', 'ql_editor_note.md'));

})();
