/**
 * 自适应概率调整事件选择器
 * 通过动态调整事件权重来减少重复事件的出现
 */
class AdaptiveEventSelector {
    constructor(config = {}) {
        // 配置参数
        this.config = {
            BASE_WEIGHT: 1.0,
            MIN_WEIGHT: 0.1,
            IMMEDIATE_PENALTY: 0.2,
            RECENT_PENALTY: 0.5,
            DECAY_FACTOR: 0.8,
            HISTORY_LENGTH: 10,
            CRITICAL_REPEAT_THRESHOLD: 3,
            SMALL_POOL_THRESHOLD: 20,
            LARGE_POOL_THRESHOLD: 100,
            STRATEGY: 'balanced',
            ...config
        };

        // 策略配置
        this.strategies = {
            'conservative': { decay: 0.9, penalty: 0.3, recovery: 0.1 },
            'balanced': { decay: 0.8, penalty: 0.2, recovery: 0.15 },
            'aggressive': { decay: 0.6, penalty: 0.1, recovery: 0.2 }
        };

        // 状态管理
        this.eventWeights = new Map();           // 事件权重映射
        this.selectionHistory = [];              // 选择历史记录
        this.roundCounter = 0;                   // 轮次计数器
        this.lastSelectedEvents = new Set();     // 上一轮选中的事件
        this.consecutiveCount = new Map();       // 连续出现次数统计

        // 统计信息
        this.stats = {
            totalSelections: 0,
            uniqueEvents: 0,
            averageRepeatRate: 0,
            weightAdjustments: 0
        };

        console.log('🎲 自适应事件选择器已初始化，策略:', this.config.STRATEGY);
    }

    /**
     * 初始化事件权重
     * @param {Array} eventKeys - 所有可用事件的键值数组
     */
    initializeWeights(eventKeys) {
        console.log(`📊 初始化 ${eventKeys.length} 个事件的权重`);
        
        // 重置权重映射
        this.eventWeights.clear();
        
        // 为每个事件设置基础权重
        eventKeys.forEach(key => {
            this.eventWeights.set(key, this.config.BASE_WEIGHT);
        });

        // 根据事件池大小自适应调整策略
        this.adaptStrategyToPoolSize(eventKeys.length);
        
        console.log(`✅ 权重初始化完成，事件池大小: ${eventKeys.length}`);
    }

    /**
     * 根据事件池大小自适应调整策略参数
     * @param {number} poolSize - 事件池大小
     */
    adaptStrategyToPoolSize(poolSize) {
        let adjustedStrategy = { ...this.strategies[this.config.STRATEGY] };

        if (poolSize <= this.config.SMALL_POOL_THRESHOLD) {
            // 小事件池：更保守的策略，减少权重调整强度
            adjustedStrategy.decay *= 1.2;
            adjustedStrategy.penalty *= 1.5;
            adjustedStrategy.recovery *= 0.8;
            console.log('🔧 检测到小事件池，采用保守策略');
        } else if (poolSize >= this.config.LARGE_POOL_THRESHOLD) {
            // 大事件池：更激进的策略，增强去重复效果
            adjustedStrategy.decay *= 0.8;
            adjustedStrategy.penalty *= 0.7;
            adjustedStrategy.recovery *= 1.3;
            console.log('🔧 检测到大事件池，采用激进策略');
        }

        this.currentStrategy = adjustedStrategy;
    }

    /**
     * 选择指定数量的随机事件
     * @param {Array} availableEvents - 可用事件数组
     * @param {number} count - 需要选择的事件数量
     * @returns {Array} 选中的事件数组
     */
    selectEvents(availableEvents, count) {
        if (!availableEvents || availableEvents.length === 0) {
            console.warn('⚠️ 没有可用的事件');
            return [];
        }

        if (count <= 0) {
            console.warn('⚠️ 选择数量必须大于0');
            return [];
        }

        // 确保有权重数据
        if (this.eventWeights.size === 0) {
            this.initializeWeights(availableEvents);
        }

        // 更新权重（基于历史记录）
        this.updateWeights();

        // 执行加权随机选择
        const selectedEvents = this.performWeightedSelection(availableEvents, count);

        // 更新选择历史
        this.updateSelectionHistory(selectedEvents);

        // 更新统计信息
        this.updateStats(selectedEvents);

        // 输出调试信息
        this.logSelectionInfo(selectedEvents);

        return selectedEvents;
    }

    /**
     * 更新事件权重
     */
    updateWeights() {
        if (this.selectionHistory.length === 0) {
            return;
        }

        const strategy = this.currentStrategy;
        
        // 1. 全局衰减恢复
        this.eventWeights.forEach((weight, eventKey) => {
            // 逐步恢复权重到基础值
            const recovery = strategy.recovery;
            const newWeight = weight + (this.config.BASE_WEIGHT - weight) * recovery;
            this.eventWeights.set(eventKey, Math.min(newWeight, this.config.BASE_WEIGHT));
        });

        // 2. 历史惩罚机制
        const recentHistory = this.selectionHistory.slice(-this.config.HISTORY_LENGTH);
        
        recentHistory.forEach((roundEvents, roundIndex) => {
            const age = recentHistory.length - roundIndex; // 越大越久远
            const ageFactor = Math.pow(strategy.decay, age - 1);
            
            roundEvents.forEach(eventKey => {
                if (this.eventWeights.has(eventKey)) {
                    const currentWeight = this.eventWeights.get(eventKey);
                    const penaltyFactor = age === 1 ? 
                        this.config.IMMEDIATE_PENALTY : 
                        this.config.RECENT_PENALTY;
                    
                    const penalty = penaltyFactor * ageFactor;
                    const newWeight = Math.max(
                        currentWeight * (1 - penalty), 
                        this.config.MIN_WEIGHT
                    );
                    
                    this.eventWeights.set(eventKey, newWeight);
                }
            });
        });

        // 3. 连续出现强制避免
        this.handleConsecutiveRepeats();

        this.stats.weightAdjustments++;
    }

    /**
     * 处理连续重复出现的事件
     */
    handleConsecutiveRepeats() {
        // 统计最近连续出现的事件
        this.consecutiveCount.clear();
        
        const recentRounds = this.selectionHistory.slice(-this.config.CRITICAL_REPEAT_THRESHOLD);
        
        // 检查每个事件的连续出现次数
        this.eventWeights.forEach((_, eventKey) => {
            let consecutiveCount = 0;
            
            // 从最近的轮次开始倒数
            for (let i = recentRounds.length - 1; i >= 0; i--) {
                if (recentRounds[i].includes(eventKey)) {
                    consecutiveCount++;
                } else {
                    break; // 中断连续计数
                }
            }
            
            if (consecutiveCount > 0) {
                this.consecutiveCount.set(eventKey, consecutiveCount);
                
                // 对连续出现的事件施加强力惩罚
                if (consecutiveCount >= this.config.CRITICAL_REPEAT_THRESHOLD) {
                    const severePenalty = Math.pow(0.1, consecutiveCount);
                    const currentWeight = this.eventWeights.get(eventKey);
                    this.eventWeights.set(eventKey, Math.max(
                        currentWeight * severePenalty,
                        this.config.MIN_WEIGHT * 0.1 // 极低权重
                    ));
                    
                    console.log(`🚫 事件 "${eventKey}" 连续出现 ${consecutiveCount} 次，施加强力惩罚`);
                }
            }
        });
    }

    /**
     * 执行加权随机选择
     * @param {Array} availableEvents - 可用事件数组
     * @param {number} count - 选择数量
     * @returns {Array} 选中的事件
     */
    performWeightedSelection(availableEvents, count) {
        const selectedEvents = [];
        const tempWeights = new Map(this.eventWeights);
        
        // 确保所有可用事件都有权重
        availableEvents.forEach(eventKey => {
            if (!tempWeights.has(eventKey)) {
                tempWeights.set(eventKey, this.config.BASE_WEIGHT);
            }
        });

        // 选择指定数量的事件
        for (let i = 0; i < count && availableEvents.length > 0; i++) {
            const selectedEvent = this.selectSingleEventByWeight(availableEvents, tempWeights);
            
            if (selectedEvent) {
                selectedEvents.push(selectedEvent);
                
                // 从可选列表中移除已选择的事件（避免重复选择）
                const eventIndex = availableEvents.indexOf(selectedEvent);
                if (eventIndex > -1) {
                    availableEvents.splice(eventIndex, 1);
                }
                
                // 临时降低已选择事件的权重（本轮内避免重复）
                tempWeights.set(selectedEvent, tempWeights.get(selectedEvent) * 0.01);
            } else {
                console.warn('⚠️ 无法选择更多事件');
                break;
            }
        }

        return selectedEvents;
    }

    /**
     * 基于权重选择单个事件
     * @param {Array} events - 事件列表
     * @param {Map} weights - 权重映射
     * @returns {string|null} 选中的事件
     */
    selectSingleEventByWeight(events, weights) {
        if (events.length === 0) {
            return null;
        }

        // 计算总权重
        let totalWeight = 0;
        const eventWeights = [];
        
        events.forEach(eventKey => {
            const weight = weights.get(eventKey) || this.config.BASE_WEIGHT;
            totalWeight += weight;
            eventWeights.push({ event: eventKey, weight: weight, cumulative: totalWeight });
        });

        if (totalWeight === 0) {
            // 如果总权重为0，随机选择
            return events[Math.floor(Math.random() * events.length)];
        }

        // 加权随机选择
        const randomValue = Math.random() * totalWeight;
        
        for (const item of eventWeights) {
            if (randomValue <= item.cumulative) {
                return item.event;
            }
        }

        // 备用方案：返回最后一个事件
        return events[events.length - 1];
    }

    /**
     * 更新选择历史记录
     * @param {Array} selectedEvents - 本轮选中的事件
     */
    updateSelectionHistory(selectedEvents) {
        this.selectionHistory.push([...selectedEvents]);
        
        // 保持历史记录长度限制
        if (this.selectionHistory.length > this.config.HISTORY_LENGTH) {
            this.selectionHistory.shift();
        }

        this.roundCounter++;
        this.lastSelectedEvents = new Set(selectedEvents);
    }

    /**
     * 更新统计信息
     * @param {Array} selectedEvents - 本轮选中的事件
     */
    updateStats(selectedEvents) {
        this.stats.totalSelections += selectedEvents.length;
        
        // 计算独特事件数量
        const allSelectedEvents = new Set();
        this.selectionHistory.forEach(round => {
            round.forEach(event => allSelectedEvents.add(event));
        });
        this.stats.uniqueEvents = allSelectedEvents.size;

        // 计算平均重复率
        if (this.selectionHistory.length > 1) {
            let repeatCount = 0;
            let totalComparisons = 0;
            
            for (let i = 1; i < this.selectionHistory.length; i++) {
                const prevRound = new Set(this.selectionHistory[i - 1]);
                const currentRound = this.selectionHistory[i];
                
                currentRound.forEach(event => {
                    totalComparisons++;
                    if (prevRound.has(event)) {
                        repeatCount++;
                    }
                });
            }
            
            this.stats.averageRepeatRate = totalComparisons > 0 ? 
                (repeatCount / totalComparisons) * 100 : 0;
        }
    }

    /**
     * 输出选择信息日志
     * @param {Array} selectedEvents - 选中的事件
     */
    logSelectionInfo(selectedEvents) {
        console.log(`🎲 第 ${this.roundCounter} 轮事件选择完成:`);
        console.log(`   选中事件: [${selectedEvents.join(', ')}]`);
        console.log(`   重复率: ${this.stats.averageRepeatRate.toFixed(1)}%`);
        
        // 显示权重信息（调试用）
        if (this.config.DEBUG) {
            console.log('   当前权重状态:');
            selectedEvents.forEach(event => {
                const weight = this.eventWeights.get(event);
                console.log(`     ${event}: ${weight.toFixed(3)}`);
            });
        }
    }

    /**
     * 获取统计报告
     * @returns {Object} 统计信息对象
     */
    getStats() {
        return {
            ...this.stats,
            rounds: this.roundCounter,
            historyLength: this.selectionHistory.length,
            strategy: this.config.STRATEGY
        };
    }

    /**
     * 重置选择器状态
     */
    reset() {
        this.eventWeights.clear();
        this.selectionHistory = [];
        this.roundCounter = 0;
        this.lastSelectedEvents.clear();
        this.consecutiveCount.clear();
        this.stats = {
            totalSelections: 0,
            uniqueEvents: 0,
            averageRepeatRate: 0,
            weightAdjustments: 0
        };
        
        console.log('🔄 自适应事件选择器已重置');
    }

    /**
     * 动态调整策略
     * @param {string} newStrategy - 新策略名称
     */
    setStrategy(newStrategy) {
        if (this.strategies[newStrategy]) {
            this.config.STRATEGY = newStrategy;
            this.currentStrategy = this.strategies[newStrategy];
            console.log(`🔧 策略已切换为: ${newStrategy}`);
        } else {
            console.warn(`⚠️ 未知策略: ${newStrategy}`);
        }
    }

    /**
     * 获取事件权重信息（用于调试和分析）
     * @returns {Array} 权重信息数组
     */
    getWeightInfo() {
        const weightInfo = [];
        this.eventWeights.forEach((weight, event) => {
            weightInfo.push({
                event: event,
                weight: weight,
                consecutive: this.consecutiveCount.get(event) || 0
            });
        });
        
        return weightInfo.sort((a, b) => b.weight - a.weight);
    }
}

// 导出选择器类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveEventSelector;
} else {
    window.AdaptiveEventSelector = AdaptiveEventSelector;
}
