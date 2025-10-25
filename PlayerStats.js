/**
 * 玩家数值管理系统
 * 管理HP值和San值（逻辑锚定度/认知稳定性）
 */

class PlayerStats {
    constructor(scene) {
        this.scene = scene;
        
        // 数值常量
        this.MAX_HP = 100;
        this.MAX_SANITY = 100;
        
        // 当前数值
        this.currentHP = this.MAX_HP;
        this.currentSanity = this.MAX_SANITY;
        
        // UI元素
        this.hpPanel = null;
        this.sanityPanel = null;
        this.hpText = null;
        this.sanityText = null;

        // San值视觉效果相关
        this.sanityEffects = {
            screenShake: null,
            colorTint: null,
            distortionOverlay: null,
            hallucinationSprites: [],
            currentEffectLevel: 'normal',
            shakeTimer: null,
            flickerTimer: null
        };

        console.log('PlayerStats: 玩家数值系统初始化完成');
        console.log(`初始HP: ${this.currentHP}/${this.MAX_HP}`);
        console.log(`初始San值: ${this.currentSanity}/${this.MAX_SANITY}`);
    }
    
    // 创建UI显示
    createUI() {
        console.log('PlayerStats: 创建数值UI显示');

        // 检查图片资源是否加载
        if (!this.scene.textures.exists('panel_inner_border')) {
            console.error('PlayerStats: panel_inner_border 图片未加载！');
            return;
        }

        console.log('PlayerStats: 开始创建UI元素');

        // HP面板 (左上角)
        this.hpPanel = this.scene.add.image(20 + 60, 20 + 15, 'panel_inner_border');
        this.hpPanel.setOrigin(0.5, 0.5);
        this.hpPanel.setDisplaySize(120, 30);
        this.hpPanel.setScrollFactor(0); // 固定在屏幕上
        this.hpPanel.setDepth(5000); // 大幅提高深度值

        console.log('PlayerStats: HP面板创建完成', {
            x: this.hpPanel.x,
            y: this.hpPanel.y,
            depth: this.hpPanel.depth,
            visible: this.hpPanel.visible
        });

        // HP文本
        this.hpText = this.scene.add.text(20 + 60, 20 + 15, `HP: ${this.currentHP}`, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff', // 白色字体
            stroke: '#000000',
            strokeThickness: 2
        });
        this.hpText.setOrigin(0.5, 0.5);
        this.hpText.setScrollFactor(0); // 固定在屏幕上
        this.hpText.setDepth(5001); // 在面板之上

        console.log('PlayerStats: HP文本创建完成', {
            x: this.hpText.x,
            y: this.hpText.y,
            depth: this.hpText.depth,
            visible: this.hpText.visible,
            text: this.hpText.text
        });
        
        // San值面板 (HP面板下方)
        this.sanityPanel = this.scene.add.image(20 + 60, 20 + 15 + 40, 'panel_inner_border');
        this.sanityPanel.setOrigin(0.5, 0.5);
        this.sanityPanel.setDisplaySize(120, 30);
        this.sanityPanel.setScrollFactor(0); // 固定在屏幕上
        this.sanityPanel.setDepth(5000); // 大幅提高深度值

        console.log('PlayerStats: San面板创建完成', {
            x: this.sanityPanel.x,
            y: this.sanityPanel.y,
            depth: this.sanityPanel.depth,
            visible: this.sanityPanel.visible
        });

        // San值文本
        this.sanityText = this.scene.add.text(20 + 60, 20 + 15 + 40, `San: ${this.currentSanity}`, {
            fontSize: '16px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ff0000', // 红色字体
            stroke: '#000000',
            strokeThickness: 2
        });
        this.sanityText.setOrigin(0.5, 0.5);
        this.sanityText.setScrollFactor(0); // 固定在屏幕上
        this.sanityText.setDepth(5001); // 在面板之上

        console.log('PlayerStats: San文本创建完成', {
            x: this.sanityText.x,
            y: this.sanityText.y,
            depth: this.sanityText.depth,
            visible: this.sanityText.visible,
            text: this.sanityText.text
        });

        console.log('PlayerStats: UI显示创建完成');
        console.log('PlayerStats: HP面板位置:', this.hpPanel.x, this.hpPanel.y);
        console.log('PlayerStats: San面板位置:', this.sanityPanel.x, this.sanityPanel.y);

        // 强制设置为可见
        this.hpPanel.setVisible(true);
        this.hpText.setVisible(true);
        this.sanityPanel.setVisible(true);
        this.sanityText.setVisible(true);

        console.log('PlayerStats: UI可见性设置完成');
    }
    
    // 更新UI显示
    updateUI() {
        // 检查UI是否存在，如果不存在则重新创建
        if (!this.hpText || !this.hpText.scene || this.hpText.scene !== this.scene) {
            console.log('PlayerStats: UI丢失，重新创建');
            this.createUI();
            return;
        }

        if (this.hpText) {
            this.hpText.setText(`HP: ${this.currentHP}`);
        }
        if (this.sanityText) {
            this.sanityText.setText(`San: ${this.currentSanity}`);
        }

        console.log('PlayerStats: UI更新完成', {
            hp: this.currentHP,
            sanity: this.currentSanity
        });

        // 更新San值视觉效果
        this.updateSanityEffects();
    }

    // 强制重新创建UI
    forceRecreateUI() {
        console.log('PlayerStats: 强制重新创建UI');

        // 清理现有UI
        if (this.hpPanel) this.hpPanel.destroy();
        if (this.hpText) this.hpText.destroy();
        if (this.sanityPanel) this.sanityPanel.destroy();
        if (this.sanityText) this.sanityText.destroy();

        // 重新创建
        this.createUI();
    }
    
    // HP值管理方法
    decreaseHP(amount) {
        const oldHP = this.currentHP;
        this.currentHP = Math.max(0, this.currentHP - amount);
        this.updateUI();
        
        console.log(`HP值降低: ${amount}, 当前: ${this.currentHP}/${this.MAX_HP}`);
        
        // 检查是否死亡
        if (this.currentHP <= 0) {
            console.log('玩家HP归零！游戏结束！');
            this.onPlayerDeath();
        }
        
        return this.currentHP;
    }
    
    increaseHP(amount) {
        const oldHP = this.currentHP;
        this.currentHP = Math.min(this.MAX_HP, this.currentHP + amount);
        this.updateUI();
        
        console.log(`HP值增加: ${amount}, 当前: ${this.currentHP}/${this.MAX_HP}`);
        
        return this.currentHP;
    }
    
    // San值管理方法
    decreaseSanity(amount) {
        const oldSanity = this.currentSanity;
        this.currentSanity = Math.max(0, this.currentSanity - amount);
        this.updateUI();
        
        console.log(`San值降低: ${amount}, 当前: ${this.currentSanity}/${this.MAX_SANITY}`);
        
        // 触发San值相关的视觉效果
        this.applySanityEffects();
        
        return this.currentSanity;
    }
    
    increaseSanity(amount) {
        const oldSanity = this.currentSanity;
        this.currentSanity = Math.min(this.MAX_SANITY, this.currentSanity + amount);
        this.updateUI();
        
        console.log(`San值增加: ${amount}, 当前: ${this.currentSanity}/${this.MAX_SANITY}`);
        
        // 更新San值相关的视觉效果
        this.applySanityEffects();
        
        return this.currentSanity;
    }
    
    // 获取San值百分比
    getSanityPercentage() {
        return (this.currentSanity / this.MAX_SANITY) * 100;
    }
    
    // 获取HP百分比
    getHPPercentage() {
        return (this.currentHP / this.MAX_HP) * 100;
    }
    
    // 应用San值相关的视觉效果
    applySanityEffects() {
        const sanityPercentage = this.getSanityPercentage();
        
        if (sanityPercentage <= 25) {
            // 崩溃边缘 (25%-0%)
            console.log('San值状态: 崩溃边缘 - 严重认知障碍');
            this.applySevereDistortion();
        } else if (sanityPercentage <= 50) {
            // 明显危险 (50%-26%)
            console.log('San值状态: 明显危险 - 中度认知干扰');
            this.applyModerateDistortion();
        } else if (sanityPercentage <= 75) {
            // 轻微动摇 (75%-51%)
            console.log('San值状态: 轻微动摇 - 轻度认知影响');
            this.applyMildDistortion();
        } else {
            // 正常状态 (100%-76%)
            console.log('San值状态: 逻辑稳定 - 认知正常');
            this.clearDistortionEffects();
        }
    }
    
    // 轻度扭曲效果 (75%-51%)
    applyMildDistortion() {
        // TODO: 实现轻微的视觉扭曲效果
        // - 屏幕边缘偶尔出现几何扭曲
        // - 轻微的数学符号残影
    }
    
    // 中度扭曲效果 (50%-26%)
    applyModerateDistortion() {
        // TODO: 实现中等强度的视觉扭曲效果
        // - 更频繁的扭曲和色彩失真
        // - 界面干扰项增多
    }
    
    // 重度扭曲效果 (25%-0%)
    applySevereDistortion() {
        // TODO: 实现严重的视觉扭曲效果
        // - 持续的视觉扭曲和幻觉
        // - 界面极度混乱
    }
    
    // 清除扭曲效果（兼容旧方法）
    clearDistortionEffects() {
        // 调用新的清除方法
        this.clearSanityEffects();
    }
    
    // 玩家死亡处理
    onPlayerDeath() {
        // TODO: 实现玩家死亡逻辑
        // - 显示死亡界面
        // - 重置游戏或返回主菜单
        console.log('触发玩家死亡事件');
    }
    
    // 重置所有数值
    reset() {
        this.currentHP = this.MAX_HP;
        this.currentSanity = this.MAX_SANITY;
        this.updateUI();
        this.clearDistortionEffects();
        
        console.log('PlayerStats: 数值已重置');
    }
    
    // 获取当前状态信息
    getStatus() {
        return {
            hp: this.currentHP,
            maxHP: this.MAX_HP,
            sanity: this.currentSanity,
            maxSanity: this.MAX_SANITY,
            hpPercentage: this.getHPPercentage(),
            sanityPercentage: this.getSanityPercentage()
        };
    }

    // 更新San值视觉效果
    updateSanityEffects() {
        const sanityPercentage = (this.currentSanity / this.MAX_SANITY) * 100;
        let newEffectLevel = 'normal';

        // 确定效果等级
        if (sanityPercentage >= 75) {
            newEffectLevel = 'normal';
        } else if (sanityPercentage >= 50) {
            newEffectLevel = 'mild';
        } else if (sanityPercentage >= 25) {
            newEffectLevel = 'moderate';
        } else {
            newEffectLevel = 'severe';
        }

        // 如果效果等级改变，更新视觉效果
        if (newEffectLevel !== this.sanityEffects.currentEffectLevel) {
            console.log(`PlayerStats: San值效果等级变化 ${this.sanityEffects.currentEffectLevel} -> ${newEffectLevel}`);
            this.sanityEffects.currentEffectLevel = newEffectLevel;
            this.applySanityEffects(newEffectLevel);
        }
    }

    // 应用San值视觉效果
    applySanityEffects(effectLevel) {
        // 清除现有效果
        this.clearSanityEffects();

        switch (effectLevel) {
            case 'normal':
                // 正常状态，无特效
                break;

            case 'mild':
                this.applyMildEffects();
                break;

            case 'moderate':
                this.applyModerateEffects();
                break;

            case 'severe':
                this.applySevereEffects();
                break;
        }
    }

    // 清除所有San值视觉效果
    clearSanityEffects() {
        // 停止屏幕抖动
        if (this.sanityEffects.shakeTimer) {
            this.sanityEffects.shakeTimer.destroy();
            this.sanityEffects.shakeTimer = null;
        }

        // 停止闪烁效果
        if (this.sanityEffects.flickerTimer) {
            this.sanityEffects.flickerTimer.destroy();
            this.sanityEffects.flickerTimer = null;
        }

        // 重置相机
        this.scene.cameras.main.setShake(0);
        this.scene.cameras.main.clearTint();

        // 清除幻觉精灵
        this.sanityEffects.hallucinationSprites.forEach(sprite => {
            if (sprite && sprite.destroy) {
                sprite.destroy();
            }
        });
        this.sanityEffects.hallucinationSprites = [];

        // 清除扭曲覆盖层
        if (this.sanityEffects.distortionOverlay) {
            this.sanityEffects.distortionOverlay.destroy();
            this.sanityEffects.distortionOverlay = null;
        }
    }

    // 轻微效果 (50%-74% San值)
    applyMildEffects() {
        console.log('PlayerStats: 应用轻微San值效果');

        // 轻微的色彩偏移
        this.scene.cameras.main.setTint(0xffffff, 0xffffff, 0xffffff, 0xf0f0f0);

        // 偶尔的轻微抖动
        this.sanityEffects.shakeTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(5000, 10000),
            callback: () => {
                this.scene.cameras.main.shake(100, 0.002);
            },
            loop: true
        });
    }

    // 中度效果 (25%-49% San值)
    applyModerateEffects() {
        console.log('PlayerStats: 应用中度San值效果');

        // 色彩扭曲
        this.scene.cameras.main.setTint(0xff9999, 0x99ff99, 0x9999ff, 0xffffff);

        // 定期屏幕抖动
        this.sanityEffects.shakeTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: () => {
                this.scene.cameras.main.shake(200, 0.005);
            },
            loop: true
        });

        // 闪烁效果
        this.sanityEffects.flickerTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            callback: () => {
                this.scene.cameras.main.flash(100, 50, 0, 0);
            },
            loop: true
        });

        // 创建幻觉精灵
        this.createHallucinationSprites(2);
    }

    // 重度效果 (0%-24% San值)
    applySevereEffects() {
        console.log('PlayerStats: 应用重度San值效果');

        // 强烈的色彩反转和扭曲
        this.scene.cameras.main.setTint(0x8800ff, 0xff0088, 0x00ff88, 0xff8800);

        // 频繁的强烈抖动
        this.sanityEffects.shakeTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(500, 2000),
            callback: () => {
                this.scene.cameras.main.shake(400, 0.01);
            },
            loop: true
        });

        // 频繁闪烁
        this.sanityEffects.flickerTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(300, 1000),
            callback: () => {
                const colors = [
                    [255, 0, 0],    // 红色
                    [0, 255, 0],    // 绿色
                    [0, 0, 255],    // 蓝色
                    [255, 255, 0],  // 黄色
                    [255, 0, 255]   // 紫色
                ];
                const color = Phaser.Utils.Array.GetRandom(colors);
                this.scene.cameras.main.flash(150, color[0], color[1], color[2]);
            },
            loop: true
        });

        // 创建更多幻觉精灵
        this.createHallucinationSprites(4);

        // 创建扭曲覆盖层
        this.createDistortionOverlay();

        // 创建文字幻觉（如果方法存在）
        if (this.createTextHallucinations) {
            this.createTextHallucinations();
        }

        // 创建边缘扭曲效果（如果方法存在）
        if (this.createEdgeDistortion) {
            this.createEdgeDistortion();
        }
    }
}
