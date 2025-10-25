/**
 * 对话场景 - 处理游戏中的对话系统
 * 与San值系统深度集成，体现"知识即力量"的核心理念
 */

class DialogueScene extends Phaser.Scene {
    constructor() {
        super('DialogueScene');
        
        // 对话状态
        this.dialogueKey = null;
        this.quizKey = null;
        this.currentDialogue = [];
        this.currentIndex = 0;
        
        // UI元素
        this.dialoguePanel = null;
        this.dialogueText = null;
        this.continueHint = null;
        
        // 对话数据 - 基于地图中的6个触发对象
        this.dialogueData = {
            // 房间1触发 (room1) - 添加答题挑战
            'intro_dialogue_room1': [
                "空气中弥漫着一股冰冷的数学气息。",
                "墙壁上镌刻着古老的函数符号，它们仿佛在低声吟唱着无尽的级数...",
                "你感到一丝不适，仿佛理智的边界在模糊。",
                "（逻辑锚定度 -5，你感到心智受到轻微干扰。）",
                "这个房间似乎被\"概念畸体\"守护着，你需要证明自己才能通过。"
            ],

            // 房间2触发 (room2)
            'intro_dialogue_room2': [
                "这个房间的空间似乎发生了扭曲，非欧几何的法则在这里蔓延。",
                "你尝试理解这些不合逻辑的线条，但头痛欲裂。",
                "（逻辑锚定度 -10，你感到明显的认知失衡。）",
                "深处传来阵阵低吼，似乎有更强大的\"悖论\"在此徘徊。"
            ],

            // 宝箱触发 (treasure_chest)
            'chest_found_dialogue': [
                "你发现了一个古老的宝箱，它被层层复杂的定理锁链缠绕。",
                "箱子上刻着一行字：\"唯有窥见真理之人，方能开启。\"",
                "（你的指尖触碰到锁链，一股强大的信息流涌入，逻辑锚定度降低5点。）"
            ],

            // 钥匙触发 (collectible_key)
            'key_pickup_dialogue': [
                "你找到了一枚由纯粹的\"公理结晶\"铸造的钥匙，它散发着微光。",
                "钥匙上刻着一个圆周率的符号，这似乎是某种精神上的慰藉。",
                "（你的逻辑锚定度恢复了5点，你感到一丝清明。）",
                "或许，这能解开某个被概念锁住的物品..."
            ],

            // 火焰之路触发 (flaming road)
            'on_flaming_road': [
                "你踏上了一条由燃烧的数字符号铺就的道路。",
                "每一次呼吸，都感到有无数的无穷小量在体内膨胀、收缩。",
                "你的思维开始加速，伴随着阵阵眩晕。",
                "（逻辑锚定度持续缓慢降低，你必须尽快通过这里！）"
            ],

            // Boss触发 (boss_trigger)
            'boss_intro_dialogue': [
                "通往深渊的大门打开了，一股难以名状的压迫感扑面而来。",
                "一个由所有被你修正的错误和遗忘的定理所交织出的**巨大具象**，在黑暗中显现。",
                "它的每一次律动，都在扭曲着周围的空间，挑战着你的认知极限！",
                "（逻辑锚定度瞬间崩塌20点，你的视野开始模糊，你必须战胜它！）",
                "这是第一章的\"核心悖论\"，战胜它，你将夺回被吞噬的\"起源之证\"！"
            ]
        };
    }

    // 初始化对话
    init(data) {
        this.dialogueKey = data.dialogueKey || null;
        this.quizKey = data.quizKey || null;
        
        if (this.dialogueKey && this.dialogueData[this.dialogueKey]) {
            this.currentDialogue = this.dialogueData[this.dialogueKey];
            this.currentIndex = 0;
        } else {
            console.error('DialogueScene: 无效的对话键值:', this.dialogueKey);
            this.currentDialogue = ["系统错误：找不到对话内容。"];
            this.currentIndex = 0;
        }

        console.log('DialogueScene: 初始化对话', this.dialogueKey);
    }

    preload() {
        // 加载对话UI资源
        this.load.image('dialogue_panel', 'assets/images/ui/panel_inner_border.png');
    }

    create() {
        console.log('DialogueScene: 创建对话界面');

        // 创建半透明背景
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.5)
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // 创建对话面板
        const panelWidth = this.cameras.main.width - 100;
        const panelHeight = 150;
        const panelX = this.cameras.main.centerX;
        const panelY = this.cameras.main.height - panelHeight/2 - 20;

        this.dialoguePanel = this.add.image(panelX, panelY, 'dialogue_panel')
            .setDisplaySize(panelWidth, panelHeight)
            .setScrollFactor(0);

        // 创建对话文本
        this.dialogueText = this.add.text(panelX, panelY - 10, '', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            align: 'left',
            wordWrap: { width: panelWidth - 40 },
            lineSpacing: 5
        })
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

        // 创建继续提示
        this.continueHint = this.add.text(panelX + panelWidth/2 - 20, panelY + panelHeight/2 - 20, '按空格继续...', {
            fontSize: '14px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffff00',
            align: 'right'
        })
        .setOrigin(1, 1)
        .setScrollFactor(0);

        // 显示第一句对话
        this.showCurrentDialogue();

        // 设置输入监听
        this.input.keyboard.on('keydown-SPACE', this.advanceDialogue, this);
        this.input.keyboard.on('keydown-ENTER', this.advanceDialogue, this);
        this.input.on('pointerdown', this.advanceDialogue, this);

        console.log('DialogueScene: 对话界面创建完成');
    }

    // 显示当前对话
    showCurrentDialogue() {
        if (this.currentIndex < this.currentDialogue.length) {
            const text = this.currentDialogue[this.currentIndex];
            this.dialogueText.setText(text);
            
            // 如果是最后一句，更改提示文本
            if (this.currentIndex === this.currentDialogue.length - 1) {
                this.continueHint.setText('按空格结束对话...');
            }
        }
    }

    // 推进对话
    advanceDialogue() {
        this.currentIndex++;
        
        if (this.currentIndex < this.currentDialogue.length) {
            // 还有更多对话
            this.showCurrentDialogue();
        } else {
            // 对话结束
            this.endDialogue();
        }
    }

    // 结束对话
    endDialogue() {
        console.log('DialogueScene: 对话结束');

        // 移除输入监听
        this.input.keyboard.off('keydown-SPACE', this.advanceDialogue, this);
        this.input.keyboard.off('keydown-ENTER', this.advanceDialogue, this);
        this.input.off('pointerdown', this.advanceDialogue, this);

        // 恢复地宫场景
        this.scene.resume('DungeonScene');

        // 处理San值变化
        this.handleSanityEffects();

        // 检查是否需要启动答题
        let finalQuizKey = this.quizKey;

        // 如果没有quizKey，根据dialogueKey分配默认的quizKey
        if (!finalQuizKey) {
            const defaultQuizKeys = {
                'intro_dialogue_room1': 'math_quiz_easy1',
                'intro_dialogue_room2': 'math_quiz_middle1',
                'chest_found_dialogue': 'math_quiz_middle2',
                'key_pickup_dialogue': 'math_quiz_easy2',
                'boss_encounter_dialogue': 'boss_quiz_final'
            };
            finalQuizKey = defaultQuizKeys[this.dialogueKey];
        }

        if (finalQuizKey) {
            console.log('DialogueScene: 启动答题场景', finalQuizKey);

            // 根据quizKey确定题目难度和类别
            const quizConfig = this.getQuizConfig(finalQuizKey);

            // 启动答题场景
            this.scene.launch('QuizScene', {
                quizKey: finalQuizKey,
                difficulty: quizConfig.difficulty,
                category: quizConfig.category,
                source: 'dialogue'
            });

            // 保持地宫场景暂停状态
            this.scene.pause('DungeonScene');
        } else {
            console.log('DialogueScene: 无答题要求，直接恢复游戏');
            // 恢复地宫场景的键盘控制
            const dungeonScene = this.scene.get('DungeonScene');
            if (dungeonScene) {
                dungeonScene.keyboardActive = true;
            }
        }

        // 停止对话场景
        this.scene.stop();
    }

    // 处理San值效果
    handleSanityEffects() {
        const dungeonScene = this.scene.get('DungeonScene');
        if (!dungeonScene || !dungeonScene.playerStats) {
            return;
        }

        // 根据对话键值应用不同的San值变化
        switch (this.dialogueKey) {
            case 'intro_dialogue_room1':
                dungeonScene.playerStats.decreaseSanity(5);
                this.showMessage(dungeonScene, "你的心智受到轻微干扰。", '#ff6b6b');
                break;
                
            case 'intro_dialogue_room2':
                dungeonScene.playerStats.decreaseSanity(10);
                this.showMessage(dungeonScene, "你感到明显的认知失衡。", '#ff6b6b');
                break;
                
            case 'chest_found_dialogue':
                dungeonScene.playerStats.decreaseSanity(5);
                this.showMessage(dungeonScene, "强大的信息流涌入，心智受到冲击。", '#ff6b6b');
                break;
                
            case 'key_pickup_dialogue':
                dungeonScene.playerStats.increaseSanity(5);
                this.showMessage(dungeonScene, "清明降临，理智得到恢复。", '#00ff00');
                break;
                
            case 'on_flaming_road':
                dungeonScene.playerStats.decreaseSanity(3);
                this.showMessage(dungeonScene, "你踏上了火焰之路，逻辑锚定度开始流失...", '#ff6b6b');
                break;
                
            case 'boss_intro_dialogue':
                dungeonScene.playerStats.decreaseSanity(20);
                this.showMessage(dungeonScene, "你的理智正在崩溃边缘！", '#ff0000');
                break;
        }
    }

    // 显示消息提示
    showMessage(scene, text, color = '#ffffff') {
        const message = scene.add.text(scene.cameras.main.centerX, scene.cameras.main.centerY - 100, text, {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            fill: color,
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2,
            shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(2000);

        // 浮动消失动画
        scene.tweens.add({
            targets: message,
            alpha: 0,
            y: message.y - 50,
            duration: 2500,
            ease: 'Power1',
            onComplete: () => {
                message.destroy();
            }
        });
    }

    // 根据quizKey获取答题配置
    getQuizConfig(quizKey) {
        const quizConfigs = {
            // 简单题目 - 暂时不限制类别，便于测试
            'math_quiz_easy1': { difficulty: 1 },
            'math_quiz_easy2': { difficulty: 2 },

            // 中等题目
            'math_quiz_middle1': { difficulty: 3 },
            'math_quiz_middle2': { difficulty: 3 },

            // 困难题目
            'math_quiz_hard1': { difficulty: 4 },
            'math_quiz_hard2': { difficulty: 4 },

            // Boss题目
            'boss_quiz_final': { difficulty: 5 }
        };

        // 默认配置：不限制类别，便于测试
        return quizConfigs[quizKey] || { difficulty: 2 };
    }
}
