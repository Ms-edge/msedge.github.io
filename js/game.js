class Game {
    constructor() {
        // 确保player对象存在，如果window.player不存在则创建新的Character实例
        if (window.player) {
            this.player = window.player;
        } else {
            // 如果window.player不存在，创建一个新的Character实例
            this.player = new Character();
            window.player = this.player; // 同时设置到window对象中
        }
        this.battleLog = [];
        this.maxLogLength = 50;
        this.baseExpGain = 9999999999999999999999999999; // 基础经验获取量
        this.isAutoExploring = false; // 连续探索标志
        // 装备系统
        if (window.itemFactory && window.equipmentEnhancer && window.equipmentSynthesizer) {
            this.itemFactory = window.itemFactory;
            this.equipmentEnhancer = window.equipmentEnhancer;
            this.equipmentSynthesizer = window.equipmentSynthesizer;
        }
    }
    
    // 获取经验方法
        gainExperience() {
            if (!this.player.isAlive()) {
                this.addToBattleLog('你已经死亡！请治疗后再次获取经验。');
                return false;
            }
            
            // 随机触发遭遇怪物的概率事件
            // 基础概率20%，每升一个区域增加5%，最高50%
            const baseEncounterRate = 0.2;
            const areaBonus = Math.min(0.3, (this.player.currentArea - 1) * 0.05);
            const encounterRate = baseEncounterRate + areaBonus;
            
            // 商人遭遇概率 - 15%的基础概率，不受区域影响
            const merchantEncounterRate = 0.05;
            const isMerchantEncounter = Math.random() < merchantEncounterRate;
            
            // 宝箱遭遇概率 - 5%的基础概率，每升一个区域增加1%，最高15%
            const baseChestRate = 0.05;
            const chestAreaBonus = Math.min(0.10, (this.player.currentArea - 1) * 0.01);
            const chestEncounterRate = baseChestRate + chestAreaBonus;
            const isChestEncounter = !isMerchantEncounter && Math.random() < chestEncounterRate;
            
            // 10%概率遇到BOSS（如果触发了遭遇事件且不是商人或宝箱）
            const isBossEncounter = !isMerchantEncounter && !isChestEncounter && Math.random() < encounterRate && Math.random() < 0.1;
            const isMonsterEncounter = !isMerchantEncounter && !isChestEncounter && Math.random() < encounterRate && !isBossEncounter;
            
            // 获取经验和金币加成
            const expBonus = this.player.getExpBonus ? (1 + this.player.getExpBonus() / 100) : 1;
            const goldBonus = this.player.getGoldBonus ? (1 + this.player.getGoldBonus() / 100) : 1;
            
            if (isChestEncounter) {
                // 遭遇宝箱
                this.addToBattleLog('💎 你发现了一个宝箱！');
                this.openChest();
            } else if (isMerchantEncounter) {
                // 遭遇商人NPC
                this.addToBattleLog('👨‍💼 你遇到了一位神秘的商人！');
                this.addToBattleLog('商人："我这里有些特殊的丹药，你有兴趣购买吗？"');
                
                // 生成商人的商品（丹药）
                this.generateMerchantInventory();
            } else if (isMonsterEncounter || isBossEncounter) {
                // 遭遇怪物，进入战斗
                this.addToBattleLog(isBossEncounter ? '⚠️ 遭遇了BOSS怪物！' : '⚠️ 遭遇了怪物！');
                
                // 创建怪物
                const monster = isBossEncounter 
                    ? MonsterFactory.createBoss(this.player.currentArea, this.player.level)
                    : MonsterFactory.createMonster(this.player.currentArea, this.player.level);
                
                this.addToBattleLog(`你遇到了${isBossEncounter ? '强大的' : ''}${monster.name}！`);
                
                // 战斗过程
                const battleResult = this.fightMonster(monster);
            
            if (battleResult) {
                // 战斗胜利
                // 应用经验加成
                let expReward = monster.expReward;
                if (isBossEncounter) expReward *= 2; // BOSS有2倍经验
                expReward = Math.floor(expReward * expBonus);
                
                // 应用金币加成
                let goldReward = monster.goldReward;
                if (isBossEncounter) goldReward *= 100000; // BOSS有3倍金币
                goldReward = Math.floor(goldReward * goldBonus);
                
                const leveledUp = this.player.gainExp(expReward);
                this.player.gainGold(goldReward);
                
                // 更新任务进度
                if (this.player.updateQuestProgress) {
                    this.player.updateQuestProgress('killMonsters', 1);
                    this.player.updateQuestProgress('goldGain', goldReward);
                    
                    // 如果是BOSS战，更新BOSS击杀任务
                    if (isBossEncounter) {
                        this.player.updateQuestProgress('bossKilled', 1);
                    }
                }
                
                this.addToBattleLog(`战斗胜利！获得了 ${expReward} 经验和 ${goldReward} 金币！`);
                
                if (leveledUp) {
                    this.addToBattleLog(`🎉 升级了！当前等级：${this.player.level}`);
                    this.updateLevelUpUI();
                }
                
                // BOSS战胜利有更高概率获得物品
                const dropChance = isBossEncounter ? 0.7 : 0.3;
                if (Math.random() < dropChance) {
                    // 决定物品类型，BOSS战更可能掉落高级物品
                    const itemTypes = isBossEncounter ? 
                        ['weapon', 'armor', 'accessory', 'weapon', 'armor'] : 
                        ['weapon', 'armor', 'accessory'];
                    const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                    this._generateItemInternal(type);
                }
            } else {
                // 战斗失败
                this.addToBattleLog('战斗失败！你受伤了！');
                // 失败惩罚：损失部分金币
                const goldLoss = Math.floor(this.player.gold * 0.1);
                if (goldLoss > 0) {
                    this.player.spendGold(goldLoss);
                    this.addToBattleLog(`损失了 ${goldLoss} 金币！`);
                }
            }
        } else {
            // 没有遭遇怪物，正常获得经验
            // 根据当前区域和等级计算经验获取量
            const areaMultiplier = this.player.currentArea;
            const levelBonus = Math.floor(this.player.level * 0.5);
            const expGain = Math.floor(this.baseExpGain * areaMultiplier + levelBonus);
            
            // 随机波动（±10%）
            const variance = Math.random() * 0.2 + 0.9;
            let finalExpGain = Math.floor(expGain * variance);
            
            // 应用经验加成
            finalExpGain = Math.floor(finalExpGain * expBonus);
            
            // 应用经验
            const leveledUp = this.player.gainExp(finalExpGain);
            
            // 同时获得少量金币
            let goldGain = Math.floor(finalExpGain * 0.3);
            // 应用金币加成
            goldGain = Math.floor(goldGain * goldBonus);
            this.player.gainGold(goldGain);
            
            // 添加到战斗日志
            this.addToBattleLog(`你获得了 ${finalExpGain} 经验和 ${goldGain} 金币！`);
            
            // 检查是否升级
            if (leveledUp) {
                this.addToBattleLog(`🎉 升级了！当前等级：${this.player.level}`);
                this.updateLevelUpUI();
            }
            
            // 随机获得物品，掉落概率随区域增加而提高
            // 基础概率10%，每升一个区域增加2%，最高30%
            const baseDropRate = 0.1;
            const areaBonus = Math.min(0.2, (this.player.currentArea - 1) * 0.02);
            const dropRate = baseDropRate + areaBonus;
            
            if (Math.random() < dropRate) {
                const itemTypes = ['weapon', 'armor', 'accessory'];
                const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                this._generateItemInternal(type);
            }
        }
        
        // 更新UI
        this.updateBattleUI();
        
        return true;
    }
    
    // 连续探索方法
    autoExplore(times) {
        // 如果已经在自动探索中，不执行新的探索
        if (this.isAutoExploring) return;
        
        // 设置自动探索标志
        this.isAutoExploring = true;
        
        // 禁用所有按钮
        this.disableAllButtons();
        
        let remainingExplores = times;
        let exploreInterval;
        
        // 定义单次探索的函数
        const singleExplore = () => {
            // 检查玩家是否还活着
            if (!this.player.isAlive()) {
                this.addToBattleLog('探索停止！你已经死亡！');
                clearInterval(exploreInterval);
                this.finishAutoExplore();
                return;
            }
            
            // 执行一次探索
            this.gainExperience();
            remainingExplores--;
            
            // 检查是否完成了所有探索
            if (remainingExplores <= 0) {
                clearInterval(exploreInterval);
                this.addToBattleLog(`连续探索完成！共探索了${times}次。`);
                this.finishAutoExplore();
            }
        };
        
        // 立即执行第一次探索，然后设置间隔执行后续探索
        singleExplore();
        
        // 设置间隔执行剩余的探索，间隔200毫秒
        if (remainingExplores > 0) {
            exploreInterval = setInterval(singleExplore, 200);
        }
    }
    
    // 完成自动探索
    finishAutoExplore() {
        // 清除自动探索标志
        this.isAutoExploring = false;
        
        // 重新启用所有按钮
        this.enableAllButtons();
        
        // 更新UI
        this.updateBattleUI();
    }
    
    // 生成商人的商品（丹药）
    generateMerchantInventory() {
        // 生成3-5个丹药供玩家选择
        const numPotions = Math.floor(Math.random() * 3) + 3;
        const merchantPotions = [];
        
        // 丹药类型和效果
        const potionTypes = [
            {
                name: '经验丹',
                effect: 'exp',
                minEffect: 50,
                maxEffect: 200,
                basePrice: 100,
                description: '服用后立即获得经验值'
            },
            {
                name: '力量丹',
                effect: 'attack',
                minEffect: 1,
                maxEffect: 3,
                basePrice: 200,
                description: '永久增加攻击力'
            },
            {
                name: '防御丹',
                effect: 'defense',
                minEffect: 1,
                maxEffect: 3,
                basePrice: 200,
                description: '永久增加防御力'
            },
            {
                name: '生命丹',
                effect: 'maxHp',
                minEffect: 20,
                maxEffect: 50,
                basePrice: 150,
                description: '永久增加最大生命值'
            },
            {
                name: '回复丹',
                effect: 'heal',
                minEffect: 50,
                maxEffect: 100,
                basePrice: 50,
                description: '立即恢复生命值'
            }
        ];
        
        // 根据玩家等级调整价格和效果
        for (let i = 0; i < numPotions; i++) {
            const potionType = potionTypes[Math.floor(Math.random() * potionTypes.length)];
            const effectAmount = Math.floor(Math.random() * (potionType.maxEffect - potionType.minEffect + 1)) + potionType.minEffect;
            const levelMultiplier = 1 + (this.player.level - 1) * 0.1;
            const price = Math.floor(potionType.basePrice * levelMultiplier);
            
            merchantPotions.push({
                id: `merchant_potion_${i}`,
                name: potionType.name,
                effect: potionType.effect,
                effectAmount: effectAmount,
                price: price,
                description: `${potionType.description} (${effectAmount})`
            });
        }
        
        // 存储商人商品到游戏状态
        this.merchantInventory = merchantPotions;
        
        // 显示商人界面
        this.showMerchantUI();
    }
    
    // 显示商人UI
    showMerchantUI() {
        // 这里需要在UI中显示商人界面
        // 目前只添加日志，稍后需要更新UI
        this.addToBattleLog('商人的商品：');
        this.merchantInventory.forEach((potion, index) => {
            this.addToBattleLog(`${index + 1}. ${potion.name} - ${potion.description} (${potion.price}金币)`);
        });
        this.addToBattleLog('输入对应的数字购买，或按其他键离开。');
        
        // 简化实现：自动给玩家一个回复丹
        // 实际实现应该通过UI交互
        const freePotion = this.merchantInventory.find(p => p.effect === 'heal');
        if (freePotion) {
            this.player.heal(freePotion.effectAmount);
            this.addToBattleLog(`商人赠送了你一颗${freePotion.name}！你恢复了${freePotion.effectAmount}点生命值。`);
        }
    }
    
    // 禁用所有按钮
    disableAllButtons() {
        // 更新UI按钮状态
        if (window.uiManager && window.uiManager.updateButtonStates) {
            window.uiManager.updateButtonStates();
        }
    }
    
    // 启用所有按钮
    enableAllButtons() {
        // 更新UI按钮状态
        if (window.uiManager && window.uiManager.updateButtonStates) {
            window.uiManager.updateButtonStates();
        }
    }
    
    // 战斗方法
    fightMonster(monster) {
        let round = 1;
        
        // 战斗循环，直到一方死亡
        while (this.player.isAlive() && monster.isAlive()) {
            this.addToBattleLog(`--- 第 ${round} 回合 ---`);
            
            // 玩家攻击
            let playerAttack = this.player.getTotalAttack();
            
            // 检查暴击
            const critRate = this.player.getTotalCritRate ? this.player.getTotalCritRate() : 0;
            const isCritical = Math.random() < critRate / 100;
            if (isCritical) {
                playerAttack = Math.floor(playerAttack * 100.5); // 暴击造成1.5倍伤害
                this.addToBattleLog('🔥 暴击！');
            }
            
            // 应用元素相克
            const damageToMonster = monster.takeDamage(playerAttack);
            this.addToBattleLog(`你对${monster.name}造成了 ${damageToMonster} 点伤害！${isCritical ? '（暴击！）' : ''}`);
            
            // 应用武器特殊效果
            if (this.player.equipment && this.player.equipment.weapon && this.player.equipment.weapon.specialEffect) {
                const weapon = this.player.equipment.weapon;
                let effectText = '';
                
                if (Array.isArray(weapon.specialEffect)) {
                    weapon.specialEffect.forEach(effect => {
                        switch(effect) {
                            case 'poison':
                                const poisonDamage = Math.floor(damageToMonster * 0.15); // 15%额外毒素伤害
                                monster.takeDamage(poisonDamage);
                                effectText += ` 毒素造成${poisonDamage}点伤害!`;
                                break;
                            case 'fire':
                                const fireDamage = Math.floor(damageToMonster * 0.20); // 20%额外火焰伤害
                                monster.takeDamage(fireDamage);
                                effectText += ` 火焰造成${fireDamage}点伤害!`;
                                break;
                            case 'ice':
                                const iceChance = 20; // 20%几率冰冻
                                if (Math.random() * 100 < iceChance) {
                                    effectText += ` 冰冻效果触发!`;
                                }
                                break;
                            case 'lightning':
                                const lightningChance = 15; // 15%几率额外连击
                                if (Math.random() * 100 < lightningChance) {
                                    effectText += ` 闪电连击!`;
                                    const lightningDamage = Math.floor(damageToMonster * 0.5);
                                    monster.takeDamage(lightningDamage);
                                    effectText += ` 额外造成${lightningDamage}点伤害!`;
                                }
                                break;
                            case 'bleed':
                                const bleedDamage = Math.floor(damageToMonster * 0.12); // 12%额外流血伤害
                                monster.takeDamage(bleedDamage);
                                effectText += ` 流血造成${bleedDamage}点伤害!`;
                                break;
                        }
                    });
                    
                    if (effectText) {
                        this.addToBattleLog(effectText.trim());
                    }
                }
            }
            
            // 应用生命偷取
            const lifeSteal = this.player.getTotalLifeSteal ? this.player.getTotalLifeSteal() : 0;
            if (lifeSteal > 0 && damageToMonster > 0) {
                const stolenLife = Math.floor(damageToMonster * (lifeSteal / 100));
                if (this.player.heal) {
                    this.player.heal(stolenLife);
                    this.addToBattleLog(`生命偷取恢复了${stolenLife}点生命值！`);
                }
            }
            
            // 检查怪物是否死亡
            if (!monster.isAlive()) {
                this.addToBattleLog(`${monster.name}被击败了！`);
                break;
            }
            
            // 怪物反击
            // 检查闪避
            const dodgeRate = this.player.getTotalDodgeRate ? this.player.getTotalDodgeRate() : 0;
            const isDodged = Math.random() < dodgeRate / 100;
            
            if (isDodged) {
                this.addToBattleLog('✨ 你闪避了攻击！');
            } else {
                // 获取怪物攻击，支持新的返回格式（包含damage和effectText）
                let attackResult = typeof monster.attackPlayer === 'function' 
                    ? monster.attackPlayer(this.player) 
                    : { damage: 0, effectText: '' };
                
                // 处理可能的不同返回格式
                let monsterDamage;
                let effectText = '';
                
                if (typeof attackResult === 'object' && attackResult !== null) {
                    monsterDamage = attackResult.damage || 0;
                    effectText = attackResult.effectText || '';
                } else {
                    monsterDamage = attackResult;
                }
                
                // 应用伤害减免
                const damageReduction = this.player.getTotalDamageReduction ? this.player.getTotalDamageReduction() : 0;
                if (damageReduction > 0) {
                    monsterDamage = Math.floor(monsterDamage * (1 - (damageReduction / 100)));
                    monsterDamage = Math.max(1, monsterDamage); // 确保至少造成1点伤害
                }
                
                // 应用元素抗性（针对元素类型的怪物）
                if (monster.elementType && this.player.getResistance) {
                    const resistance = this.player.getResistance(monster.elementType);
                    if (resistance > 0) {
                        monsterDamage = Math.floor(monsterDamage * (1 - resistance / 100));
                        monsterDamage = Math.max(1, monsterDamage);
                        this.addToBattleLog(`${monster.elementType}元素抗性减少了伤害！`);
                    }
                }
                
                // 应用抗性（针对特殊效果和元素伤害）
                if (monster.effects) {
                    if (monster.effects.includes('poison') && this.player.getTotalPoisonRes) {
                        const poisonResistance = this.player.getTotalPoisonRes();
                        // 降低毒素效果的额外伤害
                        effectText = effectText.replace(/\[中毒!额外(\d+)点伤害\]/g, (match, damageStr) => {
                            const originalDamage = parseInt(damageStr);
                            const reducedDamage = Math.floor(originalDamage * (1 - poisonResistance / 100));
                            return `[中毒!额外${reducedDamage}点伤害]`;
                        });
                    } else if (monster.effects.includes('fire') && this.player.getTotalFireRes) {
                        const fireResistance = this.player.getTotalFireRes();
                        // 降低火焰效果的额外伤害
                        effectText = effectText.replace(/\[燃烧!额外(\d+)点伤害\]/g, (match, damageStr) => {
                            const originalDamage = parseInt(damageStr);
                            const reducedDamage = Math.floor(originalDamage * (1 - fireResistance / 100));
                            return `[燃烧!额外${reducedDamage}点伤害]`;
                        });
                    }
                    // 添加闪电抗性支持
                    if (monster.effects.includes('lightning') && this.player.getTotalLightningRes) {
                        const lightningResistance = this.player.getTotalLightningRes();
                        effectText = effectText.replace(/\[闪电!额外(\d+)点伤害\]/g, (match, damageStr) => {
                            const originalDamage = parseInt(damageStr);
                            const reducedDamage = Math.floor(originalDamage * (1 - lightningResistance / 100));
                            return `[闪电!额外${reducedDamage}点伤害]`;
                        });
                    }
                    // 添加冰霜抗性支持
                    if (monster.effects.includes('ice') && this.player.getTotalIceRes) {
                        const iceResistance = this.player.getTotalIceRes();
                        effectText = effectText.replace(/\[冰冻!额外(\d+)点伤害\]/g, (match, damageStr) => {
                            const originalDamage = parseInt(damageStr);
                            const reducedDamage = Math.floor(originalDamage * (1 - iceResistance / 100));
                            return `[冰冻!额外${reducedDamage}点伤害]`;
                        });
                    }
                }
                
                // 添加战斗日志，包含效果文本（如果有）
                let battleLogText = `${monster.name}对你造成了 ${monsterDamage} 点伤害！`;
                if (effectText) {
                    battleLogText += ' ' + effectText;
                }
                this.addToBattleLog(battleLogText);
            }
            
            // 检查玩家是否死亡
            if (!this.player.isAlive()) {
                this.addToBattleLog('你被击败了！');
                break;
            }
            
            round++;
        }
        
        // 返回战斗是否胜利
        return this.player.isAlive();
    }
    
    // 生成物品方法
    generateItem() {
        const itemTypes = ['weapon', 'armor', 'accessory'];
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        return this._generateItemInternal(type);
    }
    
    // 内部物品生成方法
    _generateItemInternal(type) {
        // 如果没有指定类型，随机选择一个
        if (!type) {
            const itemTypes = ['weapon', 'armor', 'accessory'];
            type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        }
        // 计算稀有度
        const rarityRoll = Math.random();
        const areaBonus = Math.min(0.2, (this.player.currentArea - 1) * 0.02);
        
        let rarity = 'common';
        if (rarityRoll < 0.05 + areaBonus * 0.5) rarity = 'legendary';
        else if (rarityRoll < 0.2 + areaBonus * 2) rarity = 'epic';
        else if (rarityRoll < 0.4 + areaBonus * 3) rarity = 'rare';
        else if (rarityRoll < 0.7 + areaBonus * 2) rarity = 'uncommon';
        
        // 基础属性计算
        const baseLevelFactor = this.player.level * 2;
        const areaFactor = Math.max(1, this.player.currentArea * 0.3);
        let baseValue = Math.floor(baseLevelFactor * areaFactor);
        
        // 根据稀有度调整基础值
        switch(rarity) {
            case 'legendary': baseValue *= 3; break;
            case 'epic': baseValue *= 2.5; break;
            case 'rare': baseValue *= 2; break;
            case 'uncommon': baseValue *= 1.5; break;
        }
        
        // 初始化装备属性
        const stats = {
            attack: 0,
            defense: 0,
            maxHp: 0,
            critRate: 0,
            dodgeRate: 0,
            poisonRes: 0,
            fireRes: 0,
            iceRes: 0,
            expBonus: 0,
            goldBonus: 0
        };
        
        // 获取装备名称
        const name = this.generateItemName(type, rarity);
        
        // 根据装备类型和稀有度分配基础属性
        this.assignEquipmentStats(type, rarity, baseValue, stats);
        
        // 生成额外随机属性
        this.addRandomProperties(rarity, stats);
        
        // 计算售价
        const sellPrice = this.calculateSellPrice(baseValue, rarity, stats);
        
        const loot = {
                    name: name,
                    type: type,
                    attack: stats.attack,
                    defense: stats.defense,
                    maxHp: stats.maxHp,
                    critRate: stats.critRate,
                    dodgeRate: stats.dodgeRate,
                    强化等级: 0,
                    poisonRes: stats.poisonRes,
                    fireRes: stats.fireRes,
                    iceRes: stats.iceRes,
            expBonus: stats.expBonus,
            goldBonus: stats.goldBonus,
            rarity: rarity,
            sellPrice: sellPrice
        };
        
        const addResult = this.player.addToInventory(loot);
        
        if (addResult) {
            this.addToBattleLog(`💎 获得了 ${loot.name}！`);
        } else {
            this.addToBattleLog(`💎 获得了 ${loot.name}！（背包已满，已替换最早的物品）`);
        }
        
        this.updateInventoryUI();
    }
    
    // 生成物品名称
    generateItemName(type, rarity) {
        // 属性偏向名称列表 - 扩充装备名称
        const weaponNames = {
            legendary: ['屠龙剑', '灭世刀', '破天枪', '混沌战斧', '极光剑', '星辰之剑', '命运裁决', '末日使者', '天神之怒', '虚空之刃', '王者之剑', '审判之剑', '创世之斧', '毁灭之刃'],
            epic: ['火焰剑', '寒冰刃', '闪电枪', '毒牙匕首', '熔岩法杖', '风暴之弓', '黑暗镰刀', '光明法杖', '雷霆战斧', '毒龙匕首', '星辰法杖', '火焰双刀', '水晶之剑', '飓风之弓', '地裂战锤', '深海三叉戟'],
            rare: ['锋利长剑', '坚固战锤', '快速匕首', '精确弓箭', '强力法杖', '精钢大剑', '迅捷短剑', '重型战斧', '精准法杖', '狩猎之弓', '战斗法杖', '刺杀匕首', '锯齿刀', '穿透之箭', '火焰匕首', '冰霜法杖'],
            uncommon: ['精铁剑', '硬木杖', '青铜匕首', '钢枪', '石斧', '铁剑', '铜锤', '银匕首', '木弓', '石杖', '钢刀', '骨剑', '铁镐', '铜剑', '木杖', '皮弓'],
            common: ['木剑', '石刀', '铁剑', '铜匕首', '短棍', '树枝', '小刀', '铁匕首', '木棒', '石剑', '铜剑', '短刀', '木斧', '石镐', '骨棒', '竹剑']
        };
        
        const armorNames = {
            legendary: ['龙鳞甲', '神圣守护', '暗影护甲', '光明之盾', '泰坦战甲', '星辰战衣', '永恒守护者', '末日壁垒', '天神铠甲', '虚空护甲', '命运战衣', '创世铠甲', '审判护肩', '灵魂护盾'],
            epic: ['火焰护甲', '寒冰护甲', '闪电护甲', '毒抗护甲', '熔岩护甲', '风暴护盾', '黑暗斗篷', '光明法袍', '雷霆铠甲', '毒龙护甲', '星辰法衣', '火焰战衣', '水晶护甲', '飓风斗篷', '地裂战铠', '深海护甲'],
            rare: ['坚固铁甲', '轻便皮甲', '魔法长袍', '链甲', '板甲', '精钢铠甲', '迅捷皮甲', '重型板甲', '魔法布袍', '狩猎皮甲', '战斗铠甲', '刺杀护甲', '硬化皮甲', '秘银锁子甲', '符文布袍', '荆棘护甲'],
            uncommon: ['布甲', '皮甲', '铁甲', '鳞甲', '藤甲', '铁铠', '皮衣', '铜甲', '布袍', '皮铠', '铁甲', '骨甲', '硬皮甲', '青铜胸甲', '亚麻长袍', '皮革护甲'],
            common: ['粗布衣服', '皮革护甲', '铁片护甲', '布袍', '皮裙', '布衣', '皮衣', '铁片衣', '粗布袍', '皮甲', '布甲', '皮衣', '破布衫', '简易护甲', '麻布衣', '兽皮护甲']
        };
        
        const accessoryNames = {
            legendary: ['命运护符', '永恒指环', '生命宝石', '力量徽章', '智慧吊坠', '星辰印记', '末日护符', '天神之泪', '虚空指环', '时光吊坠', '创世之戒', '审判徽章', '灵魂项链', '宇宙护符'],
            epic: ['火焰项链', '寒冰戒指', '闪电护符', '毒抗手镯', '熔岩耳环', '风暴护符', '黑暗指环', '光明吊坠', '雷霆手镯', '毒龙耳环', '星辰护符', '火焰指环', '水晶吊坠', '飓风护符', '地裂手镯', '深海耳环'],
            rare: ['幸运项链', '守护戒指', '力量护符', '敏捷手环', '智慧吊坠', '精钢项链', '迅捷指环', '力量手环', '智慧护符', '幸运戒指', '守护护符', '敏捷吊坠', '符文戒指', '魔法护符', '勇气徽章', '守护项链'],
            uncommon: ['铜项链', '铁戒指', '木护符', '布手环', '皮吊坠', '银项链', '铜戒指', '铁护符', '皮手环', '布吊坠', '木戒指', '铜护符', '骨项链', '石戒指', '贝壳护符', '皮革手环'],
            common: ['玻璃珠', '铁环', '石头项链', '布手环', '木吊坠', '石珠', '铜环', '木项链', '布环', '石吊坠', '铁珠', '布项链', '陶珠', '草绳', '木珠', '石子']
        };
        
        const nameLists = {
            weapon: weaponNames,
            armor: armorNames,
            accessory: accessoryNames
        };
        
        // 获取基础名称
        const nameList = nameLists[type][rarity];
        const baseName = nameList[Math.floor(Math.random() * nameList.length)];
        
        // 传奇装备特殊前缀
        if (rarity === 'legendary') {
            const specialPrefixes = ['神圣', '远古', '永恒', '虚空', '星辰', '命运', '末日', '天神'];
            const specialPrefix = specialPrefixes[Math.floor(Math.random() * specialPrefixes.length)];
            return `${specialPrefix}${baseName}`;
        }
        
        // 其他稀有度的前缀
        let rarityPrefix = '';
        switch(rarity) {
            case 'epic': rarityPrefix = '史诗'; break;
            case 'rare': rarityPrefix = '稀有'; break;
            case 'uncommon': rarityPrefix = '优秀'; break;
            default: rarityPrefix = '';
        }
        
        return rarityPrefix ? `${rarityPrefix}的${baseName}` : baseName;
    }
    
    // 分配装备基础属性
    assignEquipmentStats(type, rarity, baseValue, stats) {
        // 根据稀有度调整属性倍率
        const rarityMultipliers = {
            legendary: 2.5,
            epic: 1.8,
            rare: 1.4,
            uncommon: 1.2,
            common: 1.0
        };
        
        const multiplier = rarityMultipliers[rarity];
        const adjustedBaseValue = baseValue * multiplier;
        
        // 添加特殊效果属性
        if (!stats.specialEffect) stats.specialEffect = [];
        if (!stats.specialName) stats.specialName = '';
        
        switch(type) {
            case 'weapon':
                stats.attack = Math.floor(adjustedBaseValue * 1.5);
                stats.critRate = rarity === 'legendary' ? Math.floor(Math.random() * 5 + 8) : 
                               rarity === 'epic' ? Math.floor(Math.random() * 4 + 5) : 
                               rarity === 'rare' ? Math.floor(Math.random() * 3 + 3) : 0;
                
                // 武器特殊效果系统
                if (rarity !== 'common') {
                    const effects = [
                        { type: 'poison', name: '毒素伤害' },
                        { type: 'fire', name: '燃烧伤害' },
                        { type: 'ice', name: '冰霜效果' },
                        { type: 'lightning', name: '闪电效果' },
                        { type: 'bleed', name: '流血伤害' }
                    ];
                    
                    // 传奇武器可以有两种效果
                    const effectCount = rarity === 'legendary' ? 2 : 1;
                    const assignedEffects = [];
                    
                    for (let i = 0; i < effectCount; i++) {
                        const availableEffects = effects.filter(e => !assignedEffects.some(ae => ae.type === e.type));
                        const effect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
                        assignedEffects.push(effect);
                    }
                    
                    stats.specialEffect = assignedEffects.map(e => e.type);
                    stats.specialName = assignedEffects.map(e => e.name).join(' 与 ');
                }
                
                // 高级武器可能有额外属性
                if (rarity === 'epic' || rarity === 'legendary') {
                    const extraEffects = ['dodgeRate', 'expBonus', 'goldBonus'];
                    const extraEffect = extraEffects[Math.floor(Math.random() * extraEffects.length)];
                    if (extraEffect === 'dodgeRate') {
                        stats.dodgeRate = Math.floor(Math.random() * 3 + 1);
                    } else if (extraEffect === 'expBonus') {
                        stats.expBonus = Math.floor(Math.random() * 5 + 2);
                    } else if (extraEffect === 'goldBonus') {
                        stats.goldBonus = Math.floor(Math.random() * 5 + 2);
                    }
                }
                break;
            case 'armor':
                stats.defense = Math.floor(adjustedBaseValue * 1.1);
                stats.maxHp = Math.floor(adjustedBaseValue * 5.5);
                
                // 护甲抗性系统
                if (rarity !== 'common') {
                    const resists = [
                        { type: 'poisonRes', name: '毒素抗性' },
                        { type: 'fireRes', name: '火焰抗性' },
                        { type: 'iceRes', name: '冰霜抗性' },
                        { type: 'lightningRes', name: '闪电抗性' },
                        { type: 'dodgeRate', name: '闪避提升' }
                    ];
                    
                    // 抗性数量随稀有度增加
                    const resistCount = rarity === 'legendary' ? 3 : rarity === 'epic' ? 2 : 1;
                    const assignedResists = [];
                    
                    for (let i = 0; i < resistCount; i++) {
                        const availableResists = resists.filter(r => !assignedResists.some(ar => ar.type === r.type));
                        const resist = availableResists[Math.floor(Math.random() * availableResists.length)];
                        
                        // 根据稀有度确定抗性值
                        const baseRes = rarity === 'legendary' ? 15 : rarity === 'epic' ? 12 : 8;
                        const resVariance = rarity === 'legendary' ? 10 : rarity === 'epic' ? 8 : 5;
                        stats[resist.type] = Math.floor(baseRes + Math.random() * resVariance);
                        assignedResists.push(resist);
                    }
                    
                    stats.specialEffect = assignedResists.map(r => r.type);
                    stats.specialName = assignedResists.map(r => r.name).join('、');
                }
                
                // 高级护甲固定有闪避率
                if (rarity === 'epic' || rarity === 'legendary') {
                    stats.dodgeRate = Math.floor(Math.random() * 5 + 1);
                }
                break;
            case 'accessory':
                stats.attack = Math.floor(adjustedBaseValue * 0.6);
                stats.defense = Math.floor(adjustedBaseValue * 0.6);
                stats.maxHp = Math.floor(adjustedBaseValue * 4);
                
                // 饰品特殊效果系统
                const effectCount = rarity === 'legendary' ? 3 : rarity === 'epic' ? 2 : 1;
                const effects = [
                    { type: 'expBonus', name: '经验增幅', min: rarity === 'legendary' ? 12 : rarity === 'epic' ? 8 : rarity === 'rare' ? 5 : 3, max: rarity === 'legendary' ? 20 : rarity === 'epic' ? 15 : rarity === 'rare' ? 10 : 6 },
                    { type: 'goldBonus', name: '金币增幅', min: rarity === 'legendary' ? 12 : rarity === 'epic' ? 8 : rarity === 'rare' ? 5 : 3, max: rarity === 'legendary' ? 20 : rarity === 'epic' ? 15 : rarity === 'rare' ? 10 : 6 },
                    { type: 'dodgeRate', name: '闪避提升', min: rarity === 'legendary' ? 5 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1, max: rarity === 'legendary' ? 8 : rarity === 'epic' ? 6 : rarity === 'rare' ? 4 : 3 },
                    { type: 'critRate', name: '暴击提升', min: rarity === 'legendary' ? 5 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1, max: rarity === 'legendary' ? 8 : rarity === 'epic' ? 6 : rarity === 'rare' ? 4 : 3 },
                    { type: 'poisonRes', name: '毒素抗性', min: rarity === 'legendary' ? 15 : rarity === 'epic' ? 10 : rarity === 'rare' ? 6 : 3, max: rarity === 'legendary' ? 25 : rarity === 'epic' ? 20 : rarity === 'rare' ? 15 : 10 },
                    { type: 'fireRes', name: '火焰抗性', min: rarity === 'legendary' ? 15 : rarity === 'epic' ? 10 : rarity === 'rare' ? 6 : 3, max: rarity === 'legendary' ? 25 : rarity === 'epic' ? 20 : rarity === 'rare' ? 15 : 10 },
                    { type: 'iceRes', name: '冰霜抗性', min: rarity === 'legendary' ? 15 : rarity === 'epic' ? 10 : rarity === 'rare' ? 6 : 3, max: rarity === 'legendary' ? 25 : rarity === 'epic' ? 20 : rarity === 'rare' ? 15 : 10 }
                ];
                
                const assignedEffects = [];
                
                for (let i = 0; i < effectCount; i++) {
                    const availableEffects = effects.filter(e => !assignedEffects.some(ae => ae.type === e.type));
                    const effect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
                    stats[effect.type] = Math.floor(Math.random() * (effect.max - effect.min + 1) + effect.min);
                    assignedEffects.push(effect);
                }
                
                stats.specialEffect = assignedEffects.map(e => e.type);
                stats.specialName = assignedEffects.map(e => e.name).join(' 与 ');
                break;
        }
    }
    
    // 添加随机属性
    addRandomProperties(rarity, stats) {
        if (rarity === 'common') return;
        
        // 根据稀有度确定额外属性数量和强度
        const raritySettings = {
            legendary: { minProps: 2, maxProps: 4, strength: 1.5 },
            epic: { minProps: 2, maxProps: 3, strength: 1.3 },
            rare: { minProps: 1, maxProps: 2, strength: 1.1 },
            uncommon: { minProps: 1, maxProps: 1, strength: 1.0 }
        };
        
        const settings = raritySettings[rarity];
        const extraStats = Math.floor(Math.random() * (settings.maxProps - settings.minProps + 1)) + settings.minProps;
        
        // 已添加的属性，避免重复添加相同类型
        const addedStats = new Set();
        
        for (let i = 0; i < extraStats; i++) {
            // 优先选择还没有的属性
            const statTypes = ['attack', 'defense', 'maxHp', 'critRate', 'dodgeRate', 'poisonRes', 'fireRes', 'iceRes', 'expBonus', 'goldBonus'];
            const availableStats = statTypes.filter(stat => !addedStats.has(stat));
            
            // 如果所有属性都已添加，则允许重复
            const stat = availableStats.length > 0 ? 
                availableStats[Math.floor(Math.random() * availableStats.length)] : 
                statTypes[Math.floor(Math.random() * statTypes.length)];
            
            addedStats.add(stat);
            
            // 根据稀有度和设置调整属性增加值
            switch(stat) {
                case 'attack': 
                    stats.attack += Math.floor((Math.random() * 4 + 2) * settings.strength); 
                    break;
                case 'defense': 
                    stats.defense += Math.floor((Math.random() * 4 + 2) * settings.strength); 
                    break;
                case 'maxHp': 
                    stats.maxHp += Math.floor((Math.random() * 15 + 8) * settings.strength); 
                    break;
                case 'critRate': 
                    if (stats.critRate < 25) { // 提高上限，使传奇装备能有更高暴击
                        stats.critRate += Math.floor((Math.random() * 3 + 1) * settings.strength); 
                    }
                    break;
                case 'dodgeRate': 
                    if (stats.dodgeRate < 20) { // 提高上限
                        stats.dodgeRate += Math.floor((Math.random() * 3 + 1) * settings.strength); 
                    }
                    break;
                case 'poisonRes': 
                case 'fireRes': 
                case 'iceRes': 
                    if (stats[stat] < 40) { // 提高上限
                        stats[stat] += Math.floor((Math.random() * 5 + 3) * settings.strength);
                    }
                    break;
                case 'expBonus': 
                case 'goldBonus': 
                    if (stats[stat] < 30) { // 提高上限
                        stats[stat] += Math.floor((Math.random() * 5 + 3) * settings.strength);
                    }
                    break;
            }
        }
        
        // 为传奇装备添加特殊称号前缀
        if (rarity === 'legendary') {
            const specialPrefixes = ['神圣', '远古', '永恒', '虚空', '星辰', '命运', '末日', '天神'];
            const prefix = specialPrefixes[Math.floor(Math.random() * specialPrefixes.length)];
            // 注意：这里只是定义前缀，实际名称修改需要在生成物品时处理
        }
    }
    
    // 计算物品售价
    calculateSellPrice(baseValue, rarity, stats) {
        let price = Math.floor(baseValue * 10);
        
        // 根据稀有度调整价格
        const rarityMultiplier = {
            legendary: 5,
            epic: 3,
            rare: 2,
            uncommon: 1.5,
            common: 1
        };
        
        price = Math.floor(price * rarityMultiplier[rarity]);
        
        // 根据属性附加值调整价格
        const statValues = {
            attack: stats.attack * 2,
            defense: stats.defense * 2,
            maxHp: Math.floor(stats.maxHp / 5),
            critRate: stats.critRate * 10,
            dodgeRate: stats.dodgeRate * 10,
            poisonRes: stats.poisonRes * 5,
            fireRes: stats.fireRes * 5,
            iceRes: stats.iceRes * 5,
            expBonus: stats.expBonus * 8,
            goldBonus: stats.goldBonus * 8
        };
        
        // 添加所有属性价值
        Object.values(statValues).forEach(value => {
            price += value;
        });
        
        return Math.floor(price);
    }
    

    
    // 增加战斗日志
    addToBattleLog(message) {
        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.battleLog.push(`[${timestamp}] ${message}`);
        
        // 限制日志长度
        if (this.battleLog.length > this.maxLogLength) {
            this.battleLog.shift();
        }
        
        // 更新UI，使用全局的uiManager对象
        if (window.uiManager && typeof window.uiManager.updateBattleLogUI === 'function') {
            window.uiManager.updateBattleLogUI();
        }
    }
    
    // 清空战斗日志
    clearBattleLog() {
        this.battleLog = [];
        // 更新UI，使用全局的uiManager对象
        if (window.uiManager && typeof window.uiManager.updateBattleLogUI === 'function') {
            window.uiManager.updateBattleLogUI();
        }
    }
    
    // 购买治疗
    buyHeal() {
        if (this.player.buyHeal()) {
            this.addToBattleLog('你使用了治疗药水，生命值已满！');
            // 使用全局的uiManager更新UI
            if (window.uiManager && typeof window.uiManager.updateBattleUI === 'function') {
                window.uiManager.updateBattleUI();
            }
            return true;
        }
        this.addToBattleLog('金币不足，无法治疗！');
        return false;
    }
    
    // 升级攻击力
    upgradeAttack() {
        if (this.player.upgradeAttack()) {
            this.addToBattleLog(`攻击力提升到 ${this.player.attack}！`);
            // 使用全局的uiManager更新UI
            if (window.uiManager && typeof window.uiManager.updateBattleUI === 'function') {
                window.uiManager.updateBattleUI();
            }
            return true;
        }
        this.addToBattleLog('金币不足，无法提升攻击力！');
        return false;
    }
    
    // 升级防御力
    upgradeDefense() {
        if (this.player.upgradeDefense()) {
            this.addToBattleLog(`防御力提升到 ${this.player.defense}！`);
            // 使用全局的uiManager更新UI
            if (window.uiManager && typeof window.uiManager.updateBattleUI === 'function') {
                window.uiManager.updateBattleUI();
            }
            return true;
        }
        this.addToBattleLog('金币不足，无法提升防御力！');
        return false;
    }
    
    // 进入下一区域
    enterNextArea() {
        if (!this.player.isAlive()) {
            this.addToBattleLog('你现在无法移动到下一区域。');
            return false;
        }
        
        // 检查是否已击败当前区域的BOSS
        const hasDefeatedBoss = this.player.defeatedBosses && this.player.defeatedBosses[this.player.currentArea];
        
        if (!hasDefeatedBoss) {
            this.addToBattleLog('你必须先击败当前区域的BOSS才能进入下一区域！');
            // 触发BOSS战斗
            this.triggerBossBattle();
            return false;
        }
        
        // 执行原有的nextArea逻辑
        if (this.player.nextArea()) {
            this.addToBattleLog(`进入了区域 ${this.player.currentArea}！经验获取速度提升了！`);
            // 使用全局的uiManager更新UI
            if (window.uiManager && typeof window.uiManager.updateBattleUI === 'function') {
                window.uiManager.updateBattleUI();
            }
            return true;
        }
        this.addToBattleLog(`需要达到等级 ${this.player.currentArea * 3} 才能进入下一区域！`);
        return false;
    }
    
    // 触发BOSS战斗
    triggerBossBattle() {
        // 创建区域BOSS
        const boss = this.createAreaBoss();
        this.addToBattleLog(`⚠️ ${boss.name}出现了！这是第${this.player.currentArea}区域的守护者！`);
        
        // 战斗
        const battleResult = this.fightMonster(boss);
        
        if (battleResult) {
            this.addToBattleLog(`🏆 恭喜！你击败了${boss.name}，成为了第${this.player.currentArea}区域的征服者！`);
            
            // 记录BOSS已被击败
            if (!this.player.defeatedBosses) {
                this.player.defeatedBosses = {};
            }
            this.player.defeatedBosses[this.player.currentArea] = true;
            
            // 给予丰厚的BOSS奖励
            this.awardBossLoot(boss);
            
            // 提示可以进入下一区域
            this.addToBattleLog(`你现在可以进入第${this.player.currentArea + 1}区域了。`);
        } else {
            this.addToBattleLog(`你被${boss.name}击败了！请重新挑战。`);
        }
    }
    
    // 创建区域BOSS
    createAreaBoss() {
        // 基于当前区域和玩家等级创建强大的BOSS
        const area = this.player.currentArea;
        const playerLevel = this.player.level;
        
        // BOSS基础属性 - 比普通怪物强得多
        const baseHp = area * 300 + playerLevel * 50;
        const baseAttack = area * 25 + playerLevel * 8;
        const baseDefense = area * 15 + playerLevel * 4;
        
        // BOSS名称和类型
        const bossTypes = [
            '远古巨像', '熔岩守护者', '暗影猎手', '深海领主', 
            '风暴使者', '死亡骑士', '恐惧之王', '元素主宰'
        ];
        const bossTypeIndex = (area - 1) % bossTypes.length;
        const bossName = `${bossTypes[bossTypeIndex]} (区域${area} BOSS)`;
        
        return {
            name: bossName,
            hp: Math.floor(baseHp * 2), // BOSS血量翻倍
            maxHp: Math.floor(baseHp * 2),
            attack: Math.floor(baseAttack * 1.5),
            defense: Math.floor(baseDefense * 1.5),
            expReward: Math.floor(area * 1000 + playerLevel * 200),
            goldReward: Math.floor(area * 1000 + playerLevel * 100),
            isBoss: true,
            isAlive: function() { return this.hp > 0; },
            takeDamage: function(amount) {
                const damage = Math.max(1, amount - this.defense);
                this.hp -= damage;
                return damage;
            },
            attackPlayer: function(player) {
                // BOSS有几率造成双倍伤害
                let damage = Math.max(1, this.attack - player.getTotalDefense());
                const criticalChance = 0.2; // BOSS 20%暴击率
                
                if (Math.random() < criticalChance) {
                    damage *= 2;
                    return { damage: damage, effectText: 'BOSS暴击！' };
                }
                
                return { damage: damage, effectText: '' };
            }
        };
    }
    
    // 奖励BOSS战利品
    awardBossLoot(boss) {
        this.addToBattleLog('💰 BOSS掉落了丰厚的奖励！');
        
        // 获得经验和金币
        this.player.gainExperience(boss.expReward);
        this.player.gainGold(boss.goldReward);
        this.addToBattleLog(`你获得了 ${boss.expReward} 经验值和 ${boss.goldReward} 金币！`);
        
        // 掉落高品质装备
        const itemTypes = ['weapon', 'armor', 'accessory'];
        
        // 必掉一件传奇装备
        const legendaryItem = this.generateGuaranteedRarityItem('legendary');
        
        // 有可能掉落第二件装备
        if (Math.random() < 0.7) {
            this.generateItem();
        }
    }
    
    // 保存游戏
    saveGame() {
        this.player.save();
        this.addToBattleLog('游戏已保存！');
    }
    
    // 加载游戏
    loadGame() {
        if (this.player.load()) {
            this.addToBattleLog('游戏已加载！');
            this.updateBattleUI();
            this.updateInventoryUI();
            return true;
        }
        this.addToBattleLog('没有找到存档文件！');
        return false;
    }
    
    // 更新战斗UI
    updateBattleUI() {
        // 这个方法会在ui.js中被实现
        if (window.updateBattleUI) {
            window.updateBattleUI();
        }
    }
    

    
    // 更新战斗日志UI
    updateBattleLogUI() {
        if (window.updateBattleLogUI) {
            window.updateBattleLogUI();
        }
    }
    
    // 更新等级提升UI
    updateLevelUpUI() {
        if (window.updateLevelUpUI) {
            window.updateLevelUpUI();
        }
    }
    
    // 更新背包UI
    updateInventoryUI() {
        if (window.updateInventoryUI) {
            window.updateInventoryUI();
        }
    }
    
    // 获取游戏状态
    getGameState() {
        return {
            playerIsAlive: this.player.isAlive(),
            currentArea: this.player.currentArea
        };
    }
    
    // 开启宝箱方法
    openChest() {
        // 宝箱稀有度系统
        const rarityRoll = Math.random();
        const areaBonus = Math.min(0.2, (this.player.currentArea - 1) * 0.03);
        
        let chestRarity = 'common';
        if (rarityRoll < 0.02 + areaBonus * 0.5) chestRarity = 'mythic'; // 神话宝箱 - 超高稀有
        else if (rarityRoll < 0.1 + areaBonus * 1.5) chestRarity = 'legendary'; // 传奇宝箱
        else if (rarityRoll < 0.3 + areaBonus * 2) chestRarity = 'epic'; // 史诗宝箱
        else if (rarityRoll < 0.6 + areaBonus * 3) chestRarity = 'rare'; // 稀有宝箱
        
        const rarityText = {
            mythic: '传说中的宝箱',
            legendary: '传奇宝箱',
            epic: '史诗宝箱',
            rare: '稀有宝箱',
            common: '普通宝箱'
        };
        
        this.addToBattleLog(`你发现了一个${rarityText[chestRarity]}！`);
        
        // 宝箱可能触发陷阱（生成怪物）的概率
        const trapChance = chestRarity === 'mythic' ? 0.3 : chestRarity === 'legendary' ? 0.35 : 
                          chestRarity === 'epic' ? 0.4 : chestRarity === 'rare' ? 0.45 : 0.5;
        
        if (Math.random() < trapChance) {
            // 触发陷阱，生成怪物
            this.addToBattleLog('⚠️ 宝箱中跳出了一个怪物！');
            
            // 根据宝箱稀有度生成不同强度的怪物
            const monsterMultiplier = chestRarity === 'mythic' ? 2.5 : chestRarity === 'legendary' ? 2.0 : 
                                     chestRarity === 'epic' ? 1.7 : chestRarity === 'rare' ? 1.4 : 1.1;
            
            // 创建特殊宝箱怪物
            const monster = this.createChestMonster(monsterMultiplier);
            this.addToBattleLog(`陷阱怪物 ${monster.name} 出现了！`);
            
            // 战斗
            const battleResult = this.fightMonster(monster);
            
            if (battleResult) {
                this.addToBattleLog('你击败了陷阱怪物！');
                // 击败陷阱怪物后仍有奖励
                this.awardChestLoot(chestRarity);
            }
        } else {
            // 安全开启宝箱，直接获得奖励
            this.addToBattleLog('你成功开启了宝箱！');
            this.awardChestLoot(chestRarity);
        }
    }
    
    // 强化装备
    enhanceEquipment(item) {
        if (!this.equipmentEnhancer) {
            return { success: false, message: '装备强化系统未加载' };
        }
        
        const result = this.equipmentEnhancer.enhanceItem(item, this.player);
        
        if (result.success) {
            this.addToBattleLog(result.message);
            if (this.player.updateQuestProgress) {
                this.player.updateQuestProgress('enhanceEquipment', 1);
            }
        } else {
            this.addToBattleLog(`强化失败: ${result.message}`);
        }
        
        // 更新UI
        if (this.updateInventoryUI) {
            this.updateInventoryUI();
        }
        
        return result;
    }
    
    // 合成装备
    synthesizeEquipment(item1, item2) {
        if (!this.equipmentSynthesizer) {
            return { success: false, message: '装备合成系统未加载' };
        }
        
        const result = this.equipmentSynthesizer.synthesizeItems(item1, item2, this.player);
        
        if (result.success) {
            this.addToBattleLog(result.message);
            if (this.player.updateQuestProgress) {
                this.player.updateQuestProgress('synthesizeEquipment', 1);
            }
        } else {
            this.addToBattleLog(`合成失败: ${result.message}`);
        }
        
        // 更新UI
        if (this.updateInventoryUI) {
            this.updateInventoryUI();
        }
        
        return result;
    }
    
    // 创建宝箱怪物
    createChestMonster(strengthMultiplier) {
        // 使用现有的怪物工厂创建强化的怪物
        const baseMonster = MonsterFactory.createMonster(this.player.currentArea, this.player.level);
        
        // 增强怪物属性
        const enhancedMonster = {
            name: `宝箱守护者 ${baseMonster.name}`,
            hp: Math.floor(baseMonster.hp * strengthMultiplier),
            maxHp: Math.floor(baseMonster.maxHp * strengthMultiplier),
            attack: Math.floor(baseMonster.attack * strengthMultiplier),
            defense: Math.floor(baseMonster.defense * strengthMultiplier),
            expReward: Math.floor(baseMonster.expReward * strengthMultiplier * 1.5),
            goldReward: Math.floor(baseMonster.goldReward * strengthMultiplier * 1.5),
            isAlive: function() { return this.hp > 0; },
            takeDamage: function(amount) {
                const damage = Math.max(1, amount - this.defense);
                this.hp -= damage;
                return damage;
            },
            attackPlayer: function(player) {
                let damage = Math.max(1, this.attack - player.getTotalDefense());
                return { damage: damage, effectText: '' };
            }
        };
        
        return enhancedMonster;
    }
    
    // 奖励宝箱战利品
    awardChestLoot(chestRarity) {
        // 根据宝箱稀有度决定奖励数量和质量
        const itemCount = chestRarity === 'mythic' ? 3 : chestRarity === 'legendary' ? 3 : 
                        chestRarity === 'epic' ? 2 : chestRarity === 'rare' ? 2 : 1;
        
        // 为神话和传奇宝箱添加保底高品质装备
        const guaranteedRarity = chestRarity === 'mythic' ? 'legendary' : 
                               chestRarity === 'legendary' ? 'epic' : null;
        
        // 生成装备
        for (let i = 0; i < itemCount; i++) {
            // 第一个物品有保底品质
            if (i === 0 && guaranteedRarity) {
                this.generateGuaranteedRarityItem(guaranteedRarity);
            } else {
                // 其他物品根据宝箱稀有度提升品质概率
                this.generateItemWithBoost(chestRarity);
            }
        }
        
        // 额外金币奖励
        const baseGold = this.player.currentArea * 50;
        const goldMultiplier = chestRarity === 'mythic' ? 5 : chestRarity === 'legendary' ? 4 : 
                              chestRarity === 'epic' ? 3 : chestRarity === 'rare' ? 2 : 1;
        const goldReward = Math.floor(baseGold * goldMultiplier);
        this.player.gainGold(goldReward);
        this.addToBattleLog(`宝箱中还有 ${goldReward} 金币！`);
    }
    
    // 生成指定稀有度的装备
    generateGuaranteedRarityItem(rarity) {
        const itemTypes = ['weapon', 'armor', 'accessory'];
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        // 创建装备对象并设置稀有度
        const loot = this._generateItemInternal(type);
        // 确保稀有度
        if (loot && loot.rarity !== rarity) {
            loot.rarity = rarity;
            // 重新计算属性和售价
            this.assignEquipmentStats(type, rarity, loot.baseValue || 10, loot);
            this.addRandomProperties(rarity, loot);
            loot.sellPrice = this.calculateSellPrice(loot.baseValue || 10, rarity, loot);
        }
        
        return loot;
    }
    
    // 生成装备，根据宝箱稀有度提升品质概率
    generateItemWithBoost(chestRarity) {
        const itemTypes = ['weapon', 'armor', 'accessory'];
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        return this._generateItemInternal(type);
    }
}

// 确保物品系统加载完成后初始化游戏
function initializeGame() {
    // 创建游戏实例
    const game = new Game();
    
    // 导出到全局
    window.game = game;
    
    // 计算离线收益
    if (game.player && game.player.calculateOfflineRewards) {
        const offlineRewards = game.player.calculateOfflineRewards();
        if (offlineRewards && (offlineRewards.exp > 0 || offlineRewards.gold > 0)) {
            game.addToBattleLog(`🎉 离线收益：经验 +${offlineRewards.exp}, 金币 +${offlineRewards.gold}`);
        }
    }
}

// 立即初始化游戏，如果物品系统已加载
initializeGame();

// 当DOM加载完成时，确保UI更新
window.addEventListener('DOMContentLoaded', function() {
    // 这里可以添加UI相关的初始化代码
    if (window.game && window.game.updateInventoryUI) {
        window.game.updateInventoryUI();
    }
});