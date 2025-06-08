// 从mission.js获取事件数据
function getMissionKeys() {
    const enabledKeys = [];
    const checkboxes = document.querySelectorAll('#personalEventsTable input[type="checkbox"]');
    
    // 如果表格不存在（用户还没打开事件管理），从localStorage读取勾选状态
    if (checkboxes.length === 0) {
        // 确保mission对象存在
        const missionObj = window.mission || mission;
        if (!missionObj) {
            console.error('mission对象未找到');
            return [];
        }
        
        // 从localStorage读取保存的勾选状态
        const savedState = JSON.parse(localStorage.getItem('personalEventsTable-checkedState')) || {};
        const allKeys = Object.keys(missionObj);
        
        // 如果没有保存的状态，默认所有事件都启用
        if (Object.keys(savedState).length === 0) {
            return allKeys;
        }
        
        // 根据保存的状态过滤启用的事件
        return allKeys.filter(key => savedState[key] !== false);
    }
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            enabledKeys.push(checkbox.dataset.key);
        }
    });
    return enabledKeys;
}

// 随机事件展示功能
document.addEventListener('DOMContentLoaded', function() {
    window.missionBoxes = document.querySelectorAll('.mission-box');
    const missionButton = document.getElementById('missionButton');
    // 注意：hardModeButton已被移除，不再需要引用
    const rerollCountDisplay = document.getElementById('rerollCount');
    const increaseRerollButton = document.getElementById('increaseReroll');
    const decreaseRerollButton = document.getElementById('decreaseReroll');
    let rerollCount = 3; // 初始重抽次数   
    let rerollChance = 0.05; // 初始概率为 5%
    let negativeCount = 0; // 累计 -1 的次数  
    
    // 等待自适应选择器脚本加载后初始化
    setTimeout(() => {
        initializeAdaptiveSelector();
    }, 100);
    
    // 初始化动画效果
    missionBoxes.forEach((box, index) => {
        setTimeout(() => {
            box.classList.add('active');
            
            // 为每个事件盒子添加玩家标识元素
            const playerTag = document.createElement('div');
            playerTag.className = `player-tag p${index+1}`;
            playerTag.textContent = `P${index+1}`;
            box.appendChild(playerTag);
            
            // 为每个事件盒子添加点击事件，实现单独刷新
            box.addEventListener('click', function() {
                refreshSingleMission(box, index);
            });
        }, 100 * index);
    });    // 初始化自适应事件选择器
    let adaptiveSelector = null;
    
    // 初始化选择器的函数
    function initializeAdaptiveSelector() {
        if (typeof AdaptiveEventSelector !== 'undefined' && typeof adaptiveConfigManager !== 'undefined') {
            // 获取当前配置
            const currentConfig = adaptiveConfigManager.getCurrentConfig();
            
            // 创建自适应选择器实例
            adaptiveSelector = new AdaptiveEventSelector(currentConfig.config);
            
            console.log('✅ 自适应事件选择器已启用');
            console.log(`📋 当前策略: ${currentConfig.preset} (${ADAPTIVE_PRESETS[currentConfig.preset]?.name || '未知'})`);
        } else {
            console.warn('⚠️ 自适应事件选择器或配置管理器未加载，使用传统随机算法');
        }
    }

    // 随机选择事件 - 集成自适应算法
    function getRandomMissions(count) {
        const keys = getMissionKeys(); // 获取已启用的任务
        
        if (keys.length === 0) {
            return [];
        }
        
        // 尝试使用自适应选择器
        if (adaptiveSelector) {
            try {
                return adaptiveSelector.selectEvents([...keys], count);
            } catch (error) {
                console.error('自适应选择器出错，降级到传统算法:', error);
            }
        }
        
        // 降级到传统随机算法
        const shuffled = [...keys].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    
    // 更新重抽次数显示
    function updateRerollCount(change) {
        rerollCount += change;
        rerollCountDisplay.textContent = rerollCount; // 更新显示
    }

    // 增加重抽次数
    increaseRerollButton.addEventListener('click', () => {
        updateRerollCount(1);
    });

    // 减少重抽次数
    decreaseRerollButton.addEventListener('click', () => {
        updateRerollCount(-1);
    });

    // 刷新单个事件
    function refreshSingleMission(box, index) {
        // 检查重抽次数是否足够
        if (rerollCount <= 0) {
            alert('重抽次数不足！');
            return;
        }        const keys = getMissionKeys();
        if (keys.length === 0) {
            alert('没有可用的事件！请检查事件管理设置。');
            return;
        }
        
        const randomIndex = Math.floor(Math.random() * keys.length);
        const missionKey = keys[randomIndex];
        
        // 确保能够访问mission对象
        const missionObj = window.mission || mission;
        if (!missionObj || !missionObj[missionKey]) {
            console.error('无法找到事件数据:', missionKey);
            alert('事件数据加载失败，请刷新页面重试。');
            return;
        }
        const missionData = missionObj[missionKey];

        // 重置动画
        box.classList.remove('active');

        // 设置事件内容
        const titleElement = box.querySelector('.mission-title');
        const contentElement = box.querySelector('.mission-content');

        // 隐藏玩家标识
        const playerTag = box.querySelector('.player-tag');
        if (playerTag) {
            playerTag.classList.remove('show');
        }

        // 清空内容
        titleElement.textContent = '';
        contentElement.textContent = '';
        contentElement.innerHTML = '';

        // 添加淡出效果
        box.style.opacity = 0;

        setTimeout(() => {
            // 设置新内容
            titleElement.textContent = missionKey;

            let modifiedContent = typeof missionData.内容 === 'function'
                ? missionData.内容()
                : missionData.内容;

            // 检查是否为“方位车？给我干哪来了？”事件
            if (missionKey === "方位车？给我干哪来了？") {
                const AAOptions = ["等级", "命座", "攻击", "生命", "防御", "精通"];
                const BBOptions = ["上", "下", "左", "右", "左上", "左下", "右上", "右下"];

                const randomAA = AAOptions[Math.floor(Math.random() * AAOptions.length)];
                const randomBB = BBOptions[Math.floor(Math.random() * BBOptions.length)];

                // 确保替换后的内容不为空
                modifiedContent = modifiedContent
                    .replace("AA", randomAA || "未知")
                    .replace("BB", randomBB || "未知");
            }

            // 添加随机逻辑
            const randomChance = Math.random();
            if (randomChance < rerollChance) {
                // 确定是 +1 还是 -1
                let rerollResult;
                if (negativeCount >= 2) {
                    // 如果累计两次 -1，下一次触发时强制为 +1
                    rerollResult = "+1";
                    negativeCount = 0; // 重置计数器
                } else {
                    // 正常随机判断 +1 或 -1
                    rerollResult = Math.random() < 0.5 ? "+1" : "-1";
                    if (rerollResult === "-1") {
                        negativeCount++; // 累计 -1 次数
                    } else {
                        negativeCount = 0; // 如果是 +1，清空 -1 的累计次数
                    }
                }

                // 添加重抽次数
                const color = rerollResult === "+1" ? "green" : "red";
                modifiedContent += `;<span style="color: ${color};">重抽次数${rerollResult}</span>`;

                // 更新重抽次数
                updateRerollCount(rerollResult === "+1" ? 1 : -1);

                // 重置概率
                rerollChance = 0.05;
            } else {
                // 未触发，增加概率
                rerollChance += 0.05;
            }

            // 确保内容被正确更新到卡片
            contentElement.textContent = modifiedContent;
            contentElement.innerHTML = modifiedContent;

            // 添加淡入效果
            box.style.opacity = 1;
            box.classList.add('active');

            // 显示玩家标识
            if (playerTag) {
                setTimeout(() => {
                    playerTag.classList.add('show');
                }, 500); // 在内容显示后再显示玩家标识
            }

            // 更新事件历史记录
            if (window.eventHistoryModule && window.eventHistoryModule.eventHistoryData.length > 0) {
                const lastRound = window.eventHistoryModule.eventHistoryData[
                    window.eventHistoryModule.eventHistoryData.length - 1
                ];
                const currentEvent = lastRound[index];
                if (currentEvent) {
                    // 将当前事件添加到切换链条
                    currentEvent.replaced.push(missionKey);
                }
            }
        }, 300);

        // 减少重抽次数（点击卡片时至少需要 1 次）
        updateRerollCount(-1);
    }      // 显示随机事件
    function displayRandomMissions() {
        const randomMissions = getRandomMissions(4);
        
        if (randomMissions.length === 0) {
            alert('没有可用的事件！请检查事件管理设置。');
            return;
        }
        
        // 确保能够访问mission对象
        const missionObj = window.mission || mission;
        if (!missionObj) {
            alert('事件数据未加载，请刷新页面重试。');
            return;
        }
        
        // 记录本轮事件
        const roundEvents = randomMissions.map(key => ({ event: key }));
        // 将事件存入事件历史
        window.eventHistoryModule.pushEventRoundHistory(roundEvents);

        // 隐藏所有玩家标识
        document.querySelectorAll('.player-tag').forEach(tag => {
            tag.classList.remove('show');
        });
        
        // 同时抽取并显示困难事件
        displayHardMissions();
        
        missionBoxes.forEach((box, index) => {
            const missionKey = randomMissions[index];
            const missionData = missionObj[missionKey];
            
            if (!missionData) {
                console.error('无法找到事件数据:', missionKey);
                return;
            }

            // 重置动画
            box.classList.remove('active');

            // 设置事件内容
            const titleElement = box.querySelector('.mission-title');
            const contentElement = box.querySelector('.mission-content');

            // 清空内容
            titleElement.textContent = '';
            contentElement.textContent = '';
            contentElement.innerHTML = ''
            
            // 添加淡出效果
            box.style.opacity = 0;

            setTimeout(() => {
                // 设置新内容
                titleElement.textContent = missionKey;

                let modifiedContent = typeof missionData.内容 === 'function' 
                    ? missionData.内容() 
                    : missionData.内容;

            // 检查是否为“方位车？给我干哪来了？”事件
            if (missionKey === "方位车？给我干哪来了？") {
                const AAOptions = ["等级", "命座", "攻击", "生命", "防御", "精通"];
                const BBOptions = ["上", "下", "左", "右", "左上", "左下", "右上", "右下"];

                const randomAA = AAOptions[Math.floor(Math.random() * AAOptions.length)];
                const randomBB = BBOptions[Math.floor(Math.random() * BBOptions.length)];

                // 确保替换后的内容不为空
                modifiedContent = modifiedContent
                    .replace("AA", randomAA || "未知")
                    .replace("BB", randomBB || "未知");
            }

            // 添加随机逻辑
            const randomChance = Math.random();
            if (randomChance < rerollChance) {
                // 确定是 +1 还是 -1
                let rerollResult;
                if (negativeCount >= 2) {
                    // 如果累计两次 -1，下一次触发时强制为 +1
                    rerollResult = "+1";
                    negativeCount = 0; // 重置计数器
                } else {
                    // 正常随机判断 +1 或 -1
                    rerollResult = Math.random() < 0.5 ? "+1" : "-1";
                    if (rerollResult === "-1") {
                        negativeCount++; // 累计 -1 次数
                    } else {
                        negativeCount = 0; // 如果是 +1，清空 -1 的累计次数
                    }
                }

                // 添加重抽次数
                const color = rerollResult === "+1" ? "green" : "red";
                modifiedContent += `;<span style="color: ${color};">重抽次数${rerollResult}</span>`;

                // 更新重抽次数
                updateRerollCount(rerollResult === "+1" ? 1 : -1);

                // 重置概率
                rerollChance = 0.05;
            } else {
                // 未触发，增加概率
                rerollChance += 0.05;
            }

            // 确保内容被正确更新到卡片
                contentElement.textContent = modifiedContent;
                contentElement.innerHTML = modifiedContent;

                // 添加淡入效果
                box.style.opacity = 1;
                box.classList.add('active');
                
                // 显示玩家标识
                const playerTag = box.querySelector('.player-tag');
                if (playerTag) {                setTimeout(() => {
                        playerTag.classList.add('show');
                    }, 500); // 在内容显示后再显示玩家标识
                }
            }, 300);
        });
        
        // 不再显示困难模式按钮，因为困难事件会自动显示
        // hardModeButton.style.display = 'inline-block';
    }    // 显示困难事件的函数
    function displayHardMissions() {
        // 获取三个随机困难事件
        const hardMissionKeys = typeof getHardMissionKeys === 'function' ? getHardMissionKeys() : [];
        if (hardMissionKeys.length === 0) {
            console.log('没有可用的困难事件');
            return;
        }
        
        // 随机选择三个困难事件
        const shuffled = [...hardMissionKeys].sort(() => 0.5 - Math.random());
        const selectedHardMissions = shuffled.slice(0, 3);        // 调用投票系统显示困难事件
        const tryDisplayHardMissions = () => {
            if (window.hardMissionVoting && window.hardMissionVoting.displayHardMissionsWithVoting) {
                console.log('调用困难事件投票系统，事件数量:', selectedHardMissions.length);
                window.hardMissionVoting.displayHardMissionsWithVoting(selectedHardMissions);
            } else {
                console.log('等待困难事件投票系统加载...');
                // 如果投票系统还没加载完成，稍后重试
                setTimeout(tryDisplayHardMissions, 50);
            }
        };
        
        tryDisplayHardMissions();
    }
    
    // 绑定按钮点击事件
    missionButton.addEventListener('click', () => {
      displayRandomMissions(); // 抽取事件逻辑
    });
    
    function saveCheckedState(tableId) {
        const checkboxes = document.querySelectorAll(`#${tableId} input[type="checkbox"]`);
        const checkedState = {};
        checkboxes.forEach(checkbox => {
            checkedState[checkbox.dataset.key] = checkbox.checked; // 保存每个任务的勾选状态
        });
        localStorage.setItem(`${tableId}-checkedState`, JSON.stringify(checkedState)); // 存储到 localStorage
    }
    
    function loadCheckedState(tableId) {
        const savedState = JSON.parse(localStorage.getItem(`${tableId}-checkedState`)) || {};
        const checkboxes = document.querySelectorAll(`#${tableId} input[type="checkbox"]`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = savedState[checkbox.dataset.key] !== undefined ? savedState[checkbox.dataset.key] : true; // 默认勾选
        });
    }
    
    function attachCheckboxListeners(tableId) {
        const checkboxes = document.querySelectorAll(`#${tableId} input[type="checkbox"]`);
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                saveCheckedState(tableId); // 保存勾选状态
            });
        });
    }
    
    function populateTable(table, tasks, tableId) {
        table.innerHTML = '';
        Object.keys(tasks).forEach(key => {
            const row = document.createElement('tr');

            // 创建启用勾选框
            const enableCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true; // 默认勾选
            checkbox.dataset.key = key; // 保存任务的 key
            enableCell.appendChild(checkbox);

            // 创建标题和内容单元格
            const titleCell = document.createElement('td');
            const contentCell = document.createElement('td');
            titleCell.textContent = key;
            contentCell.textContent = tasks[key].内容;

            // 将单元格添加到行
            row.appendChild(enableCell);
            row.appendChild(titleCell);
            row.appendChild(contentCell);

            // 将行添加到表格
            table.appendChild(row);
        });

        // 加载保存的勾选状态
        loadCheckedState(tableId);

        // 绑定勾选框的事件监听器
        attachCheckboxListeners(tableId);
    }

    const viewProbabilityText = document.getElementById('viewProbabilityText');
    const probabilityPopup = document.getElementById('probabilityPopup');

    // 点击文字显示弹窗
    viewProbabilityText.addEventListener('click', function (event) {
        if (probabilityPopup.style.display === 'none') {
                // 显示弹窗
            probabilityPopup.style.display = 'block';

            // 在手机端居中显示
            if (window.innerWidth <= 768) {
                probabilityPopup.style.left = '5%';
                probabilityPopup.style.top = `${window.scrollY + 100}px`; // 距离顶部 100px
            } else {
                // 桌面端显示在文字旁边
                probabilityPopup.style.left = `${event.pageX + 10}px`;
                probabilityPopup.style.top = `${event.pageY}px`;
            }
        } else {
            // 隐藏弹窗
            probabilityPopup.style.display = 'none';
        }
    });

    // 点击页面其他地方隐藏弹窗
    document.addEventListener('click', function (event) {
        if (!viewProbabilityText.contains(event.target) && !probabilityPopup.contains(event.target)) {
            probabilityPopup.style.display = 'none';
        }
    });
    
    // 自适应选择器管理功能
    window.adaptiveEventManager = {
        // 获取选择器实例
        getSelector: () => adaptiveSelector,
          // 切换策略
        setStrategy: (strategy) => {
            if (adaptiveSelector && adaptiveConfigManager) {
                const config = adaptiveConfigManager.setPreset(strategy);
                if (config) {
                    // 重新创建选择器实例以应用新配置
                    const currentStats = adaptiveSelector.getStats();
                    const currentHistory = adaptiveSelector.selectionHistory;
                    
                    adaptiveSelector = new AdaptiveEventSelector(config.config);
                    
                    // 恢复历史记录（可选）
                    if (currentHistory && currentHistory.length > 0) {
                        adaptiveSelector.selectionHistory = currentHistory;
                        adaptiveSelector.roundCounter = currentStats.rounds;
                    }
                    
                    console.log(`🔧 策略已切换为: ${strategy} (${ADAPTIVE_PRESETS[strategy]?.name || '未知'})`);
                }
            }
        },
        
        // 应用情境配置
        applyScenario: (scenarioName) => {
            if (adaptiveConfigManager) {
                const success = adaptiveConfigManager.applyScenarioConfig(scenarioName);
                if (success) {
                    // 重新初始化选择器
                    initializeAdaptiveSelector();
                    console.log(`🎯 已应用情境配置: ${SCENARIO_CONFIGS[scenarioName]?.name || scenarioName}`);
                }
                return success;
            }
            return false;
        },
        
        // 获取配置管理器
        getConfigManager: () => adaptiveConfigManager,
        
        // 获取统计信息
        getStats: () => {
            return adaptiveSelector ? adaptiveSelector.getStats() : null;
        },
        
        // 获取权重信息
        getWeights: () => {
            return adaptiveSelector ? adaptiveSelector.getWeightInfo() : null;
        },
        
        // 重置选择器
        reset: () => {
            if (adaptiveSelector) {
                adaptiveSelector.reset();
                console.log('🔄 自适应选择器已重置');
            }
        },
        
        // 显示详细统计报告
        showReport: () => {
            if (!adaptiveSelector) {
                console.log('❌ 自适应选择器未初始化');
                return;
            }
            
            const stats = adaptiveSelector.getStats();
            const weights = adaptiveSelector.getWeightInfo();
            
            console.log('📊 自适应事件选择器统计报告:');
            console.log('=====================================');
            console.log(`策略: ${stats.strategy}`);
            console.log(`总轮次: ${stats.rounds}`);
            console.log(`总选择数: ${stats.totalSelections}`);
            console.log(`独特事件数: ${stats.uniqueEvents}`);
            console.log(`平均重复率: ${stats.averageRepeatRate.toFixed(1)}%`);
            console.log(`权重调整次数: ${stats.weightAdjustments}`);
            console.log('=====================================');
            
            // 显示权重排行
            console.log('🏆 当前事件权重排行 (前10名):');
            weights.slice(0, 10).forEach((item, index) => {
                const consecutive = item.consecutive > 0 ? ` (连续${item.consecutive}次)` : '';
                console.log(`${index + 1}. ${item.event}: ${item.weight.toFixed(3)}${consecutive}`);
            });
            
            return { stats, weights };
        },
        
        // 模拟测试功能
        simulateRounds: (rounds = 10) => {
            if (!adaptiveSelector) {
                console.log('❌ 自适应选择器未初始化');
                return;
            }
            
            console.log(`🧪 开始模拟 ${rounds} 轮事件选择...`);
            const keys = getMissionKeys();
            
            for (let i = 0; i < rounds; i++) {
                const selected = adaptiveSelector.selectEvents([...keys], 4);
                console.log(`轮次 ${i + 1}: [${selected.join(', ')}]`);
            }
            
            return adaptiveEventManager.showReport();
        }
    };

    // 在控制台输出帮助信息
    setTimeout(() => {
        if (adaptiveSelector) {
            console.log('%c🎲 自适应事件选择器已启用！', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
            console.log('%c使用以下命令来管理选择器:', 'color: #2196F3; font-size: 12px;');
            console.log('📈 adaptiveEventManager.showReport() - 查看统计报告');
            console.log('🔧 adaptiveEventManager.setStrategy("conservative"|"balanced"|"aggressive") - 切换策略');
            console.log('🔄 adaptiveEventManager.reset() - 重置选择器');
            console.log('🧪 adaptiveEventManager.simulateRounds(10) - 模拟测试');
            console.log('⚖️ adaptiveEventManager.getWeights() - 查看权重信息');
        }
    }, 2000);
});