class Monster {
    constructor(name, attack, defense, hp, expReward, goldReward, area, effects = [], elementType = null) {
        this.name = name;
        this.attack = attack;
        this.defense = defense;
        this.hp = hp;
        this.maxHp = hp;
        this.expReward = expReward;
        this.goldReward = goldReward;
        this.area = area;
        this.effects = effects; // 特殊效果数组
        this.elementType = elementType; // 元素类型: fire, ice, lightning, poison
    }
    
    isAlive() {
        return this.hp > 0;
    }
    
    takeDamage(damage, damageElement = null) {
        // 应用元素相克
        let finalDamage = damage;
        if (damageElement && this.elementType) {
            finalDamage = this.applyElementMultiplier(finalDamage, damageElement, this.elementType);
        }
        
        const actualDamage = Math.max(1, finalDamage - this.defense);
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }
    
    // 应用元素相克倍率
    applyElementMultiplier(damage, damageElement, targetElement) {
        // 元素相克关系
        const elementRelations = {
            fire: { weak: 'ice', strong: 'lightning' },
            ice: { weak: 'lightning', strong: 'fire' },
            lightning: { weak: 'fire', strong: 'ice' },
            poison: { weak: 'fire', strong: 'none' }
        };
        
        if (elementRelations[damageElement] && elementRelations[damageElement].strong === targetElement) {
            return Math.floor(damage * 1.5); // 元素克制，造成1.5倍伤害
        } else if (elementRelations[damageElement] && elementRelations[damageElement].weak === targetElement) {
            return Math.floor(damage * 0.7); // 元素被克制，造成0.7倍伤害
        }
        
        return damage; // 无克制关系
    }
    
    attackPlayer(player) {
        let damage = Math.max(1, this.attack - player.getTotalDefense());
        
        // 应用元素抗性
        let finalDamage = damage;
        if (this.elementType) {
            const resistance = player.getResistance ? player.getResistance(this.elementType) : 0;
            finalDamage = Math.floor(finalDamage * (1 - resistance / 100));
        }
        
        // 应用特殊效果
        let effectText = '';
        if (this.effects.includes('poison')) {
            const poisonDamage = Math.floor(this.attack * 0.3);
            player.takeDamage(poisonDamage);
            effectText = `[中毒!额外${poisonDamage}点伤害]`;
        } else if (this.effects.includes('fire')) {
            const fireDamage = Math.floor(this.attack * 0.4);
            player.takeDamage(fireDamage);
            effectText = `[燃烧!额外${fireDamage}点伤害]`;
        } else if (this.effects.includes('ice')) {
            const iceDamage = Math.floor(this.attack * 0.35);
            player.takeDamage(iceDamage);
            effectText = `[冰冻!额外${iceDamage}点伤害]`;
        } else if (this.effects.includes('lightning')) {
            const lightningDamage = Math.floor(this.attack * 0.45);
            player.takeDamage(lightningDamage);
            effectText = `[闪电!额外${lightningDamage}点伤害]`;
        }
        
        player.takeDamage(finalDamage);
        return { damage: finalDamage, effectText };
    }
}

class MonsterFactory {
    static createMonster(area, playerLevel) {
        // 根据区域和玩家等级生成怪物，增强区域影响
        // 区域对怪物强度的影响现在更加显著
        const areaMultiplier = 1 + (area - 1) * 0.2; // 每个区域增加20%的基础强度
        const baseLevel = Math.floor(playerLevel * 0.8) + (area * 2); // 区域权重翻倍
        
        // 根据区域确定可用的怪物类型
        let monsterTypes = [];
        if (area < 3) {
            // 低级区域的普通怪物
            monsterTypes = [
                { name: '史莱姆', attackMultiplier: 0.7, defenseMultiplier: 0.5, hpMultiplier: 1.0 },
                { name: '哥布林', attackMultiplier: 1.0, defenseMultiplier: 0.7, hpMultiplier: 0.8 },
                { name: '骷髅兵', attackMultiplier: 0.8, defenseMultiplier: 1.0, hpMultiplier: 0.9 }
            ];
        } else if (area < 6) {
            // 中级区域的强化怪物
            monsterTypes = [
                { name: '精英史莱姆', attackMultiplier: 1.0, defenseMultiplier: 0.8, hpMultiplier: 1.2 },
                { name: '哥布林投手', attackMultiplier: 1.3, defenseMultiplier: 0.9, hpMultiplier: 1.0 },
                { name: '骷髅战士', attackMultiplier: 1.1, defenseMultiplier: 1.2, hpMultiplier: 1.1 },
                { name: '吸血蝙蝠', attackMultiplier: 1.4, defenseMultiplier: 0.6, hpMultiplier: 0.9 }
            ];
        } else {
            // 高级区域的强力怪物
            monsterTypes = [
                { name: '地狱史莱姆', attackMultiplier: 1.4, defenseMultiplier: 1.2, hpMultiplier: 1.5 },
                { name: '哥布林巫师', attackMultiplier: 1.6, defenseMultiplier: 1.1, hpMultiplier: 1.3 },
                { name: '骷髅骑士', attackMultiplier: 1.5, defenseMultiplier: 1.5, hpMultiplier: 1.4 },
                { name: '熔岩蜘蛛', attackMultiplier: 1.7, defenseMultiplier: 1.0, hpMultiplier: 1.2 },
                { name: '暗影刺客', attackMultiplier: 1.9, defenseMultiplier: 0.9, hpMultiplier: 1.1 }
            ];
        }
        
        const monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        
        // 计算属性时应用区域乘数
        const attack = Math.floor(baseLevel * monsterType.attackMultiplier * areaMultiplier);
        const defense = Math.floor(baseLevel * monsterType.defenseMultiplier * areaMultiplier);
        const hp = Math.floor(baseLevel * monsterType.hpMultiplier * 10 * areaMultiplier);
        
        // 奖励也随区域增加而提高
        const expReward = Math.floor(baseLevel * 5 * (1 + (area - 1) * 0.15));
        const goldReward = Math.floor(baseLevel * 3 * (1 + (area - 1) * 0.15));
        
        // 为高区域怪物添加特殊效果
        const effects = [];
        let elementType = null;
        
        if (area >= 4) {
            // 4级区域以上的怪物有概率带有特殊效果
            const effectChance = Math.min(0.6, (area - 3) * 0.15); // 最高60%概率
            if (Math.random() < effectChance) {
                const possibleEffects = ['poison', 'fire', 'ice', 'lightning'];
                const effect = possibleEffects[Math.floor(Math.random() * possibleEffects.length)];
                effects.push(effect);
                elementType = effect; // 效果决定元素类型
            }
        }
        
        // 高区域怪物有更高概率获得元素属性
        if (!elementType && area >= 5 && Math.random() < 0.5) {
            const elements = ['fire', 'ice', 'lightning', 'poison'];
            elementType = elements[Math.floor(Math.random() * elements.length)];
        }
        
        return new Monster(monsterType.name, attack, defense, hp, expReward, goldReward, area, effects, elementType);
    }
    
    static createBoss(area, playerLevel) {
        // 生成BOSS怪物，大幅增强区域影响
        const areaMultiplier = 1 + (area - 1) * 0.3; // BOSS每个区域增加30%的基础强度
        const baseLevel = Math.floor(playerLevel * 1.5) + (area * 3); // BOSS区域权重更高
        
        // 根据区域选择合适的BOSS类型
        let bossTypes = [];
        if (area < 4) {
            bossTypes = [
                { name: '初级BOSS: 巨岩怪', attackMultiplier: 1.5, defenseMultiplier: 1.8, hpMultiplier: 3.0 },
                { name: '初级BOSS: 暗影术士', attackMultiplier: 2.0, defenseMultiplier: 1.0, hpMultiplier: 2.5 }
            ];
        } else if (area < 7) {
            bossTypes = [
                { name: '中级BOSS: 熔岩巨人', attackMultiplier: 1.8, defenseMultiplier: 2.0, hpMultiplier: 3.5 },
                { name: '中级BOSS: 白骨将军', attackMultiplier: 2.1, defenseMultiplier: 1.7, hpMultiplier: 3.2 },
                { name: '中级BOSS: 森林守护者', attackMultiplier: 1.9, defenseMultiplier: 2.2, hpMultiplier: 3.3 }
            ];
        } else {
            bossTypes = [
                { name: '高级BOSS: 地狱恶魔', attackMultiplier: 2.5, defenseMultiplier: 2.3, hpMultiplier: 4.0 },
                { name: '高级BOSS: 远古巨龙', attackMultiplier: 2.3, defenseMultiplier: 2.5, hpMultiplier: 4.5 },
                { name: '高级BOSS: 死亡骑士', attackMultiplier: 2.7, defenseMultiplier: 2.1, hpMultiplier: 3.8 },
                { name: '高级BOSS: 元素掌控者', attackMultiplier: 3.0, defenseMultiplier: 1.8, hpMultiplier: 3.5 }
            ];
        }
        
        const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        
        // 计算属性时应用区域乘数
        const attack = Math.floor(baseLevel * bossType.attackMultiplier * areaMultiplier);
        const defense = Math.floor(baseLevel * bossType.defenseMultiplier * areaMultiplier);
        const hp = Math.floor(baseLevel * bossType.hpMultiplier * 10 * areaMultiplier * 1.5); // BOSS血量额外增强
        
        // BOSS奖励更加丰厚
        const expReward = Math.floor(baseLevel * 20 * (1 + (area - 1) * 0.25));
        const goldReward = Math.floor(baseLevel * 15 * (1 + (area - 1) * 0.25));
        
        // BOSS必定带有特殊效果，且可能有多个效果
        const effects = [];
        const possibleEffects = ['poison', 'fire', 'ice', 'lightning'];
        
        // 至少有一个效果
        const effect1 = possibleEffects[Math.floor(Math.random() * possibleEffects.length)];
        effects.push(effect1);
        
        // BOSS必定有元素属性
        let elementType = effect1;
        
        // 高区域BOSS可能有两个效果
        if (area >= 5 && Math.random() < 0.5) {
            const remainingEffects = possibleEffects.filter(e => e !== effect1);
            if (remainingEffects.length > 0) {
                effects.push(remainingEffects[0]);
            }
        }
        
        return new Monster(bossType.name, attack, defense, hp, expReward, goldReward, area, effects, elementType);
    }
}

// 导出类
window.Monster = Monster;
window.MonsterFactory = MonsterFactory;