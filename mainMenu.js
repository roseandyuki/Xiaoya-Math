/**
 * 主菜单场景 - 最终重构版
 * 使用高质量UI素材，实现美观的主菜单界面
 * 重点改进：使用UI图片素材构建输入框的视觉外观
 */
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
        this.playerNameInputDOM = null; // 存储HTML输入框DOM元素
        this.inputBoxVisual = null; // 存储Phaser绘制的输入框视觉背景
        this.uiLoadFailed = false; // 标记UI加载是否失败
    }

    preload() {
        console.log('MainMenuScene: 开始加载UI资源...');

        // 监听加载错误，提供备用方案
        this.load.on('loaderror', (file) => {
            console.error('UI资源加载失败:', file.key, file.src);
            this.uiLoadFailed = true; // 标记加载失败
        });

        // 加载UI资源
        this.load.image('main_menu_bg', 'assets/images/ui/main_menu_bg.png'); // 您的背景图
        this.load.image('panel_button_border', 'assets/images/ui/panel_button_border.png'); // 按钮/面板边框
        this.load.image('panel_inner_border', 'assets/images/ui/panel_inner_border.png'); // 内部装饰/小面板 (可作为输入框背景)
        this.load.image('divider_fade', 'assets/images/ui/divider_fade.png'); // 分隔线

        console.log('MainMenuScene: UI资源加载完成');
    }

    create() {
        console.log('MainMenuScene: 创建完成');
        
        // 初始化玩家数据存储（确保存在）
        if (!this.game.playerData) {
            this.game.playerData = {};
        }

        // 设置背景（优先使用图片，否则纯色）
        this.createBackground();
        
        // 创建游戏标题
        this.createTitle();
        
        // 创建核心UI面板和内容
        this.createMainPanelAndContent();
        
        console.log('MainMenuScene: 主菜单界面创建完成');
    }

    // 创建背景
    createBackground() {
        if (this.uiLoadFailed || !this.textures.exists('main_menu_bg')) {
            // 备用纯色背景
            this.cameras.main.setBackgroundColor('#1a1a2e');
            console.log('MainMenuScene: 使用备用纯色背景。');
        } else {
            // 使用加载的背景图片
            const bg = this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'main_menu_bg');
            // 计算缩放，使背景图片完全覆盖屏幕
            const scaleX = this.cameras.main.width / bg.width;
            const scaleY = this.cameras.main.height / bg.height;
            const scale = Math.max(scaleX, scaleY);
            bg.setScale(scale);
            console.log('MainMenuScene: 使用图片背景。');
        }
    }

    // 创建游戏标题
    createTitle() {
        const title = this.add.text(this.cameras.main.width / 2, 150, '小雅老师的高数屋', {
            fontSize: '56px', // 标题更大
            fontFamily: 'Microsoft YaHei',
            fill: '#E0E0E0', // 暗色系，与UI框的白背景和黑线条更搭
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 3,
                offsetY: 3,
                color: '#000000',
                blur: 5,
                fill: true
            }
        });
        title.setOrigin(0.5);
        console.log('MainMenuScene: 标题创建完成。');

        const titleX = title.x;
        const titleY = title.y;
        const titleWidth = title.width;
        const titleHeight = title.height;

        const dividerScaleX = 0.8;
        const dividerScaleY = 0.8;
        if (!this.uiLoadFailed && this.textures.exists('divider_fade')) {
            // 左上角分隔线（旋转180度）
            const divider1 = this.add.image(
                titleX - (titleWidth / 2) - 50, // 标题左侧边缘再向左偏移50像素
                titleY - (titleHeight / 2) + 10, // 标题顶部边缘再向下偏移10像素 (微调)
                'divider_fade'
            );
            divider1.setScale(dividerScaleX, dividerScaleY);
            divider1.setOrigin(0.5);
            divider1.setAngle(180); // 明确要求旋转180度
            divider1.setAlpha(0.8);

            // 右下角分隔线（不旋转）
            const divider2 = this.add.image(
                titleX + (titleWidth / 2) + 50, // 标题右侧边缘再向右偏移50像素
                titleY + (titleHeight / 2) - 10, // 标题底部边缘再向上偏移10像素 (微调)
                'divider_fade'
            );
            divider2.setScale(dividerScaleX, dividerScaleY);
            divider2.setOrigin(0.5);
            // divider2.setAngle(0); // 默认不旋转，无需明确设置
            divider2.setAlpha(0.8);

        } else {
            // 备用分隔线 (如果图片加载失败)
            const graphics = this.add.graphics();
            graphics.lineStyle(2, 0x3498db, 0.8);
            // 左上
            graphics.lineBetween(titleX - (titleWidth / 2) - 50, titleY - (titleHeight / 2) + 10, titleX - (titleWidth / 2) - 50 + 40, titleY - (titleHeight / 2) + 10);
            // 右下 (备用线无法旋转，只能画一条)
            graphics.lineBetween(titleX + (titleWidth / 2) + 50, titleY + (titleHeight / 2) - 10, titleX + (titleWidth / 2) + 50 - 40, titleY + (titleHeight / 2) - 10);
        }
    }

    // 创建核心UI面板及其内容 (剧情文字、输入框、按钮)
    createMainPanelAndContent() {
        // 使用 panel_button_border 作为主面板的背景
        const panelWidth = 600;
        const panelHeight = 400;
        const panelX = this.cameras.main.width / 2;
        const panelY = this.cameras.main.height / 2 + 50; // 适当向下偏移，给标题留空间

        // 创建面板（这里简单地拉伸图片作为面板背景）
        if (!this.uiLoadFailed && this.textures.exists('panel_button_border')) {
            const panel = this.add.image(panelX, panelY, 'panel_button_border');
            panel.setDisplaySize(panelWidth, panelHeight); // 调整面板尺寸
            panel.setOrigin(0.5);            
        } else {
            // 备用面板
            const graphics = this.add.graphics();
            graphics.fillStyle(0x2c3e50, 0.9);
            graphics.fillRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20);
            graphics.lineStyle(3, 0x3498db, 1);
            graphics.strokeRoundedRect(panelX - panelWidth/2, panelY - panelHeight/2, panelWidth, panelHeight, 20);
        }

        // 剧情文字
        const storyText = this.add.text(panelX, panelY - 80, // 调整位置在面板上方
            '你，是否愿意成为\n那个唯一的未知数，\n解开这世界的悖论，\n修复我破碎的高数屋？', {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            fill: '#000000ff', // 暗色系
            align: 'center',
            lineSpacing: 8,
            stroke: '#000000',
            strokeThickness: 1
        });
        storyText.setOrigin(0.5);

        // 输入框提示
        const inputLabel = this.add.text(panelX, panelY + 20, '输入你的未知数名称', {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            fill: '#000000ff',
            stroke: '#000000',
            strokeThickness: 1
        });
        inputLabel.setOrigin(0.5);

        // 创建输入框的视觉背景和HTML DOM输入框
        this.createNameInput(panelX, panelY + 70); // 传递面板中心X和输入框Y

        // 接受使命按钮
        this.createAcceptButton(panelX, panelY + 140); // 传递面板中心X和按钮Y

        console.log('MainMenuScene: 核心UI面板和内容创建完成。');
    }

    // 创建输入框的视觉背景和HTML DOM输入框
    createNameInput(x, y) {
        const inputWidth = 260; // 输入框宽度
        const inputHeight = 48; // 输入框高度

        // 1. Phaser 绘制的输入框视觉背景 (使用 panel_inner_border.png)
        if (!this.uiLoadFailed && this.textures.exists('panel_inner_border')) {
            this.inputBoxVisual = this.add.image(x, y, 'panel_inner_border');
            this.inputBoxVisual.setDisplaySize(inputWidth, inputHeight); // 调整尺寸
            this.inputBoxVisual.setOrigin(0.5);
            this.inputBoxVisual.setAlpha(0.9); // 略微透明
        } else {
            // 备用输入框背景
            const graphics = this.add.graphics();
            graphics.fillStyle(0x34495e, 0.9);
            graphics.fillRoundedRect(x - inputWidth/2, y - inputHeight/2, inputWidth, inputHeight, 8);
            graphics.lineStyle(2, 0x3498db, 1);
            graphics.strokeRoundedRect(x - inputWidth/2, y - inputHeight/2, inputWidth, inputHeight, 8);
        }

        // 2. 创建HTML输入框元素，并使其透明，覆盖在视觉背景上
        this.playerNameInputDOM = document.createElement('input');
        this.playerNameInputDOM.type = 'text';
        this.playerNameInputDOM.placeholder = '请在此输入...';
        this.playerNameInputDOM.maxLength = 15; // 限制长度
        
        // 设置HTML输入框的样式，使其完全透明且无边框，只负责输入功能
        this.playerNameInputDOM.style.position = 'absolute';
        this.playerNameInputDOM.style.width = `${inputWidth - 20}px`; // 略小于视觉背景，留出边框空间
        this.playerNameInputDOM.style.height = `${inputHeight - 10}px`; // 略小于视觉背景
        this.playerNameInputDOM.style.fontSize = '18px';
        this.playerNameInputDOM.style.textAlign = 'center';
        this.playerNameInputDOM.style.fontFamily = 'Microsoft YaHei, Arial, sans-serif';
        this.playerNameInputDOM.style.boxSizing = 'border-box';
        this.playerNameInputDOM.style.border = 'none'; // 无边框
        this.playerNameInputDOM.style.background = 'transparent'; // 完全透明背景
        this.playerNameInputDOM.style.color = '#000000ff'; // 暗色文字
        this.playerNameInputDOM.style.outline = 'none'; // 移除聚焦时的外边框
        this.playerNameInputDOM.style.padding = '0 10px'; // 左右内边距
        this.playerNameInputDOM.style.zIndex = '1001'; // 确保在游戏画布之上

        // 计算HTML元素在屏幕上的绝对位置，使其精确覆盖Phaser绘制的视觉背景
        const canvasBounds = this.sys.game.canvas.getBoundingClientRect();
        this.playerNameInputDOM.style.left = (canvasBounds.left + x - (inputWidth / 2) + 10) + 'px'; // 微调使其居中
        this.playerNameInputDOM.style.top = (canvasBounds.top + y - (inputHeight / 2) + 5) + 'px'; // 微调使其居中

        document.body.appendChild(this.playerNameInputDOM);

        // 自动聚焦
        this.time.delayedCall(100, () => {
            this.playerNameInputDOM.focus();
        });

        console.log('MainMenuScene: 输入框视觉和HTML DOM元素创建完成。');
    }

    // 创建"接受使命"按钮
    createAcceptButton(x, y) {
        // 使用 panel_button_border 作为按钮背景
        let buttonBg;
        
        if (!this.uiLoadFailed && this.textures.exists('panel_button_border')) {
            buttonBg = this.add.image(x, y, 'panel_button_border');
            buttonBg.setDisplaySize(200, 60); // 调整按钮尺寸
            buttonBg.setOrigin(0.5);
            buttonBg.setInteractive({ useHandCursor: true });
            buttonBg.setAlpha(0.9);
        } else {
            // 备用按钮
            const graphics = this.add.graphics();
            graphics.fillStyle(0x3498db, 1);
            graphics.fillRoundedRect(x - 100, y - 30, 200, 60, 10);
            graphics.lineStyle(2, 0x2980b9, 1);
            graphics.strokeRoundedRect(x - 100, y - 30, 200, 60, 10);
            
            // 创建一个透明的交互区域
            buttonBg = this.add.rectangle(x, y, 200, 60);
            buttonBg.setInteractive({ useHandCursor: true });
            buttonBg.setAlpha(0.01); // 几乎透明但可交互
        }

        // 按钮文字
        const buttonText = this.add.text(x, y, '接受使命', {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);

        // 按钮交互效果
        buttonBg.on('pointerover', () => {
            if (!this.uiLoadFailed && this.textures.exists('panel_button_border')) {
                buttonBg.setTint(0x9966ff); // 悬停时变亮紫色
            }
            buttonText.setScale(1.05); // 文字轻微放大
        });

        buttonBg.on('pointerout', () => {
            if (!this.uiLoadFailed && this.textures.exists('panel_button_border')) {
                buttonBg.clearTint();
            }
            buttonText.setScale(1);
        });

        buttonBg.on('pointerdown', () => {
            if (!this.uiLoadFailed && this.textures.exists('panel_button_border')) {
                buttonBg.setTint(0x6633cc); // 按下时更深的紫色
            }
        });

        buttonBg.on('pointerup', () => {
            if (!this.uiLoadFailed && this.textures.exists('panel_button_border')) {
                buttonBg.clearTint();
            }
            this.handleAcceptMission();
        });

        // 支持回车键提交（在输入框聚焦时也能触发）
        this.input.keyboard.on('keydown-ENTER', (event) => {
             // 只有当输入框失去焦点或不在输入框内时才响应回车
             if (document.activeElement !== this.playerNameInputDOM) {
                 this.handleAcceptMission();
             } else {
                 // 如果在输入框内按回车，则模拟失去焦点，触发提交
                 this.playerNameInputDOM.blur();
                 this.handleAcceptMission();
             }
        });
        
        console.log('MainMenuScene: 接受使命按钮创建完成。');
    }

    // 处理接受使命逻辑
    async handleAcceptMission() {
        console.log('MainMenuScene: 处理接受使命...');

        const playerName = this.playerNameInputDOM.value.trim();

        if (playerName === '') {
            this.showMessage('请输入你的真实姓名！');
            return;
        }
        if (playerName.length < 2) { // 增加姓名长度限制
            this.showMessage('姓名至少需要2个字符！');
            return;
        }

        // 显示加载提示
        this.showMessage('正在连接小雅老师的高数屋...', '#ffff00');

        try {
            // 使用简化认证系统
            const authResult = await window.apiManager.simpleAuth(playerName);

            if (authResult.success) {
                // 认证成功，显示欢迎消息
                this.showMessage(authResult.message, '#00ff00');

                // 存储玩家数据到全局游戏对象
                this.game.playerData = {
                    name: playerName,
                    gender: null, // 将在角色选择场景中设置
                    userId: authResult.user.id,
                    experiencePoints: authResult.user.experience_points,
                    highestScore: authResult.user.highest_score,
                    isNewUser: authResult.isNewUser
                };

                console.log('MainMenuScene: 玩家认证成功:', this.game.playerData);

                this.cleanupInput(); // 清理HTML输入框

                // 延迟切换到角色选择场景
                this.time.delayedCall(1500, () => {
                    this.scene.start('CharacterSelectScene');
                });

            } else {
                // 认证失败
                this.showMessage(`认证失败: ${authResult.error}`, '#ff0000');
            }

        } catch (error) {
            console.error('MainMenuScene: 认证过程出错:', error);
            this.showMessage('连接失败，请检查网络或后端服务', '#ff0000');
        }
    }

    // 显示临时提示消息
    showMessage(text, color = '#ff6b6b') {
        const message = this.add.text(this.cameras.main.width / 2, this.cameras.main.height - 100, text, {
            fontSize: '20px', // 稍大一点
            fontFamily: 'Microsoft YaHei',
            fill: color, // 支持自定义颜色
            stroke: '#000000',
            strokeThickness: 2
        });
        message.setOrigin(0.5);

        // 2秒后消失
        this.time.delayedCall(2000, () => {
            message.destroy();
        });
    }

    // 清理HTML输入框
    cleanupInput() {
        if (this.playerNameInputDOM && this.playerNameInputDOM.parentNode) {
            this.playerNameInputDOM.parentNode.removeChild(this.playerNameInputDOM);
            this.playerNameInputDOM = null;
        }
    }

    // 场景销毁时清理HTML输入框
    shutdown() {
        this.cleanupInput();
    }

    destroy() {
        this.cleanupInput();
        super.destroy();
    }
}
