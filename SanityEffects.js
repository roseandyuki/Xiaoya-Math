/**
 * San值视觉效果扩展方法
 * 为PlayerStats类提供额外的视觉效果方法
 */

// 扩展PlayerStats类，添加幻觉和扭曲效果方法
Object.assign(PlayerStats.prototype, {
    
    // 创建幻觉精灵
    createHallucinationSprites(count) {
        for (let i = 0; i < count; i++) {
            // 随机位置
            const x = Phaser.Math.Between(50, this.scene.cameras.main.width - 50);
            const y = Phaser.Math.Between(50, this.scene.cameras.main.height - 50);
            
            // 创建简单的几何形状作为幻觉
            const hallucination = this.scene.add.graphics()
                .setScrollFactor(0)
                .setDepth(4000)
                .setAlpha(0.3);

            // 随机形状和颜色
            const shapes = ['circle', 'triangle', 'rectangle', 'line'];
            const shape = Phaser.Utils.Array.GetRandom(shapes);
            const color = Phaser.Math.Between(0x000000, 0xffffff);
            
            hallucination.fillStyle(color);
            hallucination.lineStyle(2, color);
            
            switch (shape) {
                case 'circle':
                    hallucination.fillCircle(x, y, Phaser.Math.Between(5, 20));
                    break;
                case 'triangle':
                    const size = Phaser.Math.Between(10, 30);
                    hallucination.fillTriangle(x, y - size, x - size, y + size, x + size, y + size);
                    break;
                case 'rectangle':
                    const width = Phaser.Math.Between(10, 40);
                    const height = Phaser.Math.Between(10, 40);
                    hallucination.fillRect(x - width/2, y - height/2, width, height);
                    break;
                case 'line':
                    const endX = x + Phaser.Math.Between(-50, 50);
                    const endY = y + Phaser.Math.Between(-50, 50);
                    hallucination.strokeLineShape(new Phaser.Geom.Line(x, y, endX, endY));
                    break;
            }

            // 添加闪烁动画
            this.scene.tweens.add({
                targets: hallucination,
                alpha: { from: 0.3, to: 0 },
                duration: Phaser.Math.Between(500, 2000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // 添加移动动画
            this.scene.tweens.add({
                targets: hallucination,
                x: x + Phaser.Math.Between(-100, 100),
                y: y + Phaser.Math.Between(-100, 100),
                duration: Phaser.Math.Between(2000, 5000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });

            // 添加旋转动画（对于某些形状）
            if (shape !== 'circle') {
                this.scene.tweens.add({
                    targets: hallucination,
                    rotation: Phaser.Math.PI2,
                    duration: Phaser.Math.Between(3000, 8000),
                    repeat: -1,
                    ease: 'Linear'
                });
            }

            this.sanityEffects.hallucinationSprites.push(hallucination);

            // 设置自动销毁
            this.scene.time.delayedCall(Phaser.Math.Between(3000, 10000), () => {
                if (hallucination && hallucination.destroy) {
                    hallucination.destroy();
                    const index = this.sanityEffects.hallucinationSprites.indexOf(hallucination);
                    if (index > -1) {
                        this.sanityEffects.hallucinationSprites.splice(index, 1);
                    }
                }
            });
        }
    },

    // 创建扭曲覆盖层
    createDistortionOverlay() {
        const graphics = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(4500)
            .setAlpha(0.1);

        // 创建噪点效果
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(0, this.scene.cameras.main.width);
            const y = Phaser.Math.Between(0, this.scene.cameras.main.height);
            const color = Phaser.Math.Between(0x000000, 0xffffff);
            
            graphics.fillStyle(color);
            graphics.fillRect(x, y, Phaser.Math.Between(1, 3), Phaser.Math.Between(1, 3));
        }

        // 添加一些随机线条
        for (let i = 0; i < 20; i++) {
            const x1 = Phaser.Math.Between(0, this.scene.cameras.main.width);
            const y1 = Phaser.Math.Between(0, this.scene.cameras.main.height);
            const x2 = x1 + Phaser.Math.Between(-100, 100);
            const y2 = y1 + Phaser.Math.Between(-100, 100);
            const color = Phaser.Math.Between(0x000000, 0xffffff);
            
            graphics.lineStyle(1, color);
            graphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y2));
        }

        this.sanityEffects.distortionOverlay = graphics;

        // 添加闪烁动画
        this.scene.tweens.add({
            targets: graphics,
            alpha: { from: 0.1, to: 0.3 },
            duration: 200,
            yoyo: true,
            repeat: -1,
            ease: 'Power2'
        });

        // 添加位置微调动画
        this.scene.tweens.add({
            targets: graphics,
            x: { from: 0, to: 2 },
            y: { from: 0, to: 2 },
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Power1'
        });
    },

    // 创建文字幻觉
    createTextHallucinations() {
        const hallucinationTexts = [
            "∞", "∅", "∇", "∂", "∫", "∑", "∏", "√", "∆", "Ω",
            "错误", "无解", "发散", "奇点", "悖论", "混沌",
            "ERROR", "NULL", "VOID", "CHAOS", "∞/0"
        ];

        for (let i = 0; i < 3; i++) {
            const x = Phaser.Math.Between(100, this.scene.cameras.main.width - 100);
            const y = Phaser.Math.Between(100, this.scene.cameras.main.height - 100);
            const text = Phaser.Utils.Array.GetRandom(hallucinationTexts);
            
            const hallucinationText = this.scene.add.text(x, y, text, {
                fontSize: Phaser.Math.Between(16, 48) + 'px',
                fontFamily: 'Microsoft YaHei',
                fill: '#' + Phaser.Math.Between(0x000000, 0xffffff).toString(16).padStart(6, '0'),
                stroke: '#000000',
                strokeThickness: 1
            })
            .setScrollFactor(0)
            .setDepth(4200)
            .setAlpha(0.4)
            .setOrigin(0.5);

            // 添加闪烁动画
            this.scene.tweens.add({
                targets: hallucinationText,
                alpha: { from: 0.4, to: 0 },
                duration: Phaser.Math.Between(300, 1000),
                yoyo: true,
                repeat: -1,
                ease: 'Power2'
            });

            // 添加漂浮动画
            this.scene.tweens.add({
                targets: hallucinationText,
                y: y + Phaser.Math.Between(-50, 50),
                duration: Phaser.Math.Between(2000, 4000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // 添加旋转动画
            this.scene.tweens.add({
                targets: hallucinationText,
                rotation: Phaser.Math.Between(-0.5, 0.5),
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Power1'
            });

            this.sanityEffects.hallucinationSprites.push(hallucinationText);

            // 设置自动销毁
            this.scene.time.delayedCall(Phaser.Math.Between(2000, 8000), () => {
                if (hallucinationText && hallucinationText.destroy) {
                    hallucinationText.destroy();
                    const index = this.sanityEffects.hallucinationSprites.indexOf(hallucinationText);
                    if (index > -1) {
                        this.sanityEffects.hallucinationSprites.splice(index, 1);
                    }
                }
            });
        }
    },

    // 创建边缘扭曲效果
    createEdgeDistortion() {
        const edgeGraphics = this.scene.add.graphics()
            .setScrollFactor(0)
            .setDepth(4100)
            .setAlpha(0.2);

        // 创建边缘扭曲线条
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        edgeGraphics.lineStyle(3, 0xff0000);
        
        // 顶部边缘
        for (let x = 0; x < width; x += 20) {
            const y = Phaser.Math.Between(0, 10);
            edgeGraphics.lineTo(x, y);
        }

        // 底部边缘
        edgeGraphics.moveTo(0, height);
        for (let x = 0; x < width; x += 20) {
            const y = height - Phaser.Math.Between(0, 10);
            edgeGraphics.lineTo(x, y);
        }

        // 左边缘
        edgeGraphics.moveTo(0, 0);
        for (let y = 0; y < height; y += 20) {
            const x = Phaser.Math.Between(0, 10);
            edgeGraphics.lineTo(x, y);
        }

        // 右边缘
        edgeGraphics.moveTo(width, 0);
        for (let y = 0; y < height; y += 20) {
            const x = width - Phaser.Math.Between(0, 10);
            edgeGraphics.lineTo(x, y);
        }

        this.sanityEffects.hallucinationSprites.push(edgeGraphics);

        // 添加波动动画
        this.scene.tweens.add({
            targets: edgeGraphics,
            alpha: { from: 0.2, to: 0.5 },
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 设置自动销毁
        this.scene.time.delayedCall(5000, () => {
            if (edgeGraphics && edgeGraphics.destroy) {
                edgeGraphics.destroy();
                const index = this.sanityEffects.hallucinationSprites.indexOf(edgeGraphics);
                if (index > -1) {
                    this.sanityEffects.hallucinationSprites.splice(index, 1);
                }
            }
        });
    }
});

console.log('SanityEffects: San值视觉效果扩展加载完成');
