// UI管理模块
const uiManager = {
    // 初始化UI
    init(gameInstance) {
        console.log('UI初始化，gameInstance:', gameInstance);
        this.game = gameInstance;
        this.bindEvents();
        // 延迟更新UI，确保所有对象都已初始化
        setTimeout(() => {
            this.updateAllUI();
        }, 10);
    },
    
    // 绑定事件
        bindEvents() {
            const gainExpBtn = document.getElementById('gain-exp-btn');
            const gainExp5Btn = document.getElementById('gain-exp-5-btn');
            const gainExp10Btn = document.getElementById('gain-exp-10-btn');
            const healBtn = document.getElementById('heal-btn');
            const upgradeAttackBtn = document.getElementById('upgrade-attack-btn');
            const upgradeDefenseBtn = document.getElementById('upgrade-defense-btn');
            const nextAreaBtn = document.getElementById('next-area-btn');
            const batchSellBtn = document.getElementById('batch-sell-btn');
            
            // 经验获取按钮点击事件
            gainExpBtn.addEventListener('click', () => {
                if (!this.game.isAutoExploring) {
                    this.game.gainExperience();
                    this.updateButtonStates();
                }
            });
            
            // 连续探索5次按钮点击事件
            gainExp5Btn.addEventListener('click', () => {
                if (!this.game.isAutoExploring && player.isAlive()) {
                    this.game.autoExplore(5);
                }
            });
            
            // 连续探索10次按钮点击事件
            gainExp10Btn.addEventListener('click', () => {
                if (!this.game.isAutoExploring && player.isAlive()) {
                    this.game.autoExplore(10);
                }
            });
            
            // 治疗按钮点击事件
            healBtn.addEventListener('click', () => {
                if (!this.game.isAutoExploring && player.gold >= 50) {
                    player.heal(player.getTotalMaxHp());
                    player.spendGold(50);
                    this.game.addToBattleLog('你花费50金币进行了治疗！');
                    this.updateBattleUI();
                    this.updateButtonStates();
                }
            });
            
            // 升级攻击力按钮点击事件
            upgradeAttackBtn.addEventListener('click', () => {
                if (!this.game.isAutoExploring) {
                    const cost = 100 + (player.attack - 10) * 20;
                    if (player.gold >= cost) {
                        player.attack++;
                        player.spendGold(cost);
                        this.game.addToBattleLog(`攻击力提升至 ${player.attack}！`);
                        this.updateBattleUI();
                        this.updateButtonStates();
                    }
                }
            });
            
            // 升级防御力按钮点击事件
            upgradeDefenseBtn.addEventListener('click', () => {
                if (!this.game.isAutoExploring) {
                    const cost = 100 + (player.defense - 5) * 20;
                    if (player.gold >= cost) {
                        player.defense++;
                        player.spendGold(cost);
                        this.game.addToBattleLog(`防御力提升至 ${player.defense}！`);
                        this.updateBattleUI();
                        this.updateButtonStates();
                    }
                }
            });
            
            // 进入下一区域按钮点击事件
            nextAreaBtn.addEventListener('click', () => {
                if (!this.game.isAutoExploring && player.level >= player.currentArea * 3 && !this.game.isAutoBattling) {
                    player.currentArea++;
                    this.game.addToBattleLog(`你进入了第 ${player.currentArea} 区域！怪物变得更强了！`);
                    this.updateBattleUI();
                    this.updateButtonStates();
                }
            });
            
            // 批量出售按钮点击事件
            batchSellBtn.addEventListener('click', () => {
                if (!this.game.isAutoExploring) {
                    const raritySelect = document.getElementById('rarity-select');
                    const typeSelect = document.getElementById('type-select');
                    
                    const rarity = raritySelect.value || undefined;
                    const type = typeSelect.value || undefined;
                    
                    const result = player.batchSellItems({ rarity, type });
                    
                    if (result.count > 0) {
                        this.game.addToBattleLog(`出售了 ${result.count} 件物品，获得 ${result.totalGold} 金币！`);
                        this.showNotification(`出售成功！\n出售了 ${result.count} 件物品\n获得 ${result.totalGold} 金币`);
                        this.updateInventoryUI();
                        this.updateBattleUI();
                    } else {
                        this.game.addToBattleLog('没有找到符合条件的物品可以出售！');
                        this.showNotification('没有找到符合条件的物品可以出售！');
                    }
                }
            });
            
            // 监听生命值变化，添加受伤动画
            let originalTakeDamage = player.takeDamage;
            player.takeDamage = function(amount) {
                const damage = originalTakeDamage.call(this, amount);
                uiManager.showDamageEffect();
                return damage;
            };
        },
    
    // 更新所有UI
    updateAllUI() {
        this.updateCharacterStats();
        this.updateBattleUI();
        this.updateInventoryUI();
        this.updateButtonStates();
    },
    
    // 更新角色属性显示
    updateCharacterStats() {
        const levelEl = document.getElementById('level');
        const expEl = document.getElementById('exp');
        const expToNextEl = document.getElementById('exp-to-next');
        const goldEl = document.getElementById('gold');
        const attackEl = document.getElementById('attack');
        const defenseEl = document.getElementById('defense');
        const hpEl = document.getElementById('hp');
        const maxHpEl = document.getElementById('max-hp');
        
        levelEl.textContent = player.level;
        expEl.textContent = player.exp;
        expToNextEl.textContent = player.expToNext;
        goldEl.textContent = player.gold;
        attackEl.textContent = player.getTotalAttack();
        defenseEl.textContent = player.getTotalDefense();
        hpEl.textContent = player.hp;
        maxHpEl.textContent = player.getTotalMaxHp();
        
        // 更新经验条
        this.updateExpBar();
        
        // 更新额外属性显示（如果存在这些方法）
        this.updateAdditionalStats();
    },
    
    // 更新额外属性显示
    updateAdditionalStats() {
        // 检查并创建额外属性显示区域
        let additionalStatsEl = document.getElementById('additional-stats');
        if (!additionalStatsEl) {
            additionalStatsEl = document.createElement('div');
            additionalStatsEl.id = 'additional-stats';
            additionalStatsEl.className = 'additional-stats';
            
            // 将额外属性区域插入到防御属性后面
            const defenseEl = document.getElementById('defense').closest('.status-item');
            if (defenseEl && defenseEl.nextElementSibling) {
                defenseEl.parentNode.insertBefore(additionalStatsEl, defenseEl.nextElementSibling);
            }
        }
        
        // 获取各种属性
        const critRate = player.getTotalCritRate ? player.getTotalCritRate() : 0;
        const dodgeRate = player.getTotalDodgeRate ? player.getTotalDodgeRate() : 0;
        const poisonRes = player.getTotalPoisonRes ? player.getTotalPoisonRes() : 0;
        const fireRes = player.getTotalFireRes ? player.getTotalFireRes() : 0;
        const iceRes = player.getTotalIceRes ? player.getTotalIceRes() : 0;
        const expBonus = player.getExpBonus ? player.getExpBonus() : 0;
        const goldBonus = player.getGoldBonus ? player.getGoldBonus() : 0;
        
        // 构建额外属性HTML
        let additionalStatsHtml = `
            <div class="additional-stats-grid">
                <div class="stat-item">
                    <span class="stat-label">暴击率:</span>
                    <span class="stat-value">${critRate}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">闪避率:</span>
                    <span class="stat-value">${dodgeRate}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">毒抗:</span>
                    <span class="stat-value">${poisonRes}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">火抗:</span>
                    <span class="stat-value">${fireRes}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">冰抗:</span>
                    <span class="stat-value">${iceRes}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">经验加成:</span>
                    <span class="stat-value">${expBonus}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">金币加成:</span>
                    <span class="stat-value">${goldBonus}%</span>
                </div>
            </div>
        `;
        
        additionalStatsEl.innerHTML = additionalStatsHtml;
    },
    
    // 更新经验条
    updateExpBar() {
        // 检查经验条是否存在，如果不存在则创建
        let expBar = document.querySelector('.exp-bar');
        if (!expBar) {
            expBar = document.createElement('div');
            expBar.className = 'exp-bar';
            expBar.innerHTML = '<div class="exp-bar-fill"></div>';
            document.querySelector('.status-item:nth-child(2)').appendChild(expBar);
        }
        
        const expBarFill = expBar.querySelector('.exp-bar-fill');
        const expPercentage = (player.exp / player.expToNext) * 100;
        expBarFill.style.width = `${expPercentage}%`;
    },
    
    // 更新战斗UI
    updateBattleUI() {
        this.updateCharacterStats();
        this.updateBattleLogUI();
        this.updateButtonStates();
    },
    
    // 更新怪物信息方法已移除，因为不再需要显示怪物信息,
    
    // 更新战斗日志
    updateBattleLogUI() {
        const battleLogEl = document.getElementById('battle-log');
        battleLogEl.innerHTML = '';
        
        console.log('更新战斗日志，this.game:', this.game);
        if (!this.game || !this.game.battleLog) {
            console.error('游戏对象或战斗日志未初始化');
            battleLogEl.innerHTML = '<p>初始化中...</p>';
            return;
        }
        
        this.game.battleLog.forEach(log => {
            const logEl = document.createElement('p');
            
            // 根据日志内容添加样式
            if (log.includes('升级了')) {
                logEl.className = 'level-up-log';
            } else if (log.includes('造成了') && log.includes('点伤害')) {
                logEl.className = 'damage-log';
            } else if (log.includes('获得了')) {
                logEl.className = 'reward-log';
            } else if (log.includes('死亡') || log.includes('击败了')) {
                logEl.className = 'death-log';
            }
            
            logEl.textContent = log;
            battleLogEl.appendChild(logEl);
        });
        
        // 自动滚动到底部
        battleLogEl.scrollTop = battleLogEl.scrollHeight;
    },
    
    // 更新背包UI
    updateInventoryUI() {
        const inventoryEl = document.getElementById('inventory');
        
        // 过滤掉null或undefined的物品
        const validItems = player.inventory.filter(item => item);
        
        if (validItems.length === 0) {
            inventoryEl.innerHTML = '<p>背包为空</p>';
        } else {
            // 按类型分类
            const itemsByType = {
                weapon: [],
                armor: [],
                accessory: []
            };
            
            validItems.forEach(item => {
                if (itemsByType[item.type]) {
                    itemsByType[item.type].push(item);
                }
            });
            
            // 稀有度排序权重
            const rarityWeights = {
                legendary: 5,
                epic: 4,
                rare: 3,
                uncommon: 2,
                common: 1
            };
            
            // 对每个类型的物品按稀有度从高到低排序
            for (const type in itemsByType) {
                itemsByType[type].sort((a, b) => {
                    const rarityA = rarityWeights[a.rarity || 'common'] || 0;
                    const rarityB = rarityWeights[b.rarity || 'common'] || 0;
                    return rarityB - rarityA;
                });
            }
            
            inventoryEl.innerHTML = '';
            
            // 创建并添加分类标题和物品
            const typeOrder = ['weapon', 'armor', 'accessory'];
            typeOrder.forEach(type => {
                const items = itemsByType[type];
                if (items.length > 0) {
                    // 添加分类标题
                    const categoryEl = document.createElement('div');
                    categoryEl.className = 'inventory-category';
                    categoryEl.innerHTML = `<h3>${this.getItemTypeText(type)}</h3>`;
                    inventoryEl.appendChild(categoryEl);
                    
                    // 添加该类型的所有物品
                    items.forEach((item, indexInType) => {
                        // 找到原始数组中的索引
                        const originalIndex = player.inventory.findIndex(i => i === item);
                        
                        const itemEl = document.createElement('div');
                        // 添加侧向点样式
                        const sidePointClass = `side-point-${type}`;
                        itemEl.className = `item rarity-${item.rarity || 'common'} ${sidePointClass}`;
                        itemEl.dataset.index = originalIndex;
                        
                        let statsHtml = '';
                        if (item.attack > 0) statsHtml += `<p>攻击 +${item.attack}</p>`;
                        if (item.defense > 0) statsHtml += `<p>防御 +${item.defense}</p>`;
                        if (item.maxHp > 0) statsHtml += `<p>生命 +${item.maxHp}</p>`;
                        if (item.critRate > 0) statsHtml += `<p>暴击 +${item.critRate}%</p>`;
                        if (item.dodgeRate > 0) statsHtml += `<p>闪避 +${item.dodgeRate}%</p>`;
                        if (item.poisonRes > 0) statsHtml += `<p>毒抗 +${item.poisonRes}%</p>`;
                        if (item.fireRes > 0) statsHtml += `<p>火抗 +${item.fireRes}%</p>`;
                        if (item.iceRes > 0) statsHtml += `<p>冰抗 +${item.iceRes}%</p>`;
                        if (item.expBonus > 0) statsHtml += `<p>经验 +${item.expBonus}%</p>`;
                        if (item.goldBonus > 0) statsHtml += `<p>金币 +${item.goldBonus}%</p>`;
                        
                        // 显示格式改为 品级·武器名
                        const rarityText = this.getRarityText(item.rarity || 'common');
                        const itemName = item.name || '未知物品';
                        const formattedName = `${rarityText}·${itemName}`;
                        
                        itemEl.innerHTML = `
                            <h4>${formattedName}</h4>
                            ${statsHtml}
                            <p class="sell-price">售价: ${item.sellPrice || 0} 金币</p>
                            <button class="equip-btn">装备</button>
                            <button class="sell-btn">出售</button>
                        `;
                        
                        // 绑定装备按钮事件
                        itemEl.querySelector('.equip-btn').addEventListener('click', () => {
                            player.equipItem(item);
                this.game.addToBattleLog(`装备了 ${item.name}`);
                this.updateInventoryUI();
                this.updateBattleUI();
                        });
                        
                        // 绑定出售按钮事件
                        itemEl.querySelector('.sell-btn').addEventListener('click', () => {
                            if (player.sellItem(item)) {
                    this.game.addToBattleLog(`出售了 ${item.name}，获得 ${item.sellPrice} 金币`);
                    this.updateInventoryUI();
                    this.updateBattleUI();
                }
                        });
                        
                        inventoryEl.appendChild(itemEl);
                    });
                }
            });
        }
    },
    
    // 更新按钮状态
        updateButtonStates() {
            const gainExpBtn = document.getElementById('gain-exp-btn');
            const gainExp5Btn = document.getElementById('gain-exp-5-btn');
            const gainExp10Btn = document.getElementById('gain-exp-10-btn');
            const healBtn = document.getElementById('heal-btn');
            const upgradeAttackBtn = document.getElementById('upgrade-attack-btn');
            const upgradeDefenseBtn = document.getElementById('upgrade-defense-btn');
            const nextAreaBtn = document.getElementById('next-area-btn');
            const batchSellBtn = document.getElementById('batch-sell-btn');
            
            // 检查是否正在自动探索
            const isAutoExploring = this.game && this.game.isAutoExploring;
            
            // 经验获取按钮状态
            gainExpBtn.disabled = !player.isAlive() || isAutoExploring;
            gainExp5Btn.disabled = !player.isAlive() || isAutoExploring;
            gainExp10Btn.disabled = !player.isAlive() || isAutoExploring;
            
            // 治疗按钮状态
            const healCost = 50;
            healBtn.disabled = !player.isAlive() || player.gold < healCost || player.hp >= player.getTotalMaxHp() || isAutoExploring;
            healBtn.textContent = `治疗 (${healCost}金币)`;
            
            // 升级按钮状态
            const attackUpgradeCost = 100 + (player.attack - 10) * 20;
            const defenseUpgradeCost = 100 + (player.defense - 5) * 20;
            
            upgradeAttackBtn.disabled = player.gold < attackUpgradeCost || isAutoExploring;
            upgradeAttackBtn.textContent = `提升攻击力 (${attackUpgradeCost}金币)`;
            
            upgradeDefenseBtn.disabled = player.gold < defenseUpgradeCost || isAutoExploring;
            upgradeDefenseBtn.textContent = `提升防御力 (${defenseUpgradeCost}金币)`;
            
            // 区域按钮状态
            nextAreaBtn.disabled = player.level < player.currentArea * 3 || this.game.isAutoBattling || isAutoExploring;
            
            // 批量出售按钮状态
            batchSellBtn.disabled = isAutoExploring;
        },
    
    // 显示等级提升动画
    showLevelUpAnimation() {
        const levelEl = document.getElementById('level');
        levelEl.classList.add('level-up-animation');
        
        setTimeout(() => {
            levelEl.classList.remove('level-up-animation');
        }, 1000);
        
        // 同时在经验获取按钮上也显示动画
        const gainExpBtn = document.getElementById('gain-exp-btn');
        if (gainExpBtn) {
            gainExpBtn.classList.add('level-up-animation');
            setTimeout(() => {
                gainExpBtn.classList.remove('level-up-animation');
            }, 1000);
        }
    },
    
    // 显示受伤效果
    showDamageEffect() {
        const characterStats = document.querySelector('.character-stats');
        characterStats.classList.add('damage-flash');
        
        setTimeout(() => {
            characterStats.classList.remove('damage-flash');
        }, 500);
    },
    
    // 显示战斗效果
    showBattleEffect() {
        const battleSection = document.querySelector('.battle-section');
        battleSection.classList.add('battle-effect');
        
        setTimeout(() => {
            battleSection.classList.remove('battle-effect');
        }, 300);
    },
    
    // 获取物品类型文本
    getItemTypeText(type) {
        const typeMap = {
            weapon: '武器',
            armor: '护甲',
            accessory: '饰品'
        };
        return typeMap[type] || type;
    },
    
    // 获取稀有度文本
    getRarityText(rarity) {
        const rarityMap = {
            common: '普通',
            uncommon: '优秀',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说'
        };
        return rarityMap[rarity] || rarity;
    },
    
    // 显示通知弹窗
    showNotification(message) {
        // 检查弹窗元素是否已存在
        let notificationEl = document.getElementById('notification-popup');
        if (!notificationEl) {
            // 创建弹窗元素
            notificationEl = document.createElement('div');
            notificationEl.id = 'notification-popup';
            notificationEl.className = 'notification-popup';
            notificationEl.innerHTML = '<div class="notification-content"></div>';
            document.body.appendChild(notificationEl);
            
            // 添加CSS样式
            const style = document.createElement('style');
            style.textContent = `
                .notification-popup {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    z-index: 1000;
                    text-align: center;
                    min-width: 300px;
                    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
                    animation: popup-appear 0.3s ease-out;
                }
                
                .notification-content {
                    font-size: 18px;
                    line-height: 1.5;
                }
                
                @keyframes popup-appear {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -60%) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%) scale(1);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 设置消息内容
        notificationEl.querySelector('.notification-content').textContent = message;
        
        // 显示弹窗
        notificationEl.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            notificationEl.style.opacity = '0';
            setTimeout(() => {
                notificationEl.style.display = 'none';
                notificationEl.style.opacity = '1';
            }, 300);
        }, 3000);
    }
};

// 导出UI更新函数到全局，供game.js调用
window.updateBattleUI = () => uiManager.updateBattleUI();
window.updateBattleLogUI = () => uiManager.updateBattleLogUI();
window.updateLevelUpUI = () => uiManager.showLevelUpAnimation();
window.updateInventoryUI = () => uiManager.updateInventoryUI();

// 导出uiManager供game.js和main.js使用
window.uiManager = uiManager;