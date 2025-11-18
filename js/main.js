// 游戏主入口文件

// 等待DOM加载完成和所有脚本初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('神秘大润の冒险启动中...');
    
    // 确保game对象已初始化
    if (window.game) {
        // 初始化游戏
        initGame();
        
        // 尝试加载存档
        loadGameData();
        
        // 设置自动保存
        setupAutoSave();
        
        console.log('游戏初始化完成！');
    } else {
        console.error('游戏初始化失败：无法找到game对象');
        setTimeout(() => {
            console.log('尝试重新初始化游戏...');
            if (window.game) {
                initGame();
                loadGameData();
                setupAutoSave();
                console.log('游戏初始化完成！');
            }
        }, 100);
    }
});

// 初始化游戏
function initGame() {
    // 初始化UI管理器
    uiManager.init(game);
    
    // 显示欢迎信息
    game.addToBattleLog('欢迎来到神秘大润の冒险游戏！');
    
    // 初始化游戏设置
    initGameSettings();
    
    // 添加键盘快捷键
    setupKeyboardShortcuts();
}

// 初始化游戏设置
function initGameSettings() {
    // 从localStorage加载设置，如果没有则使用默认值
    const settings = JSON.parse(localStorage.getItem('gameSettings')) || {
        battleSpeed: 1000,
        soundEnabled: true,
        autoHeal: false
    };
    
    // 应用设置
    game.battleSpeed = settings.battleSpeed;
    
    // 保存设置到localStorage
    localStorage.setItem('gameSettings', JSON.stringify(settings));
}

// 游戏主循环 - 已移除自动战斗功能
function startGameLoop() {
    // 不再需要游戏循环
    console.log('自动战斗功能已移除');
}

// 更新游戏状态 - 简化版，移除自动战斗相关功能
function updateGame(deltaTime) {
    // 更新UI按钮状态
    uiManager.updateButtonStates();
    
    // 更新其他游戏元素
    updateVisualEffects(deltaTime);
}

// 更新视觉效果
function updateVisualEffects(deltaTime) {
    // 这里可以添加各种动画效果的更新逻辑
}

// 加载游戏数据
function loadGameData() {
    // 尝试加载角色数据
    if (player.load()) {
        game.addToBattleLog(`欢迎回来！你当前等级为 ${player.level}。`);
    } else {
        game.addToBattleLog('开始新的冒险！祝你好运！');
    }
}

// 设置自动保存
function setupAutoSave() {
    // 每30秒自动保存一次
    setInterval(() => {
        if (player.isAlive()) {
            game.saveGame();
        }
    }, 30000);
    
    // 页面关闭前保存
    window.addEventListener('beforeunload', () => {
        game.saveGame();
    });
}

// 设置键盘快捷键 - 移除自动战斗相关按键
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // 防止在输入框中触发快捷键
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(event.key.toLowerCase()) {
            case 'h':
                // H键：治疗
                if (player.isAlive()) {
                    game.buyHeal();
                }
                break;
            case 'a':
                // A键：升级攻击力
                game.upgradeAttack();
                break;
            case 'd':
                // D键：升级防御力
                game.upgradeDefense();
                break;
            case 'n':
                // N键：进入下一区域
                game.enterNextArea();
                break;
            case 's':
                // S键：保存游戏
                game.saveGame();
                break;
            case 'l':
                // L键：加载游戏
                game.loadGame();
                break;
            case ' ': // 空格键
                // 空格键：快速战斗一次
                if (player.isAlive()) {
                    game.quickBattle();
                }
                break;
        }
    });
}

// 添加游戏统计功能
function setupGameStatistics() {
    const stats = {
        monstersKilled: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        totalGoldEarned: 0,
        totalExpEarned: 0,
        itemsCollected: 0,
        timesLeveledUp: 0
    };
    
    // 存储统计数据到localStorage
    function saveStats() {
        localStorage.setItem('gameStats', JSON.stringify(stats));
    }
    
    // 加载统计数据
    function loadStats() {
        const savedStats = localStorage.getItem('gameStats');
        if (savedStats) {
            Object.assign(stats, JSON.parse(savedStats));
        }
    }
    
    // 暴露统计方法
    window.gameStats = {
        incrementMonstersKilled() {
            stats.monstersKilled++;
            saveStats();
        },
        addDamageDealt(amount) {
            stats.totalDamageDealt += amount;
            saveStats();
        },
        addDamageTaken(amount) {
            stats.totalDamageTaken += amount;
            saveStats();
        },
        addGoldEarned(amount) {
            stats.totalGoldEarned += amount;
            saveStats();
        },
        addExpEarned(amount) {
            stats.totalExpEarned += amount;
            saveStats();
        },
        incrementItemsCollected() {
            stats.itemsCollected++;
            saveStats();
        },
        incrementLeveledUp() {
            stats.timesLeveledUp++;
            saveStats();
        },
        getStats() {
            return { ...stats };
        },
        resetStats() {
            Object.keys(stats).forEach(key => {
                stats[key] = 0;
            });
            saveStats();
        }
    };
    
    // 加载统计数据
    loadStats();
}

// 添加成就系统
function setupAchievements() {
    const achievements = [
        { id: 'first_battle', name: '初次战斗', description: '进行第一次战斗', unlocked: false },
        { id: 'first_level', name: '初露锋芒', description: '达到等级5', unlocked: false },
        { id: 'monster_hunter', name: '怪物猎人', description: '击败100个怪物', unlocked: false },
        { id: 'gold_digger', name: '淘金者', description: '累计获得1000金币', unlocked: false },
        { id: 'area_explorer', name: '区域探索者', description: '到达区域5', unlocked: false },
        { id: 'boss_slayer', name: 'Boss杀手', description: '击败一个区域Boss', unlocked: false },
        { id: 'equipment_master', name: '装备大师', description: '收集10件装备', unlocked: false },
        { id: 'level_20', name: '实力进阶', description: '达到等级20', unlocked: false },
        { id: 'rich_player', name: '富豪', description: '拥有10000金币', unlocked: false },
        { id: 'legendary_hunter', name: '传奇猎人', description: '获得一件传说级装备', unlocked: false }
    ];
    
    // 检查并解锁成就
    function checkAchievements() {
        const stats = window.gameStats.getStats();
        
        achievements.forEach(achievement => {
            if (achievement.unlocked) return;
            
            let unlocked = false;
            
            switch(achievement.id) {
                case 'first_battle':
                    unlocked = stats.monstersKilled > 0;
                    break;
                case 'first_level':
                    unlocked = player.level >= 5;
                    break;
                case 'monster_hunter':
                    unlocked = stats.monstersKilled >= 100;
                    break;
                case 'gold_digger':
                    unlocked = stats.totalGoldEarned >= 1000;
                    break;
                case 'area_explorer':
                    unlocked = player.currentArea >= 5;
                    break;
                case 'boss_slayer':
                    // 需要在击败Boss时标记
                    break;
                case 'equipment_master':
                    unlocked = stats.itemsCollected >= 10;
                    break;
                case 'level_20':
                    unlocked = player.level >= 20;
                    break;
                case 'rich_player':
                    unlocked = stats.totalGoldEarned >= 10000;
                    break;
                case 'legendary_hunter':
                    // 需要在获得传说装备时标记
                    break;
            }
            
            if (unlocked) {
                achievement.unlocked = true;
                game.addToBattleLog(`🏆 成就解锁：${achievement.name} - ${achievement.description}`);
                saveAchievements();
            }
        });
    }
    
    // 保存成就
    function saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(achievements));
    }
    
    // 加载成就
    function loadAchievements() {
        const savedAchievements = localStorage.getItem('achievements');
        if (savedAchievements) {
            const parsedAchievements = JSON.parse(savedAchievements);
            parsedAchievements.forEach(saved => {
                const achievement = achievements.find(a => a.id === saved.id);
                if (achievement) {
                    achievement.unlocked = saved.unlocked;
                }
            });
        }
    }
    
    // 暴露成就方法
    window.achievements = {
        check() {
            checkAchievements();
        },
        getAll() {
            return [...achievements];
        },
        getUnlockedCount() {
            return achievements.filter(a => a.unlocked).length;
        }
    };
    
    // 加载成就
    loadAchievements();
    
    // 定时检查成就
    setInterval(() => {
        checkAchievements();
    }, 5000);
}

// 增强原有的游戏方法以支持统计和成就
function enhanceGameMethods() {
    // 增强角色升级方法
    const originalLevelUp = player.levelUp;
    player.levelUp = function() {
        originalLevelUp.call(this);
        
        // 记录统计数据
        window.gameStats.incrementLeveledUp();
        
        // 检查成就
        window.achievements.check();
    };
    
    // 增强物品添加方法
    const originalAddToInventory = player.addToInventory;
    player.addToInventory = function(item) {
        const result = originalAddToInventory.call(this, item);
        
        if (result) {
            // 记录统计数据
            window.gameStats.incrementItemsCollected();
            
            // 检查传说级装备成就
            if (item && item.rarity === 'legendary') {
                const legendaryAchievement = window.achievements.getAll().find(a => a.id === 'legendary_hunter');
                if (legendaryAchievement && !legendaryAchievement.unlocked) {
                    legendaryAchievement.unlocked = true;
                    game.addToBattleLog(`🏆 成就解锁：传奇猎人 - 获得一件传说级装备`);
                    localStorage.setItem('achievements', JSON.stringify(window.achievements.getAll()));
                }
            }
            
            // 检查成就
            window.achievements.check();
        }
        
        return result;
    };
}

// 初始化统计和成就系统
setupGameStatistics();
setupAchievements();
enhanceGameMethods();

// 导出主函数供其他模块使用
window.initGame = initGame;
window.saveGameData = () => game.saveGame();
window.loadGameData = loadGameData;