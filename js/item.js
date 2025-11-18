// 物品工厂类 - 负责生成各种物品
class ItemFactory {
    constructor() {
        this.itemNames = {
            weapon: {
                legendary: ['屠龙剑', '灭世刀', '破天枪', '混沌战斧'],
                epic: ['火焰剑', '寒冰刃', '闪电枪', '毒牙匕首'],
                rare: ['锋利长剑', '坚固战锤', '快速匕首', '精确弓箭'],
                uncommon: ['精铁剑', '硬木杖', '青铜匕首', '钢枪'],
                common: ['木剑', '石刀', '铁剑', '铜匕首']
            },
            armor: {
                legendary: ['神圣铠甲', '龙鳞甲', '凤凰羽衣', '泰坦战甲'],
                epic: ['火焰战甲', '冰霜护甲', '闪电法袍', '毒藤护甲'],
                rare: ['精钢铠甲', '锁子甲', '皮甲', '布甲'],
                uncommon: ['铁甲', '铜甲', '硬皮甲', '粗布甲'],
                common: ['皮甲', '布甲', '木甲', '藤甲']
            },
            accessory: {
                legendary: ['命运护符', '灵魂水晶', '元素之心', '神圣遗物'],
                epic: ['火焰吊坠', '冰霜戒指', '闪电护符', '毒雾护符'],
                rare: ['力量护符', '防御护符', '生命石', '敏捷指环'],
                uncommon: ['铁戒指', '铜吊坠', '皮手环', '木护符'],
                common: ['石头护符', '布手环', '木戒指', '皮革吊坠']
            }
        };
    }
    
    // 创建物品
    createItem(level, type = null, rarity = null) {
        // 如果未指定类型，随机选择
        if (!type) {
            const types = ['weapon', 'armor', 'accessory'];
            type = types[Math.floor(Math.random() * types.length)];
        }
        
        // 如果未指定稀有度，随机决定
        if (!rarity) {
            const rarityRoll = Math.random();
            if (rarityRoll < 0.05) rarity = 'legendary';
            else if (rarityRoll < 0.2) rarity = 'epic';
            else if (rarityRoll < 0.4) rarity = 'rare';
            else if (rarityRoll < 0.7) rarity = 'uncommon';
            else rarity = 'common';
        }
        
        // 计算基础属性
        const baseValue = Math.floor(level * 2);
        let stats = {};
        
        switch(type) {
            case 'weapon':
                stats = {
                    attack: this.calculateStat(baseValue, rarity, 2, 5),
                    critRate: this.calculateStat(baseValue, rarity, 0.5, 2)
                };
                break;
            case 'armor':
                stats = {
                    defense: this.calculateStat(baseValue, rarity, 1, 4),
                    maxHp: this.calculateStat(baseValue, rarity, 10, 30)
                };
                break;
            case 'accessory':
                stats = {
                    expBonus: this.calculateStat(baseValue, rarity, 2, 10),
                    goldBonus: this.calculateStat(baseValue, rarity, 2, 10),
                    dodgeRate: this.calculateStat(baseValue, rarity, 0.5, 3)
                };
                break;
        }
        
        // 随机添加元素抗性
        const elementTypes = ['fire', 'ice', 'lightning', 'poison'];
        const randomElement = elementTypes[Math.floor(Math.random() * elementTypes.length)];
        stats[`${randomElement}Res`] = this.calculateStat(baseValue, rarity, 1, 5);
        
        // 生成名称
        const names = this.itemNames[type][rarity];
        const name = names[Math.floor(Math.random() * names.length)];
        
        // 创建物品对象
        return {
            name,
            type,
            rarity,
            level,
           强化等级: 0,
            sellPrice: this.calculateSellPrice(stats, rarity),
            ...stats
        };
    }
    
    // 计算属性值
    calculateStat(baseValue, rarity, minMultiplier, maxMultiplier) {
        const rarityMultipliers = {
            common: 1,
            uncommon: 1.5,
            rare: 2,
            epic: 3,
            legendary: 5
        };
        
        const rarityMultiplier = rarityMultipliers[rarity] || 1;
        const randomMultiplier = Math.random() * (maxMultiplier - minMultiplier) + minMultiplier;
        
        return Math.floor(baseValue * rarityMultiplier * randomMultiplier);
    }
    
    // 计算售价
    calculateSellPrice(stats, rarity) {
        const rarityMultipliers = {
            common: 1,
            uncommon: 2,
            rare: 5,
            epic: 10,
            legendary: 20
        };
        
        let baseValue = 0;
        for (const [key, value] of Object.entries(stats)) {
            if (typeof value === 'number') {
                baseValue += value;
            }
        }
        
        return Math.floor(baseValue * (rarityMultipliers[rarity] || 1) * 2);
    }
}

// 装备强化系统
class EquipmentEnhancer {
    constructor() {
        this.baseSuccessRate = 70; // 基础成功率70%
        this.maxEnhanceLevel = 10; // 最大强化等级
        this.failPenaltyRate = 0.5; // 失败惩罚系数
    }
    
    // 强化装备
    enhanceItem(item, player) {
        // 检查是否可以强化
        if (!item || item.强化等级 >= this.maxEnhanceLevel) {
            return { success: false, message: '装备已达到最高强化等级' };
        }
        
        // 计算强化成本
        const enhanceCost = this.calculateEnhanceCost(item);
        
        // 检查金币是否足够
        if (player.gold < enhanceCost) {
            return { success: false, message: '金币不足' };
        }
        
        // 扣除金币
        player.gold -= enhanceCost;
        
        // 计算成功率
        const successRate = this.calculateSuccessRate(item.强化等级);
        const isSuccess = Math.random() * 100 < successRate;
        
        if (isSuccess) {
            // 强化成功
            item.强化等级 += 1;
            this.applyEnhanceBonus(item);
            
            // 更新售价
            item.sellPrice = Math.floor(item.sellPrice * 1.5);
            
            return { 
                success: true, 
                message: `强化成功！当前强化等级：${item.强化等级}`,
                cost: enhanceCost
            };
        } else {
            // 强化失败
            const penaltyLevel = Math.floor(Math.random() * 3); // 0-2级惩罚
            if (penaltyLevel > 0 && item.强化等级 >= penaltyLevel) {
                item.强化等级 -= penaltyLevel;
                this.updateStatsAfterFailure(item, penaltyLevel);
            }
            
            return { 
                success: false, 
                message: `强化失败！${penaltyLevel > 0 ? `强化等级下降${penaltyLevel}级` : '无惩罚'}`,
                cost: enhanceCost
            };
        }
    }
    
    // 计算强化成本
    calculateEnhanceCost(item) {
        const rarityMultipliers = {
            common: 1,
            uncommon: 2,
            rare: 5,
            epic: 10,
            legendary: 20
        };
        
        const rarityMultiplier = rarityMultipliers[item.rarity] || 1;
        return Math.floor((item.强化等级 + 1) * 100 * rarityMultiplier);
    }
    
    // 计算成功率
    calculateSuccessRate(currentLevel) {
        // 随着强化等级提高，成功率降低
        const rateReduction = currentLevel * 5;
        return Math.max(20, this.baseSuccessRate - rateReduction);
    }
    
    // 应用强化加成
    applyEnhanceBonus(item) {
        const enhanceBonus = 0.1; // 每级强化提升10%属性
        
        for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'number' && !['level', '强化等级', 'sellPrice'].includes(key)) {
                item[key] = Math.floor(value * (1 + enhanceBonus));
            }
        }
    }
    
    // 失败后更新属性
    updateStatsAfterFailure(item, penaltyLevel) {
        const penaltyMultiplier = Math.pow(0.9, penaltyLevel); // 每级降低10%属性
        
        for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'number' && !['level', '强化等级', 'sellPrice'].includes(key)) {
                item[key] = Math.floor(value * penaltyMultiplier);
            }
        }
    }
}

// 装备合成系统
class EquipmentSynthesizer {
    constructor() {
        this.baseSuccessRate = 60; // 基础合成成功率60%
    }
    
    // 合成装备
    synthesizeItems(item1, item2, player) {
        // 检查条件
        if (!item1 || !item2) {
            return { success: false, message: '请选择两个装备进行合成' };
        }
        
        if (item1.type !== item2.type) {
            return { success: false, message: '只能合成相同类型的装备' };
        }
        
        if (item1.rarity !== item2.rarity) {
            return { success: false, message: '只能合成相同稀有度的装备' };
        }
        
        // 合成成本
        const synthesisCost = this.calculateSynthesisCost(item1.rarity);
        
        if (player.gold < synthesisCost) {
            return { success: false, message: '金币不足' };
        }
        
        // 计算成功率
        const successRate = this.calculateSuccessRate(item1.rarity);
        const isSuccess = Math.random() * 100 < successRate;
        
        // 扣除金币
        player.gold -= synthesisCost;
        
        if (isSuccess) {
            // 合成成功，生成更高稀有度的装备
            const newRarity = this.getNextRarity(item1.rarity);
            
            if (!newRarity) {
                return { success: false, message: '传说级装备无法继续合成' };
            }
            
            // 创建新装备
            const itemFactory = new ItemFactory();
            const newItem = itemFactory.createItem(
                Math.max(item1.level, item2.level),
                item1.type,
                newRarity
            );
            
            // 保留部分强化等级
            newItem.强化等级 = Math.floor((item1.强化等级 + item2.强化等级) * 0.5);
            
            // 从背包移除材料
            const removeIndex1 = player.inventory.findIndex(i => i === item1);
            const removeIndex2 = player.inventory.findIndex(i => i === item2);
            
            if (removeIndex1 > -1) player.inventory.splice(removeIndex1, 1);
            if (removeIndex2 > -1 && removeIndex1 !== removeIndex2) player.inventory.splice(removeIndex2, 1);
            
            // 添加新装备到背包
            player.inventory.push(newItem);
            
            return { 
                success: true, 
                message: `合成成功！获得了${newItem.name}`,
                newItem: newItem,
                cost: synthesisCost
            };
        } else {
            // 合成失败，随机保留一个装备
            const keepItem = Math.random() < 0.5 ? item1 : item2;
            const loseItem = keepItem === item1 ? item2 : item1;
            
            // 从背包移除失去的装备
            const removeIndex = player.inventory.findIndex(i => i === loseItem);
            if (removeIndex > -1) player.inventory.splice(removeIndex, 1);
            
            return { 
                success: false, 
                message: `合成失败！失去了${loseItem.name}`,
                cost: synthesisCost
            };
        }
    }
    
    // 计算合成成本
    calculateSynthesisCost(rarity) {
        const rarityCosts = {
            common: 500,
            uncommon: 1000,
            rare: 3000,
            epic: 10000
        };
        
        return rarityCosts[rarity] || 0;
    }
    
    // 计算合成成功率
    calculateSuccessRate(rarity) {
        const rarityRates = {
            common: 80,
            uncommon: 70,
            rare: 60,
            epic: 50
        };
        
        return rarityRates[rarity] || 0;
    }
    
    // 获取下一级稀有度
    getNextRarity(rarity) {
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
        const currentIndex = rarityOrder.indexOf(rarity);
        
        if (currentIndex < 0 || currentIndex >= rarityOrder.length - 1) {
            return null;
        }
        
        return rarityOrder[currentIndex + 1];
    }
}

// 导出功能
window.ItemFactory = ItemFactory;
window.EquipmentEnhancer = EquipmentEnhancer;
window.EquipmentSynthesizer = EquipmentSynthesizer;

// 初始化实例
window.itemFactory = new ItemFactory();
window.equipmentEnhancer = new EquipmentEnhancer();
window.equipmentSynthesizer = new EquipmentSynthesizer();