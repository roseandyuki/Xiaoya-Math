/**
 * 答题场景 - 可复用的数学题目答题界面
 * 支持LaTeX渲染和后端题目获取
 * 与San值/HP系统深度集成
 */

class QuizScene extends Phaser.Scene {
    constructor() {
        super('QuizScene');
        
        // 答题状态
        this.currentQuestion = null;
        this.selectedAnswer = -1;
        this.isAnswering = true;
        this.quizConfig = null;
        
        // UI元素
        this.questionPanel = null;
        this.questionText = null;
        this.optionButtons = [];
        this.submitButton = null;
        this.loadingText = null;
        
        // LaTeX渲染相关
        this.mathJaxLoaded = false;
        this.latexDomElement = null;
        
        console.log('QuizScene: 答题场景初始化');
    }

    // 初始化答题配置
    init(data) {
        this.quizConfig = {
            difficulty: data.difficulty || 3,
            category: data.category || 'CALCULUS',
            quizKey: data.quizKey || 'default_quiz',
            source: data.source || 'dialogue' // 来源：dialogue, boss, etc.
        };
        
        console.log('QuizScene: 答题配置', this.quizConfig);
    }

    preload() {
        // 加载UI资源
        this.load.image('quiz_panel', 'assets/images/ui/panel_inner_border.png');
        this.load.image('option_button', 'assets/images/ui/panel_button_border.png');
        
        console.log('QuizScene: 资源加载完成');
    }

    create() {
        console.log('QuizScene: 创建答题界面');

        // 创建半透明背景
        this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000, 0.7)
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // 创建主面板
        this.createMainPanel();
        
        // 显示加载提示
        this.showLoading();
        
        // 加载题目
        this.loadQuestion();
        
        // 初始化MathJax（如果需要）
        this.initMathJax();
    }

    // 创建主面板
    createMainPanel() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // 主面板
        this.questionPanel = this.add.image(centerX, centerY - 50, 'quiz_panel')
            .setDisplaySize(700, 500)
            .setScrollFactor(0)
            .setDepth(100);

        console.log('QuizScene: 主面板创建完成');
    }

    // 显示加载提示
    showLoading() {
        this.loadingText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, 
            '正在从小雅老师的题库中获取题目...', {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200);

        // 添加加载动画
        this.tweens.add({
            targets: this.loadingText,
            alpha: 0.3,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    // 加载题目
    async loadQuestion() {
        try {
            console.log('QuizScene: 开始加载题目', this.quizConfig);

            // 检查认证状态
            if (!window.apiManager.isAuthenticated()) {
                console.error('QuizScene: 用户未认证');
                this.showError('用户未认证，请重新登录');
                return;
            }

            // 测试题目访问权限
            console.log('QuizScene: 测试题目访问权限');
            const testResult = await window.apiManager.testQuestionAccess();
            if (!testResult) {
                console.error('QuizScene: 题目访问权限测试失败');
                this.showError('无法访问题库，请检查权限');
                return;
            }

            // 从后端获取题目
            const question = await window.apiManager.getRandomQuestion({
                difficulty: this.quizConfig.difficulty,
                category: this.quizConfig.category
            });

            this.currentQuestion = question;
            console.log('QuizScene: 题目加载成功', question);

            // 隐藏加载提示
            if (this.loadingText) {
                this.loadingText.destroy();
                this.loadingText = null;
            }

            // 显示题目
            await this.displayQuestion();

        } catch (error) {
            console.error('QuizScene: 题目加载失败', error);
            this.showError(`题目加载失败: ${error.message}`);
        }
    }

    // 显示题目
    async displayQuestion() {
        if (!this.currentQuestion) {
            console.error('QuizScene: 没有题目数据');
            return;
        }

        const centerX = this.cameras.main.centerX;
        const panelY = this.cameras.main.centerY - 50;

        // 题目文本
        const questionText = this.currentQuestion.question_text || '题目加载中...';
        this.questionText = this.add.text(centerX, panelY - 180, questionText, {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            fill: '#000000',
            align: 'center',
            wordWrap: { width: 650 },
            lineSpacing: 6
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200);

        // 如果有LaTeX，尝试渲染
        if (this.currentQuestion.latex_text && this.mathJaxLoaded) {
            await this.renderLatex();
        }

        // 创建选项按钮
        this.createOptionButtons();

        // 创建提交按钮
        this.createSubmitButton();

        console.log('QuizScene: 题目显示完成');
    }

    // 创建选项按钮
    createOptionButtons() {
        const options = this.currentQuestion.options || [];
        const centerX = this.cameras.main.centerX;
        const startY = this.cameras.main.centerY - 80; // 向上移动选项
        const buttonHeight = 50; // 减小按钮高度
        const buttonSpacing = 60; // 减小按钮间距

        this.optionButtons = [];

        options.forEach((option, index) => {
            const buttonY = startY + (index * buttonSpacing);

            // 按钮背景
            const button = this.add.image(centerX, buttonY, 'option_button')
                .setDisplaySize(550, buttonHeight) // 稍微增加宽度
                .setScrollFactor(0)
                .setDepth(150)
                .setInteractive()
                .on('pointerdown', () => this.selectOption(index))
                .on('pointerover', () => button.setTint(0xdddddd))
                .on('pointerout', () => {
                    if (this.selectedAnswer !== index) {
                        button.clearTint();
                    }
                });

            // 选项文本
            const optionText = this.add.text(centerX, buttonY, `${String.fromCharCode(65 + index)}. ${option}`, {
                fontSize: '16px', // 稍微减小字体
                fontFamily: 'Microsoft YaHei',
                fill: '#000000',
                align: 'center',
                wordWrap: { width: 500 }
            })
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(200);

            this.optionButtons.push({
                button: button,
                text: optionText,
                index: index
            });
        });

        console.log('QuizScene: 选项按钮创建完成', options.length);
    }

    // 选择选项
    selectOption(index) {
        console.log('QuizScene: 选择选项', index);

        // 清除之前的选择
        this.optionButtons.forEach(opt => {
            opt.button.clearTint();
        });

        // 高亮当前选择
        if (this.optionButtons[index]) {
            this.optionButtons[index].button.setTint(0x00ff00);
            this.selectedAnswer = index;
        }

        // 启用提交按钮
        if (this.submitButton) {
            this.submitButton.setTint(0xffffff);
            this.submitButton.setInteractive();
        }
    }

    // 创建提交按钮
    createSubmitButton() {
        const centerX = this.cameras.main.centerX;
        const buttonY = this.cameras.main.centerY + 160; // 调整提交按钮位置，避免与选项重叠

        this.submitButton = this.add.image(centerX, buttonY, 'option_button')
            .setDisplaySize(200, 50)
            .setScrollFactor(0)
            .setDepth(150)
            .setTint(0x888888) // 初始为灰色（禁用状态）
            .on('pointerdown', () => this.submitAnswer());

        this.submitText = this.add.text(centerX, buttonY, '提交答案', {
            fontSize: '18px',
            fontFamily: 'Microsoft YaHei',
            fill: '#000000',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200);

        console.log('QuizScene: 提交按钮创建完成');
    }

    // 提交答案
    async submitAnswer() {
        if (this.selectedAnswer === -1 || !this.isAnswering) {
            return;
        }

        console.log('QuizScene: 提交答案', this.selectedAnswer);
        this.isAnswering = false;

        // 禁用所有按钮
        this.optionButtons.forEach(opt => {
            opt.button.disableInteractive();
        });
        this.submitButton.disableInteractive();

        // 检查答案
        const isCorrect = this.selectedAnswer === this.currentQuestion.correct_option_index;
        console.log('QuizScene: 答案正确性', isCorrect);

        // 显示结果
        this.showResult(isCorrect);

        // 应用游戏效果
        this.applyGameEffects(isCorrect);

        // 延迟返回
        this.time.delayedCall(3000, () => {
            this.returnToDungeon();
        });
    }

    // 显示结果
    showResult(isCorrect) {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY + 220; // 移到更下方，避免与按钮重叠

        const resultText = isCorrect ? '🎉 回答正确！' : '❌ 回答错误！';
        const resultColor = isCorrect ? '#00ff00' : '#ff0000';

        // 添加详细的反馈信息
        const correctAnswer = this.currentQuestion.options[this.currentQuestion.correct_option_index];
        const feedbackText = isCorrect ?
            '太棒了！你的数学知识帮助你战胜了概念畸体！' :
            `正确答案是：${String.fromCharCode(65 + this.currentQuestion.correct_option_index)}. ${correctAnswer}`;

        const result = this.add.text(centerX, centerY, resultText, {
            fontSize: '28px',
            fontFamily: 'Microsoft YaHei',
            fill: resultColor,
            stroke: '#000000',
            strokeThickness: 2
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(300);

        // 反馈信息
        const feedback = this.add.text(centerX, centerY + 40, feedbackText, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 1,
            align: 'center',
            wordWrap: { width: 600 }
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(300);

        // 结果动画
        this.tweens.add({
            targets: result,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            ease: 'Power2'
        });

        console.log('QuizScene: 结果显示完成', isCorrect);
    }

    // 应用游戏效果
    applyGameEffects(isCorrect) {
        const dungeonScene = this.scene.get('DungeonScene');
        if (!dungeonScene || !dungeonScene.playerStats) {
            return;
        }

        if (isCorrect) {
            // 答对：恢复HP，稳定San值
            dungeonScene.playerStats.increaseHP(10);
            dungeonScene.playerStats.increaseSanity(5);
            console.log('QuizScene: 答对奖励 - HP+10, San+5');
        } else {
            // 答错：扣除HP和San值
            dungeonScene.playerStats.decreaseHP(15);
            dungeonScene.playerStats.decreaseSanity(10);
            console.log('QuizScene: 答错惩罚 - HP-15, San-10');
        }
    }

    // 显示错误信息
    showError(message) {
        if (this.loadingText) {
            this.loadingText.destroy();
        }

        this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, message, {
            fontSize: '24px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ff0000',
            align: 'center'
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(200);

        // 3秒后返回
        this.time.delayedCall(3000, () => {
            this.returnToDungeon();
        });
    }

    // 初始化MathJax（LaTeX渲染）
    initMathJax() {
        // 检查MathJax是否已加载
        if (window.MathJax && window.MathJax.typesetPromise) {
            this.mathJaxLoaded = true;
            console.log('QuizScene: MathJax已加载');
        } else {
            console.log('QuizScene: 等待MathJax加载...');
            // 等待MathJax加载
            const checkMathJax = () => {
                if (window.MathJax && window.MathJax.typesetPromise) {
                    this.mathJaxLoaded = true;
                    console.log('QuizScene: MathJax加载完成');
                } else {
                    setTimeout(checkMathJax, 100);
                }
            };
            checkMathJax();
        }
    }

    // 渲染LaTeX
    async renderLatex() {
        if (!this.mathJaxLoaded || !this.currentQuestion.latex_text) {
            return;
        }

        try {
            console.log('QuizScene: 开始渲染LaTeX', this.currentQuestion.latex_text);

            // 创建DOM元素来显示LaTeX
            const latexContainer = document.createElement('div');
            latexContainer.innerHTML = `$$${this.currentQuestion.latex_text}$$`;
            latexContainer.style.position = 'absolute';
            latexContainer.style.left = '50%';
            latexContainer.style.top = '30%';
            latexContainer.style.transform = 'translate(-50%, -50%)';
            latexContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
            latexContainer.style.padding = '10px';
            latexContainer.style.borderRadius = '5px';
            latexContainer.style.fontSize = '18px';
            latexContainer.style.zIndex = '1000';

            // 添加到页面
            document.body.appendChild(latexContainer);

            // 使用MathJax渲染
            await window.MathJax.typesetPromise([latexContainer]);

            // 创建Phaser DOM元素
            this.latexDomElement = this.add.dom(
                this.cameras.main.centerX,
                this.cameras.main.centerY - 100,
                latexContainer
            ).setScrollFactor(0).setDepth(250);

            console.log('QuizScene: LaTeX渲染完成');

        } catch (error) {
            console.error('QuizScene: LaTeX渲染失败', error);
        }
    }

    // 返回地宫场景
    returnToDungeon() {
        console.log('QuizScene: 返回地宫场景');

        // 清理LaTeX DOM元素
        if (this.latexDomElement) {
            this.latexDomElement.destroy();
            this.latexDomElement = null;
        }

        // 清理可能残留的DOM元素
        const latexContainers = document.querySelectorAll('div[style*="position: absolute"]');
        latexContainers.forEach(container => {
            if (container.innerHTML.includes('$$')) {
                container.remove();
            }
        });

        // 恢复地宫场景
        this.scene.resume('DungeonScene');

        // 恢复键盘控制
        const dungeonScene = this.scene.get('DungeonScene');
        if (dungeonScene) {
            dungeonScene.keyboardActive = true;
        }

        // 停止答题场景
        this.scene.stop();
    }
}
