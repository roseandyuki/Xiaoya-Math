/**
 * 角色选择场景
 * 让玩家选择游戏角色（男性/女性）
 * 使用16x16像素的精灵图动画帧
 */
class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
        this.selectedGender = null; // 当前选择的性别
        this.maleCharacter = null; // 男性角色精灵
        this.femaleCharacter = null; // 女性角色精灵
        this.maleHighlight = null; // 男性角色高亮边框
        this.femaleHighlight = null; // 女性角色高亮边框
        this.confirmButton = null; // 确认按钮
    }

    preload() {
        console.log('CharacterSelectScene: 开始加载角色资源...');

        // 监听加载错误
        this.load.on('loaderror', (file) => {
            console.error('角色资源加载失败:', file.key, file.src);
        });

        // 加载角色精灵图 - 使用spritesheet方法，16x16像素帧
        // person_sprite_sheet.png 对应男角色（4行x3列布局）
        this.load.spritesheet('player_male', 'assets/images/heroes/person_sprite_sheet.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // player_female_sprite.png 对应女角色（横向排列）
        this.load.spritesheet('player_female', 'assets/images/heroes/player_female_sprite.png', {
            frameWidth: 16,
            frameHeight: 16
        });

        // 加载UI素材（复用主菜单的UI）
        this.load.image('panel_button_border', 'assets/images/ui/panel_button_border.png');

        console.log('CharacterSelectScene: 角色资源加载完成');
    }

    create() {
        console.log('CharacterSelectScene: 创建角色选择界面...');

        // 设置黑色背景
        this.cameras.main.setBackgroundColor('#000000');

        // 创建标题
        this.createTitle();

        // 创建角色选择区域
        this.createCharacterSelection();

        // 创建确认按钮
        this.createConfirmButton();

        console.log('CharacterSelectScene: 角色选择界面创建完成');
    }

    // 创建标题
    createTitle() {
        const title = this.add.text(this.cameras.main.width / 2, 100, '选择你的未知数形态', {
            fontSize: '48px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                fill: true
            }
        });
        title.setOrigin(0.5);

        console.log('CharacterSelectScene: 标题创建完成');
    }

    // 创建角色选择区域
    createCharacterSelection() {
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        const characterSpacing = 200; // 角色之间的间距

        // 男性角色位置（左侧）
        const maleX = centerX - characterSpacing;
        const maleY = centerY;

        // 女性角色位置（右侧）
        const femaleX = centerX + characterSpacing;
        const femaleY = centerY;

        // 创建男性角色
        this.createMaleCharacter(maleX, maleY);

        // 创建女性角色
        this.createFemaleCharacter(femaleX, femaleY);

        console.log('CharacterSelectScene: 角色选择区域创建完成');
    }

    // 创建男性角色
    createMaleCharacter(x, y) {
        // 创建男性角色精灵（第7帧 - 正面静止姿势）
        // person_sprite_sheet.png: 4行x3列，第3行（索引2）中间帧（索引1）= 2*3+1=7
        this.maleCharacter = this.add.sprite(x, y, 'player_male', 7);
        this.maleCharacter.setScale(4); // 放大4倍 (16*4=64像素，更清晰)
        this.maleCharacter.setInteractive({ useHandCursor: true });

        // 创建高亮边框（初始隐藏）
        // 边框尺寸应围绕放大后的精灵，即64x64
        this.maleHighlight = this.add.graphics();
        this.maleHighlight.lineStyle(3, 0x00ff00, 1); // 绿色边框
        this.maleHighlight.strokeRect(x - (16 * this.maleCharacter.scaleX) / 2, y - (16 * this.maleCharacter.scaleY) / 2, 16 * this.maleCharacter.scaleX, 16 * this.maleCharacter.scaleY); 
        this.maleHighlight.setVisible(false);

        // 添加标签
        const maleLabel = this.add.text(x, y + 60, '男性', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        maleLabel.setOrigin(0.5);

        // 点击事件
        this.maleCharacter.on('pointerdown', () => {
            this.selectCharacter('male');
        });

        // 悬停效果
        this.maleCharacter.on('pointerover', () => {
            this.maleCharacter.setTint(0xcccccc);
        });

        this.maleCharacter.on('pointerout', () => {
            if (this.selectedGender !== 'male') {
                this.maleCharacter.clearTint();
            }
        });

        console.log('CharacterSelectScene: 男性角色创建完成');
    }

    // 创建女性角色
    createFemaleCharacter(x, y) {
        // 创建女性角色精灵（横向排列，随便取一帧，这里取第0帧）
        // player_female_sprite.png 是横向排列的行走/待机动画序列
        this.femaleCharacter = this.add.sprite(x, y, 'player_female', 0);
        this.femaleCharacter.setScale(4); // 放大4倍 (16*4=64像素，更清晰)
        this.femaleCharacter.setInteractive({ useHandCursor: true });

        // 创建高亮边框（初始隐藏）
        // 边框尺寸应围绕放大后的精灵，即64x64
        this.femaleHighlight = this.add.graphics();
        this.femaleHighlight.lineStyle(3, 0x00ff00, 1); // 绿色边框
        this.femaleHighlight.strokeRect(x - (16 * this.femaleCharacter.scaleX) / 2, y - (16 * this.femaleCharacter.scaleY) / 2, 16 * this.femaleCharacter.scaleX, 16 * this.femaleCharacter.scaleY); 
        this.femaleHighlight.setVisible(false);

        // 添加标签
        const femaleLabel = this.add.text(x, y + 60, '女性', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        femaleLabel.setOrigin(0.5);

        // 点击事件
        this.femaleCharacter.on('pointerdown', () => {
            this.selectCharacter('female');
        });

        // 悬停效果
        this.femaleCharacter.on('pointerover', () => {
            this.femaleCharacter.setTint(0xcccccc);
        });

        this.femaleCharacter.on('pointerout', () => {
            if (this.selectedGender !== 'female') {
                this.femaleCharacter.clearTint();
            }
        });

        console.log('CharacterSelectScene: 女性角色创建完成');
    }

    // 选择角色
    selectCharacter(gender) {
        console.log('CharacterSelectScene: 选择角色 -', gender);

        // 更新选择状态
        this.selectedGender = gender;

        // 重置所有高亮和着色
        this.maleHighlight.setVisible(false);
        this.femaleHighlight.setVisible(false);
        this.maleCharacter.clearTint();
        this.femaleCharacter.clearTint();

        // 显示选中角色的高亮和着色
        if (gender === 'male') {
            this.maleHighlight.setVisible(true);
            this.maleCharacter.setTint(0xaaffaa); // 淡绿色着色
        } else if (gender === 'female') {
            this.femaleHighlight.setVisible(true);
            this.femaleCharacter.setTint(0xaaffaa); // 淡绿色着色
        }

        // 启用确认按钮
        if (this.confirmButton) {
            this.confirmButton.setAlpha(1);
            this.confirmButton.setInteractive({ useHandCursor: true });
        }

        // 存储到游戏数据
        this.game.playerData.gender = gender;
    }

    // 创建确认按钮
    createConfirmButton() {
        const buttonX = this.cameras.main.width / 2;
        const buttonY = this.cameras.main.height - 120;

        // 使用UI素材创建按钮背景
        if (this.textures.exists('panel_button_border')) {
            this.confirmButton = this.add.image(buttonX, buttonY, 'panel_button_border');
            this.confirmButton.setDisplaySize(250, 70);
        } else {
            // 备用按钮
            const graphics = this.add.graphics();
            graphics.fillStyle(0x4a4a4a, 1);
            graphics.fillRoundedRect(buttonX - 125, buttonY - 35, 250, 70, 10);
            graphics.lineStyle(2, 0x666666, 1);
            graphics.strokeRoundedRect(buttonX - 125, buttonY - 35, 250, 70, 10);
            
            this.confirmButton = this.add.rectangle(buttonX, buttonY, 250, 70);
        }

        this.confirmButton.setOrigin(0.5);
        this.confirmButton.setAlpha(0.5); // 初始半透明，表示未激活
        this.confirmButton.removeInteractive(); // 初始不可交互

        // 按钮文字
        const buttonText = this.add.text(buttonX, buttonY, '确认选择', {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        buttonText.setOrigin(0.5);

        // 点击事件（只有选择角色后才能点击）
        this.confirmButton.on('pointerdown', () => {
            if (this.selectedGender) {
                this.handleConfirmSelection();
            }
        });

        console.log('CharacterSelectScene: 确认按钮创建完成');
    }

    // 处理确认选择
    handleConfirmSelection() {
        if (!this.selectedGender) {
            console.warn('CharacterSelectScene: 未选择角色');
            return;
        }

        console.log('CharacterSelectScene: 确认选择角色 -', this.selectedGender);
        console.log('玩家数据:', this.game.playerData);

        // 切换到地牢场景
        this.scene.start('DungeonScene');
    }
}