document.addEventListener('DOMContentLoaded', function() {
    // ==================== 1. 获取所有DOM元素 ====================
    var body = document.getElementById('body');
    var audio = document.getElementById('audioTag');
    var musicTitle = document.getElementById('music-title');
    var recordImg = document.getElementById('record-img');
    var author = document.getElementById('author-name');
    var progress = document.getElementById('progress');
    var progressTotal = document.getElementById('progress-total');
    var playedTime = document.getElementById('playedTime');
    var audioTime = document.getElementById('audioTime');
    var mode = document.getElementById('playMode');
    var skipForward = document.getElementById('skipForward');
    var pause = document.getElementById('playPause');
    var skipBackward = document.getElementById('skipBackward');
    var volume = document.getElementById('volume');
    var volumeTogger = document.getElementById('volumn-togger');
    var list = document.getElementById('list');
    var speed = document.getElementById('speed');
    var MV = document.getElementById('MV');
    var closeList = document.getElementById('close-list');
    var musicList = document.getElementById('music-list');
    
    // 获取进度条元素
    var pgsPlay = document.querySelector('.pgs-play');
    
    // ==================== 2. 播放状态变量 ====================
    var musicId = 0; 
    var modeId = 1;
    var lastVolumn = 70;
    var musicData = [
        ['洛春赋', '云汐'],
        ['没语季节', '黄霄雲'],
        ['落日未眠', '鞠婧祎'],
        ['You Never Know', 'Heon Seo']
    ];
    
    // ==================== 3. 创建圆形进度指示器 ====================
    // 在进度条上添加圆形指示器
    var progressIndicator = document.createElement('div');
    progressIndicator.className = 'progress-indicator';
    if (progressTotal) {
        progressTotal.appendChild(progressIndicator);
    }
    
    // ==================== 4. 核心功能函数 ====================
    
    // 暂停/播放功能实现
    if (pause) {
        pause.onclick = function (e) {
            if (audio.paused) {
                audio.play();
                rotateRecord();
                pause.classList.remove('icon-play');
                pause.classList.add('icon-pause');
                
                // 添加播放状态类到进度条
                if (pgsPlay) {
                    pgsPlay.classList.add('playing');
                }
                if (progressTotal) {
                    progressTotal.classList.add('playing');
                }
            } else {
                audio.pause();
                rotateRecordStop();
                pause.classList.remove('icon-pause');
                pause.classList.add('icon-play');
                
                // 移除播放状态类
                if (pgsPlay) {
                    pgsPlay.classList.remove('playing');
                }
                if (progressTotal) {
                    progressTotal.classList.remove('playing');
                }
            }
        };
    }
    
    // 更新进度条和圆形指示器
    audio.addEventListener('timeupdate', updateProgress);
    
    function updateProgress() {
        // 保护性检查：确保音频时长有效
        if (!audio.duration || isNaN(audio.duration) || audio.duration <= 0) {
            progress.style.width = '0%';
            progress.style.setProperty('--progress-width', '0%');
            playedTime.innerText = '00:00';
            updateProgressIndicator(0); // 圆形指示器也重置
            return;
        }
        
        // 正常计算进度（确保在0-1范围内）
        var value = audio.currentTime / audio.duration;
        value = Math.max(0, Math.min(1, value));
        var widthPercent = value * 100;
        progress.style.width = widthPercent + '%';
        progress.style.setProperty('--progress-width', widthPercent + '%');
        playedTime.innerText = transTime(audio.currentTime);
        
        // 更新圆形指示器位置
        updateProgressIndicator(widthPercent);
        
        // 确保总时长显示正确
        if (audioTime.textContent === '00:00' || audioTime.textContent === 'NaN:NaN') {
            audioTime.textContent = transTime(audio.duration);
        }
    }
    
    // 更新圆形指示器位置
    function updateProgressIndicator(percent) {
        if (progressIndicator) {
            progressIndicator.style.left = percent + '%';
            
            // 播放时确保指示器可见
            if (percent > 0 && !audio.paused) {
                progressIndicator.style.opacity = '1';
                progressIndicator.style.transform = 'translate(-50%, -50%) scale(1)';
                if (progressTotal) {
                    progressTotal.classList.add('playing');
                }
            }
        }
    }
    
    // 音频播放时间换算
    function transTime(value) {
        var time = "";
        var h = parseInt(value / 3600);
        value %= 3600;
        var m = parseInt(value / 60);
        var s = parseInt(value % 60);
        if (h > 0) {
            time = formatTime(h + ":" + m + ":" + s);
        } else {
            time = formatTime(m + ":" + s);
        }
        return time;
    }
    
    // 格式化时间显示，补零对齐
    function formatTime(value) {
        var time = "";
        var s = value.split(':');
        var i = 0;
        for (; i < s.length - 1; i++) {
            time += s[i].length == 1 ? ("0" + s[i]) : s[i];
            time += ":";
        }
        time += s[i].length == 1 ? ("0" + s[i]) : s[i];
        return time;
    }
    
    // ==================== 5. 进度条拖动功能 ====================
    if (progressTotal) {
        progressTotal.addEventListener('mousedown', function (event) {
            // 只有音乐开始播放后才可以调节
            if (!audio.paused || audio.currentTime != 0) {
                // 1. 添加拖动状态类到进度条
                if (pgsPlay) {
                    pgsPlay.classList.add('dragging');
                }
                progressTotal.classList.add('dragging');
                
                // 标记正在拖动，暂停timeupdate的自动更新
                var isDragging = true;
                
                // 临时禁用timeupdate事件
                function tempUpdateProgress() {
                    // 只有在非拖动状态时才更新
                    if (!isDragging) {
                        updateProgress();
                    }
                }
                
                // 移除原来的timeupdate监听器，添加临时的
                audio.removeEventListener('timeupdate', updateProgress);
                audio.addEventListener('timeupdate', tempUpdateProgress);
                
                // 2. 创建时间预览悬浮元素
                var preview = document.createElement('div');
                preview.id = 'timePreview';
                preview.style.cssText = `
                    position: fixed;
                    background: rgba(0, 0, 0, 0.85);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 13px;
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    z-index: 10000;
                    pointer-events: none;
                    transform: translate(-50%, -35px);
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1);
                    opacity: 0;
                    transition: opacity 0.15s ease;
                `;
                document.body.appendChild(preview);
                
                var pgsWidth = parseFloat(window.getComputedStyle(progressTotal, null).width.replace('px', ''));
                
                // 3. 更新预览时间和位置
                function updatePreview(e) {
                    var rect = progressTotal.getBoundingClientRect();
                    var offsetX = Math.max(0, Math.min(e.clientX - rect.left, pgsWidth));
                    var rate = offsetX / pgsWidth;
                    var previewTime = audio.duration * rate;
                    
                    // 更新预览显示
                    preview.textContent = transTime(previewTime);
                    preview.style.left = (rect.left + offsetX) + 'px';
                    preview.style.top = (rect.top - 15) + 'px';
                    preview.style.opacity = '1';
                    
                    // 实时更新进度条和指示器
                    progress.style.width = (rate * 100) + '%';
                    progress.style.setProperty('--progress-width', (rate * 100) + '%');
                    updateProgressIndicator(rate * 100);
                }
                
                // 4. 鼠标移动时的处理
                function handleDrag(e) {
                    updatePreview(e);
                }
                
                // 5. 鼠标释放时的处理
                function handleDragEnd(e) {
                    isDragging = false;
                    
                    var rect = progressTotal.getBoundingClientRect();
                    var offsetX = Math.max(0, Math.min(e.clientX - rect.left, pgsWidth));
                    var rate = offsetX / pgsWidth;
                    
                    // 跳转到指定时间
                    audio.currentTime = audio.duration * rate;
                    
                    // 恢复原来的timeupdate事件监听
                    audio.removeEventListener('timeupdate', tempUpdateProgress);
                    audio.addEventListener('timeupdate', updateProgress);
                    
                    // 立即更新一次进度条
                    updateProgress();
                    
                    // 移除拖动状态类
                    if (pgsPlay) {
                        pgsPlay.classList.remove('dragging');
                    }
                    progressTotal.classList.remove('dragging');
                    
                    // 淡出并移除预览元素
                    preview.style.opacity = '0';
                    setTimeout(function() {
                        if (preview.parentNode) {
                            preview.parentNode.removeChild(preview);
                        }
                    }, 150);
                    
                    // 移除事件监听
                    document.removeEventListener('mousemove', handleDrag);
                    document.removeEventListener('mouseup', handleDragEnd);
                    document.removeEventListener('mouseleave', handleDragEnd);
                }
                
                // 6. 初始显示预览
                updatePreview(event);
                
                // 7. 添加事件监听
                document.addEventListener('mousemove', handleDrag);
                document.addEventListener('mouseup', handleDragEnd);
                document.addEventListener('mouseleave', handleDragEnd);
            }
        });
    }
    
    // ==================== 6. 播放列表功能 ====================
    if (list) {
        list.addEventListener('click', function (event) {
            musicList.classList.remove("list-card-hide");
            musicList.classList.add("list-card-show");
            musicList.style.display = "flex";
            closeList.style.display = "flex";
            closeList.addEventListener('click', closeListBoard);
        });
    }
    
    function closeListBoard() {
        musicList.classList.remove("list-card-show");
        musicList.classList.add("list-card-hide");
        closeList.style.display = "none";
    }
    
    // ==================== 7. 音乐管理功能 ====================
    
    function initMusic() {
        // 将音乐ID+1来匹配文件名
        audio.src = "mp3/music" + (musicId + 1).toString() + ".mp3";
        audio.load();
        recordImg.classList.remove('rotate-play');
        
        // 重置UI状态
        progress.style.width = '0%';
        progress.style.setProperty('--progress-width', '0%');
        playedTime.innerText = '00:00';
        audioTime.textContent = '00:00';
        updateProgressIndicator(0); // 重置圆形指示器
        
        // 确保timeupdate事件监听正确
        audio.removeEventListener('timeupdate', updateProgress);
        audio.addEventListener('timeupdate', updateProgress);
        
        audio.ondurationchange = function () {
            // musicData[musicId][0]是歌名，[1]是歌手
            musicTitle.innerText = musicData[musicId][0];
            author.innerText = musicData[musicId][1];
            
            // 图片ID+1来匹配文件名
            recordImg.style.backgroundImage = "url('img/record" + (musicId + 1).toString() + ".jpg')";
            body.style.backgroundImage = "url('img/bg" + (musicId + 1).toString() + ".jpg')";
            
            if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
                audioTime.innerText = transTime(audio.duration);
            }
            
            audio.currentTime = 0;
            updateProgress();
            refreshRotate();
        };
    }
    
    // 初始化并播放
    function initAndPlay() {
        initMusic();
        if (pause) {
            pause.classList.remove('icon-play');
            pause.classList.add('icon-pause');
        }
        
        // 尝试播放前就添加播放状态类（因为即将播放）
        if (pgsPlay) {
            pgsPlay.classList.add('playing');
        }
        if (progressTotal) {
            progressTotal.classList.add('playing');
        }
        
        // 确保事件监听正确
        audio.removeEventListener('timeupdate', updateProgress);
        audio.addEventListener('timeupdate', updateProgress);
        
        // 尝试播放，捕获可能的错误
        var playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(function(error) {
                console.log('自动播放可能需要用户交互');
                if (pause) {
                    pause.classList.remove('icon-pause');
                    pause.classList.add('icon-play');
                }
                // 如果播放失败，移除播放状态类
                if (pgsPlay) {
                    pgsPlay.classList.remove('playing');
                }
                if (progressTotal) {
                    progressTotal.classList.remove('playing');
                }
            });
        }
        
        rotateRecord();
    }
    
    // ==================== 8. 播放模式控制 ====================
    if (mode) {
        mode.addEventListener('click', function (event) {
            modeId = modeId + 1;
            if (modeId > 3) {
                modeId = 1;
            }
            mode.style.backgroundImage = "url('img/mode" + modeId.toString() + ".png')";
        });
    }
    
    audio.onended = function () {
        console.log('当前歌曲播放完毕，播放模式:', modeId, '当前歌曲索引:', musicId);
        
        // 移除播放状态类
        if (pgsPlay) {
            pgsPlay.classList.remove('playing');
        }
        if (progressTotal) {
            progressTotal.classList.remove('playing');
        }
        
        // 根据播放模式处理下一首
        if (modeId == 1) { // 顺序播放
            musicId = (musicId + 1) % 4;
            console.log('顺序播放 -> 下一首索引:', musicId, '歌曲:', musicData[musicId][0]);
        }
        else if (modeId == 2) { // 单曲循环
            console.log('单曲循环 -> 重新播放:', musicData[musicId][0]);
            // 等待一小段时间后重新播放，避免立即播放的问题
            setTimeout(function() {
                audio.currentTime = 0;
                audio.play().catch(function(e) {
                    console.log('重新播放失败:', e);
                });
            }, 100);
            return;
        }
        else if (modeId == 3) { // 随机播放
            var oldId = musicId;
            var newId;
            do {
                newId = Math.floor(Math.random() * 4);
            } while (musicData.length > 1 && newId === oldId);
            musicId = newId;
            console.log('随机播放 -> 下一首索引:', musicId, '歌曲:', musicData[musicId][0]);
        }
        
        // 播放下一首歌
        initAndPlay();
    }
    
    // ==================== 9. 歌曲切换控制 ====================
    if (skipForward) {
        skipForward.addEventListener('click', function (event) {
            musicId = musicId - 1;
            if (musicId < 0) {
                musicId = 3;
            }
            initAndPlay();
        });
    }
    
    if (skipBackward) {
        skipBackward.addEventListener('click', function (event) {
            musicId = musicId + 1;
            if (musicId > 3) {
                musicId = 0;
            }
            initAndPlay();
        });
    }
    
    // ==================== 10. 倍速控制 ====================
    if (speed) {
        speed.addEventListener('click', function (event) {
            var speedText = speed.innerText;
            if (speedText == "1.0X") {
                speed.innerText = "1.5X";
                audio.playbackRate = 1.5;
            }
            else if (speedText == "1.5X") {
                speed.innerText = "2.0X";
                audio.playbackRate = 2.0;
            }
            else if (speedText == "2.0X") {
                speed.innerText = "0.5X";
                audio.playbackRate = 0.5;
            }
            else if (speedText == "0.5X") {
                speed.innerText = "1.0X";
                audio.playbackRate = 1.0;
            }
        });
    }
    
    // ==================== 11. MV功能 ====================
    if (MV) {
        MV.addEventListener('click', function (event) {
            // 存储当前音乐ID
            var fileMusicId = musicId + 1;
            window.sessionStorage.setItem('musicId', fileMusicId);
            
            // 打开新窗口，加载 video.html
            window.open('video.html', 'mvWindow', 'width=900,height=550,top=100,left=100');
        });
    }
    
    // ==================== 12. 播放列表歌曲绑定 ====================
    // ID改为music1-music4
    document.getElementById("music1").addEventListener('click', function (event) {
        musicId = 0;
        initAndPlay();
    });
    document.getElementById("music2").addEventListener('click', function (event) {
        musicId = 1;
        initAndPlay();
    });
    document.getElementById("music3").addEventListener('click', function (event) {
        musicId = 2;
        initAndPlay();
    });
    document.getElementById("music4").addEventListener('click', function (event) {
        musicId = 3;
        initAndPlay();
    });
    
    // ==================== 13. 唱片旋转控制 ====================
    function refreshRotate() {
        recordImg.classList.add('rotate-play');
    }
    
    function rotateRecord() {
        recordImg.style.animationPlayState = "running";
    }
    
    function rotateRecordStop() {
        recordImg.style.animationPlayState = "paused";
    }
    
    // ==================== 14. 音量控制 ====================
    audio.addEventListener('timeupdate', updateVolumn);
    function updateVolumn() {
        audio.volume = volumeTogger.value / 70;
    }
    
    if (volume) {
        volume.addEventListener('click', setNoVolumn);
    }
    
    function setNoVolumn() {
        if (volumeTogger.value == 0) {
            if (lastVolumn == 0) {
                lastVolumn = 70;
            }
            volumeTogger.value = lastVolumn;
            volume.style.backgroundImage = "url('img/音量.png')";
        }
        else {
            lastVolumn = volumeTogger.value;
            volumeTogger.value = 0;
            volume.style.backgroundImage = "url('img/静音.png')";
        }
    }
    
    // ==================== 15. 初始化 ====================
    initMusic();
    
    // 结束DOMContentLoaded
});