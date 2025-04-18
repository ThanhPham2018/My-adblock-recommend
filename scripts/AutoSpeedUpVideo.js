// ==UserScript==
// @name         Tăng tốc video tự động và điều khiển
// @namespace    http://your.website.or.github/
// @version      1.0
// @description  Tự động tăng tốc độ phát lại video trên các trang web và thêm bảng điều khiển '+' '-' '0' để tùy chỉnh tốc độ với bước nhảy 0.25x.
// @author       ThanhPN
// @match        *://*/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- Cấu hình ---
    const DEFAULT_INITIAL_SPEED = 2; // Tốc độ ban đầu khi tải trang
    const SPEED_STEP = 0.25;           // Bước nhảy khi tăng/giảm tốc độ
    const RESET_SPEED = 1.0;           // Tốc độ khi nhấn nút '0'

    // --- Biến trạng thái ---
    let currentSpeed = DEFAULT_INITIAL_SPEED; // Tốc độ hiện tại đang áp dụng
    let speedDisplayElement = null;           // Tham chiếu đến phần tử hiển thị tốc độ

    // --- Hàm tiện ích ---

    /**
     * Áp dụng tốc độ phát lại cho tất cả các thẻ video trên trang.
     * @param {number} speed - Tốc độ muốn áp dụng.
     */
    function setVideoSpeed(speed) {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            // Đảm bảo phần tử video còn tồn tại và thuộc tính playbackRate khả dụng
            if (video && typeof video.playbackRate !== 'undefined') {
                 // Kiểm tra nếu video đang tạm dừng, không thay đổi tốc độ để tránh tự play lại
                 // Tuy nhiên, yêu cầu là *tăng tốc*, nên ta vẫn set speed ngay cả khi pause
                 // Nếu muốn chỉ tăng tốc video đang play, thêm: if (!video.paused)
                video.playbackRate = speed;
                // console.log(`Đã đặt tốc độ video: ${video.src || video.currentSrc} thành ${speed}x`);
            }
        });
    }

    /**
     * Cập nhật hiển thị tốc độ trên bảng điều khiển.
     * @param {number} speed - Tốc độ hiện tại.
     */
    function updateSpeedDisplay(speed) {
        if (speedDisplayElement) {
            // Làm tròn tốc độ đến 2 chữ số thập phân để hiển thị gọn gàng
            speedDisplayElement.textContent = `${speed.toFixed(2)}x`;
        }
    }

    /**
     * Tìm và áp dụng tốc độ hiện tại cho các video mới thêm vào DOM.
     * (Được gọi bởi MutationObserver)
     * @param {NodeList} nodes - Danh sách các node mới được thêm vào.
     */
    function findAndApplySpeedToNewVideos(nodes) {
        nodes.forEach(node => {
            // Node có thể là element, text node, v.v. Chỉ xử lý element
            if (node.nodeType === Node.ELEMENT_NODE) {
                // Kiểm tra nếu node đó là thẻ video
                if (node.tagName === 'VIDEO') {
                    setVideoSpeed(currentSpeed);
                }
                // Kiểm tra nếu node chứa các thẻ video bên trong nó (subtree)
                if (node.querySelector) {
                     // querySelectorAll có thể chậm nếu gọi quá nhiều lần trên cây DOM lớn
                     // Tuy nhiên, trong callback của observer, nó chỉ tìm trong node mới được thêm
                     // nên thường hiệu quả.
                    const videos = node.querySelectorAll('video');
                    if (videos.length > 0) {
                         // Thay vì lặp qua từng video, ta chỉ cần gọi setVideoSpeed một lần
                         // vì hàm này đã query tất cả video trên trang rồi.
                         // Việc này đảm bảo video mới được set tốc độ, và các video cũ (nếu có)
                         // vẫn giữ tốc độ hiện tại.
                        setVideoSpeed(currentSpeed);
                    }
                }
            }
        });
    }


    // --- Tạo và thêm bảng điều khiển vào trang ---
    function createControlPanel() {
        const panelId = 'tm-video-speed-controls';
        // Kiểm tra xem bảng điều khiển đã tồn tại chưa để tránh tạo trùng
        if (document.getElementById(panelId)) {
            console.log('Tampermonkey Speed Control: Bảng điều khiển đã tồn tại.');
            return null; // Trả về null nếu đã tồn tại
        }

        const panel = document.createElement('div');
        panel.id = panelId;

        // Thêm CSS cho bảng điều khiển
        GM_addStyle(`
            #${panelId} {
                position: fixed;
                top: 10px;
                right: 10px;
                background-color: rgba(0, 0, 0, 0.7); /* Nền đen mờ */
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                z-index: 10000; /* Đảm bảo hiển thị trên cùng */
                font-family: sans-serif;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px; /* Khoảng cách giữa các phần tử */
                user-select: none; /* Ngăn chọn văn bản */
            }
            #${panelId} button {
                background-color: rgba(255, 255, 255, 0.2); /* Nền trắng mờ cho nút */
                border: none;
                color: white;
                padding: 3px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-size: 14px;
                min-width: 25px; /* Độ rộng tối thiểu cho nút */
                text-align: center;
                transition: background-color 0.2s ease; /* Hiệu ứng hover */
            }
            #${panelId} button:hover {
                background-color: rgba(255, 255, 255, 0.4);
            }
             #${panelId} button:active {
                background-color: rgba(255, 255, 255, 0.6);
            }
            #${panelId} #tm-speed-display {
                 min-width: 40px; /* Độ rộng tối thiểu cho hiển thị tốc độ */
                 text-align: center;
                 font-weight: bold;
            }
        `);

        // Tạo phần tử hiển thị tốc độ
        speedDisplayElement = document.createElement('span');
        speedDisplayElement.id = 'tm-speed-display';
        panel.appendChild(speedDisplayElement);

        // Tạo các nút điều khiển
        const decreaseBtn = document.createElement('button');
        decreaseBtn.textContent = '-';
        decreaseBtn.id = 'tm-decrease-speed';
        panel.appendChild(decreaseBtn);

        const increaseBtn = document.createElement('button');
        increaseBtn.textContent = '+';
        increaseBtn.id = 'tm-increase-speed';
        panel.appendChild(increaseBtn);

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '0';
        resetBtn.id = 'tm-reset-speed';
        panel.appendChild(resetBtn);

        // Thêm bảng điều khiển vào body của trang
        document.body.appendChild(panel);

        return { decreaseBtn, increaseBtn, resetBtn }; // Trả về các nút để gắn sự kiện
    }

    // --- Logic chính ---
    function initializeScript() {
        // 1. Tạo bảng điều khiển
        const controlButtons = createControlPanel();

        // Nếu bảng điều khiển đã tồn tại (ví dụ: do script chạy lại), thoát
        if (!controlButtons) {
            return;
        }

        const { decreaseBtn, increaseBtn, resetBtn } = controlButtons;

        // 2. Gắn sự kiện cho các nút
        increaseBtn.addEventListener('click', () => {
            currentSpeed += SPEED_STEP;
            // Có thể thêm giới hạn tốc độ tối đa nếu cần, ví dụ: Math.min(16.0, currentSpeed + SPEED_STEP);
            setVideoSpeed(currentSpeed);
            updateSpeedDisplay(currentSpeed);
        });

        decreaseBtn.addEventListener('click', () => {
             // Ngăn tốc độ xuống dưới một giá trị tối thiểu hợp lý (ví dụ: 0.1x)
            currentSpeed = Math.max(0.10, currentSpeed - SPEED_STEP);
            setVideoSpeed(currentSpeed);
            updateSpeedDisplay(currentSpeed);
        });

        resetBtn.addEventListener('click', () => {
            currentSpeed = RESET_SPEED; // Đặt lại về tốc độ gốc (1.0x)
            setVideoSpeed(currentSpeed);
            updateSpeedDisplay(currentSpeed);
        });

        // 3. Áp dụng tốc độ ban đầu cho các video có sẵn khi trang tải xong
        // Dùng setTimeout nhỏ để đảm bảo DOM đã ổn định hơn sau document-idle
         setTimeout(() => {
            setVideoSpeed(DEFAULT_INITIAL_SPEED);
            updateSpeedDisplay(DEFAULT_INITIAL_SPEED); // Cập nhật hiển thị ban đầu
         }, 100); // Độ trễ 100ms

        // 4. Theo dõi sự thay đổi DOM để bắt các video được thêm sau
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    // Nếu có node mới được thêm vào, tìm và áp dụng tốc độ cho chúng
                    findAndApplySpeedToNewVideos(mutation.addedNodes);
                }
            });
        });

        // Bắt đầu quan sát body của trang với các tùy chọn:
        // childList: Theo dõi việc thêm/xóa trực tiếp các node con
        // subtree: Mở rộng quan sát vào toàn bộ cây con của node mục tiêu (body)
        observer.observe(document.body, { childList: true, subtree: true });

        console.log('Tampermonkey Video Speed Control (v1.0) đã khởi chạy!');
    }

    // Chờ cho DOM được tải đầy đủ trước khi khởi chạy script chính
    // Mặc định @run-at document-idle hoặc document-end thường là đủ,
    // nhưng sử dụng DOMContentLoaded an toàn hơn trong một số trường hợp.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        // DOM đã sẵn sàng
        initializeScript();
    }

})();
