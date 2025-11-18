class Character {
    constructor() {
        // 基础属性
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.gold = 0;
        
        // 战斗属性
        this.attack = 10;
        this.defense = 5;
        this.maxHp = 100;
        this.hp = 100;
        
        // 当前所在区域
        this.currentArea = 1;
        
        // 背包
        this.inventory = [];
        this.maxInventorySize = 20; // 背包最大容量
        
        // 装备
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        
        // 已击败的BOSS记录
        this.defeatedBosses = {};
        
        // 技能系统
        this.skillPoints = 0; // 可用技能点
        this.skills = {}; // 已学习的技能
        this.skillTree = this.initializeSkillTree();
        
        // 任务系统
        this.activeQuests = [];
        this.completedQuests = [];
        this.questProgress = {};
        
        // 离线收益相关
        this.lastActiveTime = new Date().getTime();
        this.offlineExpMultiplier = 0.5; // 离线经验倍数
        this.offlineGoldMultiplier = 0.3; // 离线金币倍数
        
        // 任务系统
        this.activeQuests = [];
        this.completedQuests = [];
        this.questProgress = {};
    }
    
    // 获取总攻击力（包括装备加成）
    getTotalAttack() {
        let totalAttack = this.attack;
        if (this.equipment.weapon) {
            totalAttack += this.equipment.weapon.attack || 0;
        }
        if (this.equipment.accessory) {
            totalAttack += this.equipment.accessory.attack || 0;
        }
        return totalAttack;
    }
    
    // 获取总防御力（包括装备加成）
    getTotalDefense() {
        let totalDefense = this.defense;
        if (this.equipment.armor) {
            totalDefense += this.equipment.armor.defense || 0;
        }
        if (this.equipment.accessory) {
            totalDefense += this.equipment.accessory.defense || 0;
        }
        return totalDefense;
    }
    
    // 获取最大生命值（包括装备加成）
    getTotalMaxHp() {
        let totalMaxHp = this.maxHp;
        if (this.equipment.armor) {
            totalMaxHp += this.equipment.armor.maxHp || 0;
        }
        if (this.equipment.accessory) {
            totalMaxHp += this.equipment.accessory.maxHp || 0;
        }
        return totalMaxHp;
    }
    
    // 获取总暴击率（包括装备加成）
    getTotalCritRate() {
        let totalCritRate = 0;
        if (this.equipment.weapon) {
            totalCritRate += this.equipment.weapon.critRate || 0;
        }
        if (this.equipment.accessory) {
            totalCritRate += this.equipment.accessory.critRate || 0;
        }
        return Math.min(50, totalCritRate); // 最大50%暴击率
    }
    
    // 获取总闪避率（包括装备加成）
    getTotalDodgeRate() {
        let totalDodgeRate = 0;
        if (this.equipment.armor) {
            totalDodgeRate += this.equipment.armor.dodgeRate || 0;
        }
        if (this.equipment.accessory) {
            totalDodgeRate += this.equipment.accessory.dodgeRate || 0;
        }
        return Math.min(30, totalDodgeRate); // 最大30%闪避率
    }
    
    // 获取总毒抗（包括装备加成）
    getTotalPoisonRes() {
        let totalRes = 0;
        if (this.equipment.armor) {
            totalRes += this.equipment.armor.poisonRes || 0;
        }
        if (this.equipment.accessory) {
            totalRes += this.equipment.accessory.poisonRes || 0;
        }
        return Math.min(80, totalRes); // 最大80%抗性
    }
    
    // 获取总火抗（包括装备加成）
    getTotalFireRes() {
        let totalRes = 0;
        if (this.equipment.armor) {
            totalRes += this.equipment.armor.fireRes || 0;
        }
        if (this.equipment.accessory) {
            totalRes += this.equipment.accessory.fireRes || 0;
        }
        return Math.min(80, totalRes); // 最大80%抗性
    }
    
    // 获取总冰抗（包括装备加成）
    getTotalIceRes() {
        let totalRes = 0;
        if (this.equipment.armor) {
            totalRes += this.equipment.armor.iceRes || 0;
        }
        if (this.equipment.accessory) {
            totalRes += this.equipment.accessory.iceRes || 0;
        }
        return Math.min(80, totalRes); // 最大80%抗性
    }
    
    // 获取总闪电抗性（包括装备加成）
    getTotalLightningRes() {
        let totalRes = 0;
        if (this.equipment.armor) {
            totalRes += this.equipment.armor.lightningRes || 0;
        }
        if (this.equipment.accessory) {
            totalRes += this.equipment.accessory.lightningRes || 0;
        }
        return Math.min(80, totalRes); // 最大80%抗性
    }
    
    // 获取特定元素抗性
    getResistance(elementType) {
        switch(elementType) {
            case 'fire': return this.getTotalFireRes();
            case 'ice': return this.getTotalIceRes();
            case 'lightning': return this.getTotalLightningRes();
            case 'poison': return this.getTotalPoisonRes();
            default: return 0;
        }
    }
    
    // 获取总生命偷取（包括装备加成）
    getTotalLifeSteal() {
        let totalLifeSteal = 0;
        if (this.equipment.weapon) {
            totalLifeSteal += this.equipment.weapon.lifeSteal || 0;
        }
        if (this.equipment.armor) {
            totalLifeSteal += this.equipment.armor.lifeSteal || 0;
        }
        if (this.equipment.accessory) {
            totalLifeSteal += this.equipment.accessory.lifeSteal || 0;
        }
        return Math.min(30, totalLifeSteal); // 最大30%生命偷取
    }
    
    // 获取总伤害减免（包括装备加成）
    getTotalDamageReduction() {
        let totalReduction = 0;
        if (this.equipment.weapon) {
            totalReduction += this.equipment.weapon.damageReduction || 0;
        }
        if (this.equipment.armor) {
            totalReduction += this.equipment.armor.damageReduction || 0;
        }
        if (this.equipment.accessory) {
            totalReduction += this.equipment.accessory.damageReduction || 0;
        }
        return Math.min(40, totalReduction); // 最大40%伤害减免
    }
    
    // 获取经验加成
    getExpBonus() {
        let bonus = 0;
        if (this.equipment.accessory) {
            bonus += this.equipment.accessory.expBonus || 0;
        }
        return bonus;
    }
    
    // 获取金币加成
    getGoldBonus() {
        let bonus = 0;
        if (this.equipment.accessory) {
            bonus += this.equipment.accessory.goldBonus || 0;
        }
        return bonus;
    }
    
    // 获得经验
    gainExp(amount) {
        // 应用经验加成
        const expBonus = this.getExpBonus();
        const finalAmount = Math.floor(amount * (1 + expBonus / 100));
        
        this.exp += finalAmount;
        let leveledUp = false;
        
        while (this.exp >= this.expToNext) {
            this.levelUp();
            leveledUp = true;
        }
        
        // 检查任务进度
        this.updateQuestProgress('expGain', finalAmount);
        
        return leveledUp;
    }
    
    // 初始化技能树
    initializeSkillTree() {
        return {
            // 攻击系技能
            attackSkills: [
                { id: 'powerStrike', name: '强力打击', description: '攻击力+10%', cost: 1, prerequisites: [] },
                { id: 'criticalBoost', name: '暴击提升', description: '暴击率+5%', cost: 2, prerequisites: ['powerStrike'] },
                { id: 'lightningSpeed', name: '闪电速度', description: '攻击速度+15%', cost: 3, prerequisites: ['criticalBoost'] }
            ],
            // 防御系技能
            defenseSkills: [
                { id: 'toughSkin', name: '坚韧皮肤', description: '防御力+10%', cost: 1, prerequisites: [] },
                { id: 'magicResistance', name: '魔法抗性', description: '所有元素抗性+10%', cost: 2, prerequisites: ['toughSkin'] },
                { id: 'ironWill', name: '钢铁意志', description: '最大生命值+20%', cost: 3, prerequisites: ['magicResistance'] }
            ],
            // 辅助系技能
            supportSkills: [
                { id: 'goldFinder', name: '寻宝者', description: '金币掉落+20%', cost: 1, prerequisites: [] },
                { id: 'expBooster', name: '经验加成', description: '经验获取+20%', cost: 2, prerequisites: ['goldFinder'] },
                { id: 'masterMerchant', name: '商人精通', description: '出售价格+30%', cost: 3, prerequisites: ['expBooster'] }
            ]
        };
    }
    
    // 学习技能
    learnSkill(skillId) {
        // 查找技能
        let targetSkill = null;
        for (const category in this.skillTree) {
            const skill = this.skillTree[category].find(s => s.id === skillId);
            if (skill) {
                targetSkill = skill;
                break;
            }
        }
        
        if (!targetSkill) return false;
        
        // 检查是否已学习
        if (this.skills[skillId]) return false;
        
        // 检查技能点
        if (this.skillPoints < targetSkill.cost) return false;
        
        // 检查前置技能
        for (const prereq of targetSkill.prerequisites) {
            if (!this.skills[prereq]) return false;
        }
        
        // 学习技能
        this.skillPoints -= targetSkill.cost;
        this.skills[skillId] = true;
        
        return true;
    }
    
    // 获取技能加成
    getSkillBonus(type) {
        let bonus = 0;
        
        if (type === 'attack') {
            if (this.skills['powerStrike']) bonus += 10;
        } else if (type === 'defense') {
            if (this.skills['toughSkin']) bonus += 10;
        } else if (type === 'exp') {
            if (this.skills['expBooster']) bonus += 20;
        } else if (type === 'gold') {
            if (this.skills['goldFinder']) bonus += 20;
        } else if (type === 'sell') {
            if (this.skills['masterMerchant']) bonus += 30;
        }
        
        return bonus;
    }
    
    // 升级
    levelUp() {
        this.exp -= this.expToNext;
        this.level += 1;
        this.expToNext = Math.floor(this.expToNext * 1.5);
        
        // 升级属性提升
        this.attack += 2 + Math.floor(this.level / 5);
        this.defense += 1 + Math.floor(this.level / 5);
        this.maxHp += 20 + Math.floor(this.level / 2);
        this.hp = this.getTotalMaxHp(); // 升级后回满生命
        
        // 升级奖励金币
        this.gold += 50 + this.level * 10;
        
        // 升级获得技能点
        this.skillPoints += 1;
        
        // 检查任务进度
        this.updateQuestProgress('levelUp', 1);
    }
    
    // 获得金币
    gainGold(amount) {
        this.gold += amount;
    }
    
    // 花费金币
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    // 受到伤害
    takeDamage(amount) {
        const damage = Math.max(1, amount - this.getTotalDefense());
        this.hp = Math.max(0, this.hp - damage);
        return damage;
    }
    
    // 治疗
    heal(amount = null) {
        if (amount === null) {
            this.hp = this.getTotalMaxHp(); // 回满
        } else {
            this.hp = Math.min(this.getTotalMaxHp(), this.hp + amount);
        }
    }
    
    // 购买治疗
    buyHeal() {
        const cost = 50;
        if (this.spendGold(cost)) {
            this.heal();
            return true;
        }
        return false;
    }
    
    // 升级攻击力
    upgradeAttack() {
        const cost = 100 + (this.attack - 10) * 20; // 基础攻击是10，每提升一点攻击，升级成本增加20金币
        if (this.spendGold(cost)) {
            this.attack += 5;
            return true;
        }
        return false;
    }
    
    // 升级防御力
    upgradeDefense() {
        const cost = 100 + (this.defense - 5) * 20; // 基础防御是5，每提升一点防御，升级成本增加20金币
        if (this.spendGold(cost)) {
            this.defense += 3;
            return true;
        }
        return false;
    }
    
    // 进入下一区域
    nextArea() {
        if (this.level >= this.currentArea * 3) { // 每3级可以进入下一区域
            this.currentArea += 1;
            return true;
        }
        return false;
    }
    
    // 添加物品到背包
    addToInventory(item) {
        if (this.inventory.length < this.maxInventorySize) {
            this.inventory.push(item);
            return true; // 返回true表示成功添加
        }
        return false; // 背包已满
    }
    
    // 装备物品
    equipItem(item) {
        if (!item) return false;
        
        let previousItem = null;
        
        switch(item.type) {
            case 'weapon':
            case 'armor':
            case 'accessory':
                previousItem = this.equipment[item.type];
                this.equipment[item.type] = item;
                break;
            default:
                return false;
        }
        
        // 更新生命值
        this.maxHp = this.getTotalMaxHp();
        this.hp = Math.min(this.hp, this.maxHp);
        
        // 如果之前有装备，放回背包
        if (previousItem) {
            if (this.inventory.length < this.maxInventorySize) {
                this.addToInventory(previousItem);
            } else {
                // 背包已满，丢弃旧装备
                return { success: true, message: '装备已更换，但背包已满，旧装备被丢弃' };
            }
        }
        
        // 从背包中移除
        const index = this.inventory.findIndex(i => i === item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
        
        // 检查任务进度
        this.updateQuestProgress('equipItem', 1);
        
        return { success: true, message: `成功装备了${item.name}` };
    }
    
    // 卸下装备
    unequipItem(type) {
        if (!this.equipment[type]) {
            return { success: false, message: '该装备槽为空' };
        }
        
        if (this.inventory.length >= this.maxInventorySize) {
            return { success: false, message: '背包已满，无法卸下装备' };
        }
        
        const itemToRemove = this.equipment[type];
        this.equipment[type] = null;
        this.addToInventory(itemToRemove);
        
        // 更新生命值
        this.maxHp = this.getTotalMaxHp();
        this.hp = Math.min(this.hp, this.maxHp);
        
        return { success: true, message: `成功卸下${itemToRemove.name}` };
    }
    
    // 扩展背包容量
    expandInventory(additionalSlots) {
        this.maxInventorySize += additionalSlots;
        return { success: true, message: `背包容量已扩展至${this.maxInventorySize}格` };
    }
    
    // 出售物品
    sellItem(item) {
        const index = this.inventory.findIndex(i => i === item);
        if (index !== -1) {
            // 添加金币
            const goldBonus = this.getGoldBonus();
            const finalGold = Math.floor(item.sellPrice * (1 + goldBonus / 100));
            this.gold += finalGold;
            this.inventory.splice(index, 1);
            
            // 检查任务进度
            this.updateQuestProgress('sellItem', 1);
            this.updateQuestProgress('goldGain', finalGold);
            
            return true;
        }
        return false;
    }
    
    // 批量出售物品
    batchSellItems(options = {}) {
        const { rarity, type, excludeEquipped = true } = options;
        const itemsToSell = [];
        let totalGold = 0;
        
        // 找出所有符合条件的物品
        for (let i = 0; i < this.inventory.length; i++) {
            const item = this.inventory[i];
            
            // 检查是否是装备中的物品
            if (excludeEquipped) {
                if (this.equipment.weapon === item || 
                    this.equipment.armor === item || 
                    this.equipment.accessory === item) {
                    continue;
                }
            }
            
            // 检查稀有度
            if (rarity && item.rarity !== rarity) {
                continue;
            }
            
            // 检查类型
            if (type && item.type !== type) {
                continue;
            }
            
            itemsToSell.push(i);
            totalGold += item.sellPrice;
        }
        
        // 从后往前删除，避免索引问题
        for (let i = itemsToSell.length - 1; i >= 0; i--) {
            this.inventory.splice(itemsToSell[i], 1);
        }
        
        // 应用金币加成
        const goldBonus = this.getGoldBonus();
        const finalGold = Math.floor(totalGold * (1 + goldBonus / 100));
        
        // 增加金币
        this.gold += finalGold;
        
        // 检查任务进度
        const count = itemsToSell.length;
        if (count > 0) {
            this.updateQuestProgress('sellItem', count);
            this.updateQuestProgress('goldGain', finalGold);
        }
        
        return { count, totalGold: finalGold };
    }
    
    // 检查是否存活
    isAlive() {
        return this.hp > 0;
    }
    
    // 保存角色数据
    save() {
        const data = {
            level: this.level,
            exp: this.exp,
            expToNext: this.expToNext,
            gold: this.gold,
            attack: this.attack,
            defense: this.defense,
            maxHp: this.maxHp,
            hp: this.hp,
            currentArea: this.currentArea,
            inventory: this.inventory,
            maxInventorySize: this.maxInventorySize,
            equipment: this.equipment,
            defeatedBosses: this.defeatedBosses,
            skills: this.skills,
            skillPoints: this.skillPoints,
            lastActiveTime: new Date().getTime(),
            activeQuests: this.activeQuests,
            completedQuests: this.completedQuests,
            questProgress: this.questProgress
        };
        localStorage.setItem('characterData', JSON.stringify(data));
        return true;
    }
    
    // 初始化任务
    initializeQuests() {
        // 如果没有活跃任务，初始化基础任务
        if (this.activeQuests.length === 0) {
            this.activeQuests = [
                { id: 'first_battle', type: 'killMonsters', target: 10, reward: { exp: 100, gold: 50 }, description: '击败10只怪物' },
                { id: 'collect_gold', type: 'collectGold', target: 200, reward: { exp: 150, gold: 100 }, description: '收集200金币' },
                { id: 'reach_level_5', type: 'reachLevel', target: 5, reward: { exp: 200, gold: 150 }, description: '达到5级' }
            ];
            
            // 初始化任务进度
            for (const quest of this.activeQuests) {
                if (!this.questProgress[quest.id]) {
                    this.questProgress[quest.id] = 0;
                }
            }
        }
    }
    
    // 更新任务进度
    updateQuestProgress(type, amount) {
        for (const quest of this.activeQuests) {
            if (quest.type === type) {
                this.questProgress[quest.id] = Math.min(
                    (this.questProgress[quest.id] || 0) + amount,
                    quest.target
                );
                
                // 检查任务是否完成
                if (this.questProgress[quest.id] >= quest.target) {
                    this.completeQuest(quest.id);
                }
            }
        }
        
        // 特殊任务类型检查
        if (type === 'levelUp') {
            this.checkLevelQuests();
        } else if (type === 'killMonsters') {
            this.checkKillQuests();
        }
    }
    
    // 检查等级任务
    checkLevelQuests() {
        for (const quest of this.activeQuests) {
            if (quest.type === 'reachLevel' && this.level >= quest.target) {
                this.completeQuest(quest.id);
            }
        }
    }
    
    // 检查击杀任务
    checkKillQuests() {
        // 这里会在game.js中调用时传入怪物数量
    }
    
    // 完成任务
    completeQuest(questId) {
        const questIndex = this.activeQuests.findIndex(q => q.id === questId);
        if (questIndex === -1) return false;
        
        const quest = this.activeQuests[questIndex];
        
        // 给予奖励
        if (quest.reward.exp) {
            this.gainExp(quest.reward.exp);
        }
        if (quest.reward.gold) {
            this.gold += quest.reward.gold;
        }
        
        // 移到已完成任务
        this.completedQuests.push(quest);
        this.activeQuests.splice(questIndex, 1);
        
        // 解锁新任务
        this.unlockNewQuests();
        
        return true;
    }
    
    // 解锁新任务
    unlockNewQuests() {
        // 根据已完成任务解锁新任务
        // 这里可以实现更复杂的任务解锁逻辑
    }
    
    // 计算离线收益
    calculateOfflineRewards() {
        const now = new Date().getTime();
        const lastTime = this.lastActiveTime || now;
        const timeDiff = now - lastTime;
        
        // 最大离线时间为24小时
        const maxOfflineTime = 24 * 60 * 60 * 1000;
        const effectiveTime = Math.min(timeDiff, maxOfflineTime);
        
        // 按每分钟计算收益
        const minutesOffline = effectiveTime / (60 * 1000);
        
        // 基础收益根据玩家等级计算
        const baseExpPerMinute = this.level * 5;
        const baseGoldPerMinute = this.level * 3;
        
        // 应用收益倍数
        const expBonus = this.getSkillBonus('exp') + (this.offlineExpMultiplier || 0);
        const goldBonus = this.getSkillBonus('gold') + (this.offlineGoldMultiplier || 0);
        
        const expGain = Math.floor(minutesOffline * baseExpPerMinute * (1 + expBonus / 100));
        const goldGain = Math.floor(minutesOffline * baseGoldPerMinute * (1 + goldBonus / 100));
        
        // 添加收益
        if (expGain > 0) {
            this.gainExp(expGain);
        }
        if (goldGain > 0) {
            this.gold += goldGain;
            this.updateQuestProgress('goldGain', goldGain);
        }
        
        // 更新最后活跃时间
        this.lastActiveTime = now;
        
        return { exp: expGain, gold: goldGain, minutes: minutesOffline };
    }
    
    // 加载角色数据
    load() {
        const data = localStorage.getItem('characterData');
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                Object.assign(this, parsedData);
                // 确保已击败的BOSS记录被正确恢复
                this.defeatedBosses = parsedData.defeatedBosses || {};
                this.skills = parsedData.skills || {};
                this.skillPoints = parsedData.skillPoints || 0;
                this.lastActiveTime = parsedData.lastActiveTime || new Date().getTime();
                this.activeQuests = parsedData.activeQuests || [];
                this.completedQuests = parsedData.completedQuests || [];
                this.questProgress = parsedData.questProgress || {};
                this.maxInventorySize = parsedData.maxInventorySize || 20;
                
                // 重新初始化技能树
                this.skillTree = this.initializeSkillTree();
                
                // 计算离线收益
                this.calculateOfflineRewards();
                
                // 初始化任务
                this.initializeQuests();
                
                return true;
            } catch (e) {
                console.error('加载角色数据失败:', e);
                return false;
            }
        }
        return false;
    }
}

// 创建全局角色实例
const player = new Character();

// 导出到全局
window.player = player;