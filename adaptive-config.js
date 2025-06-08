/**
 * 自适应事件选择器配置文件
 * 包含各种策略预设和高级配置选项
 */

// 策略预设配置
const ADAPTIVE_PRESETS = {
    // 保守策略 - 适合小事件池或希望温和去重的场景
    conservative: {
        name: '保守模式',
        description: '温和的去重复策略，适合小事件池',
        config: {
            BASE_WEIGHT: 1.0,
            MIN_WEIGHT: 0.3,
            IMMEDIATE_PENALTY: 0.4,
            RECENT_PENALTY: 0.7,
            DECAY_FACTOR: 0.9,
            HISTORY_LENGTH: 6,
            CRITICAL_REPEAT_THRESHOLD: 4,
            STRATEGY: 'conservative'
        },
        strategy: {
            decay: 0.9,
            penalty: 0.3,
            recovery: 0.1
        }
    },

    // 平衡策略 - 推荐的默认配置
    balanced: {
        name: '平衡模式',
        description: '平衡的去重复策略，推荐使用',
        config: {
            BASE_WEIGHT: 1.0,
            MIN_WEIGHT: 0.1,
            IMMEDIATE_PENALTY: 0.2,
            RECENT_PENALTY: 0.5,
            DECAY_FACTOR: 0.8,
            HISTORY_LENGTH: 10,
            CRITICAL_REPEAT_THRESHOLD: 3,
            STRATEGY: 'balanced'
        },
        strategy: {
            decay: 0.8,
            penalty: 0.2,
            recovery: 0.15
        }
    },

    // 激进策略 - 适合大事件池或强力去重需求
    aggressive: {
        name: '激进模式',
        description: '强力的去重复策略，适合大事件池',
        config: {
            BASE_WEIGHT: 1.0,
            MIN_WEIGHT: 0.05,
            IMMEDIATE_PENALTY: 0.1,
            RECENT_PENALTY: 0.3,
            DECAY_FACTOR: 0.6,
            HISTORY_LENGTH: 15,
            CRITICAL_REPEAT_THRESHOLD: 2,
            STRATEGY: 'aggressive'
        },
        strategy: {
            decay: 0.6,
            penalty: 0.1,
            recovery: 0.2
        }
    },

    // 自定义策略模板
    custom: {
        name: '自定义模式',
        description: '可自由调整的策略配置',
        config: {
            BASE_WEIGHT: 1.0,
            MIN_WEIGHT: 0.1,
            IMMEDIATE_PENALTY: 0.2,
            RECENT_PENALTY: 0.5,
            DECAY_FACTOR: 0.8,
            HISTORY_LENGTH: 10,
            CRITICAL_REPEAT_THRESHOLD: 3,
            STRATEGY: 'custom'
        },
        strategy: {
            decay: 0.8,
            penalty: 0.2,
            recovery: 0.15
        }
    }
};

// 高级配置选项说明
const CONFIG_DESCRIPTIONS = {
    BASE_WEIGHT: {
        name: '基础权重',
        description: '所有事件的初始权重值',
        range: [0.1, 2.0],
        default: 1.0,
        step: 0.1
    },
    MIN_WEIGHT: {
        name: '最小权重',
        description: '事件权重的最小值限制，防止完全排除',
        range: [0.01, 0.5],
        default: 0.1,
        step: 0.01
    },
    IMMEDIATE_PENALTY: {
        name: '即时惩罚',
        description: '刚选中事件的权重衰减倍数',
        range: [0.05, 0.8],
        default: 0.2,
        step: 0.05
    },
    RECENT_PENALTY: {
        name: '近期惩罚',
        description: '近期选中事件的权重衰减倍数',
        range: [0.1, 0.9],
        default: 0.5,
        step: 0.05
    },
    DECAY_FACTOR: {
        name: '衰减因子',
        description: '每轮权重衰减的系数',
        range: [0.3, 0.95],
        default: 0.8,
        step: 0.05
    },
    HISTORY_LENGTH: {
        name: '历史长度',
        description: '追踪的历史轮次数量',
        range: [3, 20],
        default: 10,
        step: 1
    },
    CRITICAL_REPEAT_THRESHOLD: {
        name: '连续阈值',
        description: '触发强制避免的连续出现次数',
        range: [2, 10],
        default: 3,
        step: 1
    }
};

// 情境化推荐配置
const SCENARIO_CONFIGS = {
    // 小型聚会 (少于20个事件)
    smallParty: {
        name: '小型聚会',
        description: '适合少量事件的小规模游戏',
        recommendedPreset: 'conservative',
        customConfig: {
            HISTORY_LENGTH: 6,
            CRITICAL_REPEAT_THRESHOLD: 4,
            MIN_WEIGHT: 0.3
        }
    },

    // 大型聚会 (超过50个事件)
    largeParty: {
        name: '大型聚会',
        description: '适合大量事件的大规模游戏',
        recommendedPreset: 'aggressive',
        customConfig: {
            HISTORY_LENGTH: 15,
            CRITICAL_REPEAT_THRESHOLD: 2,
            MIN_WEIGHT: 0.05
        }
    },

    // 长期游戏 (多轮游戏)
    longTerm: {
        name: '长期游戏',
        description: '适合持续多轮的长期游戏',
        recommendedPreset: 'balanced',
        customConfig: {
            HISTORY_LENGTH: 12,
            DECAY_FACTOR: 0.85,
            recovery: 0.1
        }
    },

    // 快速游戏 (短期游戏)
    quickGame: {
        name: '快速游戏',
        description: '适合快节奏的短期游戏',
        recommendedPreset: 'aggressive',
        customConfig: {
            HISTORY_LENGTH: 8,
            IMMEDIATE_PENALTY: 0.15,
            recovery: 0.25
        }
    }
};

// 配置管理器
class AdaptiveConfigManager {
    constructor() {
        this.currentPreset = 'balanced';
        this.customConfig = { ...ADAPTIVE_PRESETS.balanced.config };
        this.loadSavedConfig();
    }

    // 加载保存的配置
    loadSavedConfig() {
        try {
            const saved = localStorage.getItem('adaptive-selector-config');
            if (saved) {
                const config = JSON.parse(saved);
                this.currentPreset = config.preset || 'balanced';
                this.customConfig = { ...this.customConfig, ...config.custom };
            }
        } catch (error) {
            console.warn('加载配置失败，使用默认配置:', error);
        }
    }

    // 保存配置
    saveConfig() {
        try {
            const config = {
                preset: this.currentPreset,
                custom: this.customConfig,
                timestamp: Date.now()
            };
            localStorage.setItem('adaptive-selector-config', JSON.stringify(config));
        } catch (error) {
            console.warn('保存配置失败:', error);
        }
    }

    // 设置预设
    setPreset(presetName) {
        if (ADAPTIVE_PRESETS[presetName]) {
            this.currentPreset = presetName;
            if (presetName !== 'custom') {
                this.customConfig = { ...ADAPTIVE_PRESETS[presetName].config };
            }
            this.saveConfig();
            return this.getCurrentConfig();
        }
        return null;
    }

    // 更新自定义配置
    updateCustomConfig(key, value) {
        if (CONFIG_DESCRIPTIONS[key]) {
            const desc = CONFIG_DESCRIPTIONS[key];
            const clampedValue = Math.max(desc.range[0], Math.min(desc.range[1], value));
            this.customConfig[key] = clampedValue;
            this.currentPreset = 'custom';
            this.saveConfig();
            return true;
        }
        return false;
    }

    // 获取当前配置
    getCurrentConfig() {
        return {
            preset: this.currentPreset,
            config: { ...this.customConfig },
            strategy: ADAPTIVE_PRESETS[this.currentPreset]?.strategy || ADAPTIVE_PRESETS.balanced.strategy
        };
    }

    // 应用情境配置
    applyScenarioConfig(scenarioName) {
        const scenario = SCENARIO_CONFIGS[scenarioName];
        if (!scenario) return false;

        // 应用推荐预设
        this.setPreset(scenario.recommendedPreset);

        // 应用自定义覆盖
        if (scenario.customConfig) {
            Object.keys(scenario.customConfig).forEach(key => {
                if (CONFIG_DESCRIPTIONS[key]) {
                    this.updateCustomConfig(key, scenario.customConfig[key]);
                }
            });
        }

        return true;
    }

    // 重置为默认配置
    resetToDefault() {
        this.currentPreset = 'balanced';
        this.customConfig = { ...ADAPTIVE_PRESETS.balanced.config };
        this.saveConfig();
        return this.getCurrentConfig();
    }

    // 获取所有可用预设
    getAvailablePresets() {
        return Object.keys(ADAPTIVE_PRESETS).map(key => ({
            key,
            name: ADAPTIVE_PRESETS[key].name,
            description: ADAPTIVE_PRESETS[key].description
        }));
    }

    // 获取所有情境配置
    getAvailableScenarios() {
        return Object.keys(SCENARIO_CONFIGS).map(key => ({
            key,
            name: SCENARIO_CONFIGS[key].name,
            description: SCENARIO_CONFIGS[key].description
        }));
    }

    // 导出配置
    exportConfig() {
        return {
            version: '1.0',
            preset: this.currentPreset,
            config: this.customConfig,
            timestamp: Date.now(),
            userAgent: navigator.userAgent
        };
    }

    // 导入配置
    importConfig(configData) {
        try {
            if (configData.version && configData.config) {
                this.customConfig = { ...this.customConfig, ...configData.config };
                this.currentPreset = configData.preset || 'custom';
                this.saveConfig();
                return true;
            }
        } catch (error) {
            console.error('导入配置失败:', error);
        }
        return false;
    }
}

// 全局配置管理器实例
const adaptiveConfigManager = new AdaptiveConfigManager();

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ADAPTIVE_PRESETS,
        CONFIG_DESCRIPTIONS,
        SCENARIO_CONFIGS,
        AdaptiveConfigManager,
        adaptiveConfigManager
    };
} else {
    window.ADAPTIVE_PRESETS = ADAPTIVE_PRESETS;
    window.CONFIG_DESCRIPTIONS = CONFIG_DESCRIPTIONS;
    window.SCENARIO_CONFIGS = SCENARIO_CONFIGS;
    window.AdaptiveConfigManager = AdaptiveConfigManager;
    window.adaptiveConfigManager = adaptiveConfigManager;
}
