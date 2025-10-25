/**
 * 地宫探索RPG游戏 - 修复版本
 * 基于 Phaser.js 3.x 开发
 * 
 * 游戏流程：IntroScene（开场视频） -> MainMenuScene（主菜单） -> DungeonScene（地宫探索）
 */

// ==================== 开场视频场景 ====================
class IntroScene extends Phaser.Scene {
    constructor() {
        super({ key: 'IntroScene' });
        this.introVideo = null;
        this.skipText = null;
        this.canSkip = false;
        this.videoLoadFailed = false;
    }
    
    preload() {
        // 隐藏加载提示
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }

        console.log('IntroScene preload 完成，将使用HTML5视频播放');
    }
    
    create() {
        console.log('IntroScene 创建完成');
        this.cameras.main.setBackgroundColor('#000000');

        // 显示点击提示，等待用户交互
        this.showClickToStart();
    }
    
    showClickToStart() {
        // 显示点击开始提示
        const startText = this.add.text(512, 384, '点击屏幕播放开场视频', {
            fontSize: '32px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // 添加闪烁效果
        this.tweens.add({
            targets: startText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // 等待用户点击
        this.input.once('pointerdown', () => {
            startText.destroy();
            this.tryPlayVideoSimple();
        });

        // 或者按任意键
        this.input.keyboard.once('keydown', () => {
            startText.destroy();
            this.tryPlayVideoSimple();
        });
    }

tryPlayVideoSimple() {
        console.log('使用HTML5视频播放...');

        try {
            // 创建HTML5视频元素
            this.htmlVideo = document.createElement('video');
            this.htmlVideo.src = 'assets/videos/intro_video.mp4';
            this.htmlVideo.style.position = 'absolute'; // 确保是绝对定位

            // 设置视频样式 - 让视频完全覆盖游戏区域并居中
            this.htmlVideo.style.top = '50%';
            this.htmlVideo.style.left = '50%';
            this.htmlVideo.style.transform = 'translate(-50%, -50%)'; // 居中定位
            this.htmlVideo.style.width = '100%';
            this.htmlVideo.style.height = '100%';
            this.htmlVideo.style.objectFit = 'contain'; // 保持比例，完整显示视频内容
            this.htmlVideo.style.backgroundColor = '#000000'; // 黑色背景填充空白区域
            this.htmlVideo.style.zIndex = '1000';
            this.htmlVideo.muted = true; // 先静音，避免自动播放限制
            this.htmlVideo.autoplay = false; // 不自动播放

            // 监听事件
            this.htmlVideo.addEventListener('ended', () => {
                console.log('HTML5视频播放完成');
                this.cleanupVideo();
                this.switchToMainMenu();
            });

            this.htmlVideo.addEventListener('error', (e) => {
                console.error('HTML5视频播放错误:', e);
                this.cleanupVideo();
                this.showFallbackIntro();
            });

            // 添加双击全屏功能
            this.htmlVideo.addEventListener('dblclick', () => {
                if (this.htmlVideo && this.htmlVideo.requestFullscreen) {
                    this.htmlVideo.requestFullscreen();
                } else if (this.htmlVideo && this.htmlVideo.webkitRequestFullscreen) {
                    this.htmlVideo.webkitRequestFullscreen();
                } else if (this.htmlVideo && this.htmlVideo.msRequestFullscreen) {
                    this.htmlVideo.msRequestFullscreen();
                }
            });

            this.htmlVideo.addEventListener('loadeddata', () => {
                console.log('视频数据加载完成');
            });

            // 添加到页面
            const gameContainer = document.getElementById('game-container');
            if (gameContainer) {
                gameContainer.appendChild(this.htmlVideo);
            } else {
                // 如果没有找到 game-container，则退回至 body，但此时居中可能不准确
                document.body.appendChild(this.htmlVideo);
            }

            // 尝试播放（静音模式）
            this.htmlVideo.play().then(() => {
                console.log('HTML5视频开始播放（静音）');

                // 延迟启用声音（用户已经交互过了）
                setTimeout(() => {
                    this.htmlVideo.muted = false;
                    console.log('视频声音已启用');
                }, 100);

                // 添加跳过提示
                this.time.delayedCall(2000, () => {
                    this.addSkipHint();
                });
            }).catch((error) => {
                console.error('视频播放失败:', error);
                this.cleanupVideo();
                this.showFallbackIntro();
            });

        } catch (error) {
            console.error('创建HTML5视频失败:', error);
            this.showFallbackIntro();
        }
    }
    
    addSkipHint() {
        // 移除跳过提示，让视频自然播放完成
        console.log('视频开始播放，等待播放完成...');
    }
    
    skipVideo() {
        console.log('跳过视频');
        this.cleanupVideo();
        this.switchToMainMenu();
    }

    cleanupVideo() {
        console.log('清理视频资源');

        // 清理HTML视频元素
        if (this.htmlVideo) {
            this.htmlVideo.pause();
            this.htmlVideo.src = '';
            this.htmlVideo.load(); // 重置视频元素

            // 从DOM中移除
            if (this.htmlVideo.parentNode) {
                this.htmlVideo.parentNode.removeChild(this.htmlVideo);
            }

            this.htmlVideo = null;
        }

        // 清理跳过提示文本
        if (this.skipText) {
            this.skipText.destroy();
            this.skipText = null;
        }

        // 重置状态
        this.canSkip = false;
    }
    
    showFallbackIntro() {
        // 显示备用开场画面
        this.add.text(512, 300, '地宫探索RPG\n数学冒险之旅', {
            fontSize: '48px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 20
        }).setOrigin(0.5);
        
        this.add.text(512, 500, '点击继续', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            fill: '#3498db'
        }).setOrigin(0.5);
        
        // 3秒后自动切换
        this.time.delayedCall(3000, () => {
            this.switchToMainMenu();
        });
        
        this.input.once('pointerdown', () => {
            this.switchToMainMenu();
        });
    }
    
    switchToMainMenu() {
        console.log('切换到主菜单');
        this.cleanupVideo();

        // 添加延迟确保视频清理完成
        this.time.delayedCall(100, () => {
            console.log('正在启动MainMenuScene...');
            this.scene.start('MainMenuScene');
        });
    }
}

// MainMenuScene 已移动到 mainMenu.js 文件中
// CharacterSelectScene 已移动到 CharacterSelectScene.js 文件中
// DungeonScene 已移动到 DungeonScene.js 文件中

// ==================== 游戏配置和启动 ====================
const gameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [IntroScene, MainMenuScene, CharacterSelectScene, DungeonScene]
};

// 启动游戏
window.addEventListener('load', () => {
    console.log('启动游戏...');

    // 在运行时添加DialogueScene和QuizScene
    gameConfig.scene.push(DialogueScene);
    gameConfig.scene.push(QuizScene);

    new Phaser.Game(gameConfig);
});
