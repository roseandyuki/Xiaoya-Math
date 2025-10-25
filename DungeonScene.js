/**
 * 地宫探索场景
 * 加载地图JSON文件，实现角色移动和探索功能
 */
class DungeonScene extends Phaser.Scene {
    constructor() {
        super({ key: 'DungeonScene' });
        this.player = null; // 玩家角色
        this.cursors = null; // 方向键
        this.wasdKeys = null; // WASD键
        this.map = null; // 地图
        this.tileset = null; // 瓦片集
        this.layers = {}; // 地图图层
        this.keyboardActive = false; // 键盘是否激活
        this.playerStats = null; // 玩家数值管理系统
        this.dialogueObjects = []; // 对话触发对象
        this.triggeredObjects = new Set(); // 已触发的对象ID
    }

    preload() {
        console.log('DungeonScene: 开始加载地图资源...');

        // 监听加载错误
        this.load.on('loaderror', (file) => {
            console.error('地图资源加载失败:', file.key, file.src);
        });

        // 加载地图JSON文件 - 使用新的重绘地图
        this.load.tilemapTiledJSON('dungeon_map', 'assets/data/new_map..json');

        // 加载瓦片集图片 - 使用新的瓦片集
        this.load.image('tilemap_packed_final', 'assets/data/Default/Tilemap/tilemap_packed_final.png');

        // 加载UI面板图片
        this.load.image('panel_inner_border', 'assets/images/ui/panel_inner_border.png');

        // 加载玩家角色精灵图（根据选择的性别）
        const selectedGender = this.game.playerData.gender || 'male';
        if (selectedGender === 'male') {
            // 男性角色：使用单帧静态图片
            this.load.image('player', 'assets/images/heroes/person_sprite_sheet.png');
        } else {
            // 女性角色：使用精灵表
            this.load.spritesheet('player', 'assets/images/heroes/player_female_sprite.png', {
                frameWidth: 16,
                frameHeight: 16
            });
        }

        console.log('DungeonScene: 地图资源加载完成');
    }

    create() {
        console.log('DungeonScene: 创建地宫场景...');

        // 创建地图
        this.createMap();

        // 创建玩家角色
        this.createPlayer();

        // 设置相机跟随
        this.setupCamera();

        // 初始化玩家数值管理系统（延迟创建UI）
        this.initializePlayerStats();

        // 设置键盘控制
        this.setupControls();

        // 添加调试信息显示
        this.createDebugInfo();

        // 显示开始提示
        this.showStartHint();

        console.log('DungeonScene: 地宫场景创建完成');
    }

    // 创建地图
    createMap() {
        console.log('DungeonScene: 创建地图...');

        try {
            // 创建地图对象
            this.map = this.make.tilemap({ key: 'dungeon_map' });

            if (!this.map) {
                console.error('地图对象创建失败');
                return;
            }

            console.log('地图对象创建成功，尺寸:', this.map.width, 'x', this.map.height);
            console.log('地图瓦片集信息:', this.map.tilesets);

            // 添加瓦片集 - 使用新的瓦片集
            this.tileset = this.map.addTilesetImage('tilemap_packed_final', 'tilemap_packed_final', 16, 16, 0, 0);

            if (!this.tileset) {
                console.error('瓦片集加载失败 - 检查瓦片集名称和图片key是否匹配');
                console.log('可用的瓦片集:', this.map.tilesets.map(ts => ts.name));
                return;
            }

            console.log('瓦片集加载成功:', this.tileset.name);

            // 创建所有地图图层（按绘制顺序）
            // 1. water 图层（底层 - 可通过）
            this.layers.water = this.map.createLayer('water', this.tileset, 0, 0);
            if (!this.layers.water) {
                console.error('water 图层创建失败');
                return;
            }

            // 2. Walls_Collision 图层（碰撞层 - 有 collidable: true 属性）
            this.layers.wallsCollision = this.map.createLayer('Walls_Collision', this.tileset, 0, 0);
            if (!this.layers.wallsCollision) {
                console.error('Walls_Collision 图层创建失败');
                return;
            }

            // 3. ground 图层（地面层 - 可通过）
            this.layers.ground = this.map.createLayer('ground', this.tileset, 0, 0);
            if (!this.layers.ground) {
                console.error('ground 图层创建失败');
                return;
            }

            // 4. object 图层（装饰层 - 可通过）
            this.layers.object = this.map.createLayer('object', this.tileset, 0, 0);
            if (!this.layers.object) {
                console.error('object 图层创建失败');
                return;
            }

            // 设置碰撞检测 - 根据新的图层级别属性
            // 只有 Walls_Collision 图层设置了 collidable: true 属性
            // 其他图层（water, ground, object）都可以自由通过

            // 对 Walls_Collision 图层设置碰撞检测
            // 让所有非空瓦片（瓦片ID > 0）都产生碰撞
            this.layers.wallsCollision.setCollisionByExclusion([0]); // 排除空瓦片(0)，其他都碰撞

            console.log('Walls_Collision 图层碰撞设置完成');

            // 调试：检查碰撞瓦片
            this.checkCollisionTiles();

            console.log('所有图层创建完成：water, Walls_Collision, ground, object');
            console.log('碰撞检测已设置：仅 Walls_Collision 图层启用碰撞检测');
            console.log('图层渲染顺序：water(底) -> Walls_Collision(碰撞) -> ground -> object(顶)');

            // 处理对话触发对象
            this.setupDialogueObjects();

            console.log('DungeonScene: 地图创建完成');
            console.log('地图尺寸:', this.map.widthInPixels, 'x', this.map.heightInPixels);
            console.log('使用嵌入式瓦片集:', this.tileset.name);

        } catch (error) {
            console.error('地图创建失败:', error);
            // 显示错误信息给用户
            this.add.text(400, 300, '地图加载失败\n请检查地图文件', {
                fontSize: '24px',
                fontFamily: 'Microsoft YaHei',
                fill: '#ff0000',
                align: 'center'
            }).setOrigin(0.5);
        }
    }

    // 创建玩家角色
    createPlayer() {
        console.log('DungeonScene: 创建玩家角色...');

        const selectedGender = this.game.playerData.gender || 'male';
        const playerName = this.game.playerData.playerName || '未知数';

        // 玩家初始位置：第12列第5行
        const startX = 12 * 16; // 第12列（列从0开始计算，所以是12*16像素）
        const startY = 5 * 16;  // 第5行（行从0开始计算，所以是5*16像素）
        
        // 创建玩家精灵
        if (selectedGender === 'male') {
            // 男性角色：使用静态图片（不需要指定帧数）
            this.player = this.physics.add.sprite(startX, startY, 'player');
        } else {
            // 女性角色：使用精灵表的第0帧
            this.player = this.physics.add.sprite(startX, startY, 'player', 0);
        }

        // 设置玩家物理属性
        this.player.setScale(2); // 放大2倍
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(12, 12); // 设置碰撞体积（稍小于16x16）

        // 添加玩家与地图的碰撞检测
        // 根据新的图层设计：只与 Walls_Collision 图层发生碰撞
        // water, ground, object 图层都可以自由通过
        this.physics.add.collider(this.player, this.layers.wallsCollision);

        console.log('玩家与 Walls_Collision 图层碰撞检测已设置');

        // 创建玩家动画
        this.createPlayerAnimations(selectedGender);

        console.log(`DungeonScene: ${selectedGender === 'male' ? '男性' : '女性'}玩家角色创建完成`);
        console.log(`玩家昵称: ${playerName}`);
    }

    // 创建玩家动画
    createPlayerAnimations(gender) {
        if (gender === 'male') {
            // 男性角色：使用静态图片，所有动画都使用同一张图
            this.anims.create({
                key: 'walk_up',
                frames: [{ key: 'player' }],
                frameRate: 1,
                repeat: -1
            });

            this.anims.create({
                key: 'walk_left',
                frames: [{ key: 'player' }],
                frameRate: 1,
                repeat: -1
            });

            this.anims.create({
                key: 'walk_down',
                frames: [{ key: 'player' }],
                frameRate: 1,
                repeat: -1
            });

            this.anims.create({
                key: 'walk_right',
                frames: [{ key: 'player' }],
                frameRate: 1,
                repeat: -1
            });

            // 静止帧
            this.anims.create({
                key: 'idle_up',
                frames: [{ key: 'player' }],
                frameRate: 1,
                duration: 1000
            });

            this.anims.create({
                key: 'idle_left',
                frames: [{ key: 'player' }],
                frameRate: 1,
                duration: 1000
            });

            this.anims.create({
                key: 'idle_down',
                frames: [{ key: 'player' }],
                frameRate: 1,
                duration: 1000
            });

            this.anims.create({
                key: 'idle_right',
                frames: [{ key: 'player' }],
                frameRate: 1,
                duration: 1000
            });
        } else {
            // 女性角色动画（横向排列）
            // 简单的左右移动动画
            this.anims.create({
                key: 'walk_left',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'walk_right',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });

            // 上下移动使用相同动画
            this.anims.create({
                key: 'walk_up',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });

            this.anims.create({
                key: 'walk_down',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });

            // 静止帧
            this.anims.create({
                key: 'idle_up',
                frames: [{ key: 'player', frame: 0 }],
                frameRate: 1,
                duration: 1000
            });

            this.anims.create({
                key: 'idle_left',
                frames: [{ key: 'player', frame: 0 }],
                frameRate: 1,
                duration: 1000
            });

            this.anims.create({
                key: 'idle_down',
                frames: [{ key: 'player', frame: 0 }],
                frameRate: 1,
                duration: 1000
            });

            this.anims.create({
                key: 'idle_right',
                frames: [{ key: 'player', frame: 0 }],
                frameRate: 1,
                duration: 1000
            });
        }

        console.log('DungeonScene: 玩家动画创建完成');
    }

    // 设置相机
    setupCamera() {
        // 设置世界边界
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        // 相机跟随玩家（紧密跟随，保持在屏幕中央）
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // 设置相机缩放，实现"只看到一小块区域"的效果
        this.cameras.main.setZoom(2.5); // 放大2.5倍，视野更小更聚焦

        // 移除相机边界限制，让玩家始终在屏幕中央
        // this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

        console.log('DungeonScene: 相机设置完成 - 缩放比例: 2.5x');
    }

    // 创建调试信息显示
    createDebugInfo() {
        // 添加调试文本
        this.debugText = this.add.text(10, 10, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
        this.debugText.setScrollFactor(0); // 固定在屏幕上
        this.debugText.setDepth(2000); // 确保在最上层

        console.log('DungeonScene: 调试信息显示创建完成');
    }

    // 初始化玩家数值管理系统
    initializePlayerStats() {
        console.log('DungeonScene: 初始化玩家数值系统');

        // 创建玩家数值管理实例
        this.playerStats = new PlayerStats(this);

        // 延迟创建UI，确保场景完全加载
        this.time.delayedCall(100, () => {
            this.playerStats.createUI();
            console.log('DungeonScene: 玩家数值UI创建完成');
        });

        // 监听场景恢复事件，重新创建UI
        this.events.on('resume', () => {
            console.log('DungeonScene: 场景恢复，检查UI状态');
            if (this.playerStats) {
                this.time.delayedCall(50, () => {
                    this.playerStats.forceRecreateUI();
                    console.log('DungeonScene: UI重新创建完成');
                });
            }
        });

        console.log('DungeonScene: 玩家数值系统初始化完成');
    }

    // 设置对话触发对象
    setupDialogueObjects() {
        console.log('DungeonScene: 设置对话触发对象');

        // 获取对话对象层
        const dialogueLayer = this.map.getObjectLayer('DialogueKey');
        if (!dialogueLayer) {
            console.error('找不到 DialogueKey 对象层');
            return;
        }

        console.log('找到对话对象层，对象数量:', dialogueLayer.objects.length);

        // 处理每个对话对象
        dialogueLayer.objects.forEach(obj => {
            console.log('处理对话对象:', obj.name, '位置:', obj.x, obj.y);

            // 提取对象属性
            const properties = {};
            if (obj.properties) {
                obj.properties.forEach(prop => {
                    properties[prop.name] = prop.value;
                });
            }

            // 创建触发区域（使用较大的触发范围）
            const triggerZone = this.add.zone(obj.x, obj.y, 32, 32);
            triggerZone.setOrigin(0, 0);

            // 存储对话对象信息
            const dialogueObj = {
                name: obj.name,
                x: obj.x,
                y: obj.y,
                zone: triggerZone,
                properties: properties,
                dialogueKey: properties.dialogueKey,
                quizKey: properties.quizKey,
                id: properties.id,
                hasBeenTriggered: properties.hasBeenTriggered || false
            };

            this.dialogueObjects.push(dialogueObj);

            console.log('对话对象设置完成:', {
                name: dialogueObj.name,
                dialogueKey: dialogueObj.dialogueKey,
                quizKey: dialogueObj.quizKey,
                id: dialogueObj.id
            });
        });

        console.log('DungeonScene: 对话对象设置完成，总数:', this.dialogueObjects.length);
    }

    // 检查对话触发
    checkDialogueTriggers() {
        if (!this.player || !this.dialogueObjects.length) {
            return;
        }

        const playerX = this.player.x;
        const playerY = this.player.y;

        // 检查每个对话对象
        this.dialogueObjects.forEach(obj => {
            // 计算距离
            const distance = Phaser.Math.Distance.Between(playerX, playerY, obj.x + 16, obj.y + 16);

            // 如果玩家靠近且未触发过
            if (distance < 30 && !this.triggeredObjects.has(obj.id)) {
                this.triggerDialogue(obj);
            }
        });
    }

    // 获取附近的对话对象（用于调试显示）
    getNearbyDialogueObject() {
        if (!this.player || !this.dialogueObjects.length) {
            return null;
        }

        const playerX = this.player.x;
        const playerY = this.player.y;

        for (let obj of this.dialogueObjects) {
            const distance = Phaser.Math.Distance.Between(playerX, playerY, obj.x + 16, obj.y + 16);
            if (distance < 30) {
                return obj;
            }
        }

        return null;
    }

    // 触发对话
    triggerDialogue(dialogueObj) {
        console.log('DungeonScene: 触发对话', dialogueObj.name, dialogueObj.dialogueKey);

        // 标记为已触发
        this.triggeredObjects.add(dialogueObj.id);

        // 暂停当前场景
        this.keyboardActive = false;
        this.scene.pause();

        // 启动对话场景
        this.scene.launch('DialogueScene', {
            dialogueKey: dialogueObj.dialogueKey,
            quizKey: dialogueObj.quizKey
        });
    }

    // 检查碰撞瓦片设置
    checkCollisionTiles() {
        if (!this.layers.wallsCollision) {
            console.error('Walls_Collision 图层不存在');
            return;
        }

        let collisionCount = 0;
        let totalTiles = 0;

        // 遍历图层检查碰撞瓦片
        for (let y = 0; y < this.map.height; y++) {
            for (let x = 0; x < this.map.width; x++) {
                const tile = this.layers.wallsCollision.getTileAt(x, y);
                if (tile) {
                    totalTiles++;
                    if (tile.collides) {
                        collisionCount++;
                    }
                }
            }
        }

        console.log(`Walls_Collision 图层统计:`);
        console.log(`- 总瓦片数: ${totalTiles}`);
        console.log(`- 碰撞瓦片数: ${collisionCount}`);
        console.log(`- 碰撞设置: ${collisionCount > 0 ? '✅ 正常' : '❌ 无碰撞瓦片'}`);
    }





    // 创建简单的圆形光照效果
createCircleLighting(centerX, centerY, screenWidth, screenHeight) {
    // 1. 最大化亮度增强层（圆圈内极亮效果）
    this.brightnessMask.fillStyle(0xffffff, 1.0); // 100%白色叠加，最大亮度
    this.brightnessMask.fillCircle(centerX, centerY, this.lightCoreRadius);
    this.brightnessMask.setBlendMode(Phaser.BlendModes.ADD); // 加法混合增强亮度

    // 2. 绘制全屏极黑背景（圆圈外接近全黑）
    this.darknessMask.fillStyle(0x000000, 0.98); // 98%黑色，几乎全黑
    this.darknessMask.fillRect(0, 0, screenWidth, screenHeight);

    // 3. 在玩家位置挖一个透明的圆形洞（圆圈内可见）
    // 这一步是关键，它决定了圆圈内部的“可见”程度。
    // 这里设置为 0 意味着完全透明，让底层画面显示。
    // 如果你希望在“光圈”内部也有一些黑暗效果，可以将其设置为一个很小的非零值，例如 0.05。
    this.darknessMask.fillStyle(0x000000, 0); // 完全透明
    this.darknessMask.fillCircle(centerX, centerY, this.lightCoreRadius);

    this.darknessMask.setBlendMode(Phaser.BlendModes.NORMAL); // 正常混合模式
}

    // 设置控制
    setupControls() {
        // 创建方向键
        this.cursors = this.input.keyboard.createCursorKeys();

        // 创建WASD键
        this.wasdKeys = this.input.keyboard.addKeys('W,S,A,D');

        // ESC返回主菜单
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MainMenuScene');
        });

        // 添加测试按键（用于测试数值变化）
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.playerStats) {
                this.playerStats.decreaseHP(10);
            }
        });

        this.input.keyboard.on('keydown-TWO', () => {
            if (this.playerStats) {
                this.playerStats.increaseHP(10);
            }
        });

        this.input.keyboard.on('keydown-THREE', () => {
            if (this.playerStats) {
                this.playerStats.decreaseSanity(15);
            }
        });

        this.input.keyboard.on('keydown-FOUR', () => {
            if (this.playerStats) {
                this.playerStats.increaseSanity(15);
            }
        });

        // 添加对话测试按键
        this.input.keyboard.on('keydown-T', () => {
            // 测试触发最近的对话对象
            const nearbyObj = this.getNearbyDialogueObject();
            if (nearbyObj && !this.triggeredObjects.has(nearbyObj.id)) {
                this.triggerDialogue(nearbyObj);
            } else if (nearbyObj) {
                console.log('对话对象已触发过:', nearbyObj.name);
            } else {
                console.log('附近没有对话对象');
            }
        });

        // 添加UI重新创建测试按键
        this.input.keyboard.on('keydown-U', () => {
            console.log('手动触发UI重新创建');
            if (this.playerStats) {
                this.playerStats.forceRecreateUI();
            }
        });

        // 添加San值效果测试按键
        this.input.keyboard.on('keydown-FIVE', () => {
            if (this.playerStats) {
                // 设置San值为40%，触发中度效果
                this.playerStats.currentSanity = 40;
                this.playerStats.updateUI();
                console.log('测试：设置San值为40%');
            }
        });

        this.input.keyboard.on('keydown-SIX', () => {
            if (this.playerStats) {
                // 设置San值为15%，触发重度效果
                this.playerStats.currentSanity = 15;
                this.playerStats.updateUI();
                console.log('测试：设置San值为15%');
            }
        });

        this.input.keyboard.on('keydown-SEVEN', () => {
            if (this.playerStats) {
                // 恢复San值为100%
                this.playerStats.currentSanity = 100;
                this.playerStats.updateUI();
                console.log('测试：恢复San值为100%');
            }
        });

        console.log('DungeonScene: 控制设置完成');
        console.log('测试按键: 1-减HP, 2-加HP, 3-减San, 4-加San, T-触发对话');
    }

    // 显示开始提示
    showStartHint() {
        const hintText = this.add.text(this.cameras.main.centerX, 100, '点击屏幕激活键盘控制\n使用WASD或方向键移动', {
            fontSize: '20px',
            fontFamily: 'Microsoft YaHei',
            fill: '#ffffff',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 2
        });
        hintText.setOrigin(0.5);
        hintText.setScrollFactor(0); // 固定在屏幕上，不随相机移动

        // 点击激活键盘控制
        this.input.once('pointerdown', () => {
            this.keyboardActive = true;
            hintText.destroy();
            console.log('DungeonScene: 键盘控制已激活');
        });
    }

    // 更新函数 - 处理玩家移动
    update() {
        if (!this.keyboardActive || !this.player) {
            return;
        }

        // 检查对话触发
        this.checkDialogueTriggers();

        // 更新调试信息
        if (this.debugText) {
            const playerX = Math.round(this.player.x);
            const playerY = Math.round(this.player.y);
            const tileX = Math.floor(playerX / 16);
            const tileY = Math.floor(playerY / 16);

            // 检查当前位置的瓦片
            let currentTileInfo = '无瓦片';
            if (this.layers.wallsCollision) {
                const tile = this.layers.wallsCollision.getTileAt(tileX, tileY);
                if (tile) {
                    currentTileInfo = `ID:${tile.index}, 碰撞:${tile.collides ? '是' : '否'}`;
                }
            }

            // 检查附近的对话对象
            let nearbyDialogue = '无';
            const nearbyObj = this.getNearbyDialogueObject();
            if (nearbyObj) {
                nearbyDialogue = nearbyObj.name;
            }

            this.debugText.setText([
                `玩家位置: (${playerX}, ${playerY})`,
                `瓦片坐标: (${tileX}, ${tileY})`,
                `当前瓦片: ${currentTileInfo}`,
                `附近对话: ${nearbyDialogue}`,
                `碰撞层: Walls_Collision`
            ]);
        }


        // 移动速度
        const speed = 100;
        let isMoving = false;
        let direction = '';

        // 重置速度
        this.player.setVelocity(0);

        // 检查WASD和方向键输入
        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            this.player.setVelocityX(-speed);
            direction = 'left';
            isMoving = true;
        } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            this.player.setVelocityX(speed);
            direction = 'right';
            isMoving = true;
        }

        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
            this.player.setVelocityY(-speed);
            direction = 'up';
            isMoving = true;
        } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
            this.player.setVelocityY(speed);
            direction = 'down';
            isMoving = true;
        }

        // 播放相应的动画
        if (isMoving) {
            this.player.anims.play(`walk_${direction}`, true);
        } else {
            // 停止时播放静止动画
            const currentAnim = this.player.anims.currentAnim;
            if (currentAnim) {
                const currentDirection = currentAnim.key.split('_')[1];
                this.player.anims.play(`idle_${currentDirection}`, true);
            } else {
                this.player.anims.play('idle_down', true);
            }
        }
    }
}
