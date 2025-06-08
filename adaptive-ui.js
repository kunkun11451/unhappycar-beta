/**
 * 自适应事件选择器 UI 控制面板
 * 提供用户友好的界面来管理和监控自适应算法
 */

// 创建控制面板 UI
function createAdaptiveSelectorUI() {
    // 检查是否已存在控制面板
    if (document.getElementById('adaptive-selector-panel')) {
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'adaptive-selector-panel';
    panel.className = 'adaptive-panel';
    panel.innerHTML = `
        <div class="adaptive-panel-header">
            <h3>🎲 智能事件选择器</h3>
            <button id="adaptive-panel-toggle" class="panel-toggle">−</button>
        </div>
        <div class="adaptive-panel-content">
            <div class="adaptive-section">
                <label>算法策略:</label>
                <select id="adaptive-strategy-select">
                    <option value="conservative">保守模式 - 温和去重</option>
                    <option value="balanced" selected>平衡模式 - 推荐使用</option>
                    <option value="aggressive">激进模式 - 强力去重</option>
                </select>
            </div>
            
            <div class="adaptive-section">
                <div class="adaptive-stats">
                    <div class="stat-item">
                        <span class="stat-label">选择轮次:</span>
                        <span id="adaptive-rounds">0</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">重复率:</span>
                        <span id="adaptive-repeat-rate">0%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">独特事件:</span>
                        <span id="adaptive-unique-events">0</span>
                    </div>
                </div>
            </div>
            
            <div class="adaptive-section">
                <div class="adaptive-controls">
                    <button id="adaptive-show-report" class="adaptive-btn primary">📊 详细报告</button>
                    <button id="adaptive-reset" class="adaptive-btn secondary">🔄 重置数据</button>
                    <button id="adaptive-simulate" class="adaptive-btn secondary">🧪 模拟测试</button>
                </div>
            </div>
            
            <div class="adaptive-section">
                <details class="adaptive-details">
                    <summary>🏆 权重排行 (前5名)</summary>
                    <div id="adaptive-weight-list" class="weight-list">
                        <div class="weight-item">暂无数据</div>
                    </div>
                </details>
            </div>
        </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .adaptive-panel {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: rgba(255, 255, 255, 0.95);
            border: 2px solid #4CAF50;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            font-family: 'Microsoft YaHei', sans-serif;
            backdrop-filter: blur(10px);
            max-height: 90vh;
            overflow-y: auto;
        }

        .adaptive-panel-header {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 12px 16px;
            border-radius: 8px 8px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .adaptive-panel-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: bold;
        }

        .panel-toggle {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
            transition: background-color 0.2s;
        }

        .panel-toggle:hover {
            background-color: rgba(255,255,255,0.2);
        }

        .adaptive-panel-content {
            padding: 16px;
        }

        .adaptive-section {
            margin-bottom: 16px;
        }

        .adaptive-section label {
            display: block;
            margin-bottom: 6px;
            font-weight: bold;
            color: #333;
            font-size: 14px;
        }

        #adaptive-strategy-select {
            width: 100%;
            padding: 8px 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
            background-color: white;
            transition: border-color 0.2s;
        }

        #adaptive-strategy-select:focus {
            border-color: #4CAF50;
            outline: none;
        }

        .adaptive-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }

        .stat-item {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e9ecef;
        }

        .stat-label {
            display: block;
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
        }

        .stat-item span:last-child {
            font-weight: bold;
            font-size: 16px;
            color: #4CAF50;
        }

        .adaptive-controls {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .adaptive-btn {
            flex: 1;
            min-width: 90px;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }

        .adaptive-btn.primary {
            background: #4CAF50;
            color: white;
        }

        .adaptive-btn.primary:hover {
            background: #45a049;
            transform: translateY(-1px);
        }

        .adaptive-btn.secondary {
            background: #f8f9fa;
            color: #666;
            border: 1px solid #ddd;
        }

        .adaptive-btn.secondary:hover {
            background: #e9ecef;
            transform: translateY(-1px);
        }

        .adaptive-details {
            border: 1px solid #ddd;
            border-radius: 6px;
            overflow: hidden;
        }

        .adaptive-details summary {
            background: #f8f9fa;
            padding: 10px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            border-bottom: 1px solid #ddd;
        }

        .adaptive-details summary:hover {
            background: #e9ecef;
        }

        .weight-list {
            padding: 12px;
            max-height: 150px;
            overflow-y: auto;
        }

        .weight-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #eee;
            font-size: 13px;
        }

        .weight-item:last-child {
            border-bottom: none;
        }

        .weight-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-right: 8px;
        }

        .weight-value {
            font-weight: bold;
            color: #4CAF50;
            min-width: 60px;
            text-align: right;
        }

        .weight-consecutive {
            color: #ff9800;
            font-size: 11px;
            margin-left: 4px;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            .adaptive-panel {
                position: fixed;
                top: auto;
                bottom: 20px;
                right: 20px;
                left: 20px;
                width: auto;
                max-height: 50vh;
            }

            .adaptive-stats {
                grid-template-columns: 1fr;
                gap: 8px;
            }

            .adaptive-controls {
                flex-direction: column;
            }

            .adaptive-btn {
                min-width: auto;
            }
        }

        /* 折叠状态 */
        .adaptive-panel.collapsed .adaptive-panel-content {
            display: none;
        }

        /* 动画效果 */
        .adaptive-panel {
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(panel);

    // 绑定事件处理器
    setupAdaptivePanelEvents();
}

// 设置面板事件处理器
function setupAdaptivePanelEvents() {
    const panel = document.getElementById('adaptive-selector-panel');
    const toggleBtn = document.getElementById('adaptive-panel-toggle');
    const strategySelect = document.getElementById('adaptive-strategy-select');
    const showReportBtn = document.getElementById('adaptive-show-report');
    const resetBtn = document.getElementById('adaptive-reset');
    const simulateBtn = document.getElementById('adaptive-simulate');

    // 折叠/展开面板
    toggleBtn.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
        toggleBtn.textContent = panel.classList.contains('collapsed') ? '+' : '−';
    });

    // 策略切换
    strategySelect.addEventListener('change', (e) => {
        const strategy = e.target.value;
        if (window.adaptiveEventManager) {
            window.adaptiveEventManager.setStrategy(strategy);
            updateAdaptiveUI();
        }
    });

    // 显示详细报告
    showReportBtn.addEventListener('click', () => {
        if (window.adaptiveEventManager) {
            const report = window.adaptiveEventManager.showReport();
            if (report) {
                showAdaptiveReportModal(report);
            }
        }
    });

    // 重置数据
    resetBtn.addEventListener('click', () => {
        if (confirm('确定要重置所有自适应选择器数据吗？这将清除历史记录和权重信息。')) {
            if (window.adaptiveEventManager) {
                window.adaptiveEventManager.reset();
                updateAdaptiveUI();
            }
        }
    });

    // 模拟测试
    simulateBtn.addEventListener('click', () => {
        if (window.adaptiveEventManager) {
            const rounds = prompt('请输入要模拟的轮次数量:', '10');
            if (rounds && !isNaN(parseInt(rounds))) {
                window.adaptiveEventManager.simulateRounds(parseInt(rounds));
                updateAdaptiveUI();
            }
        }
    });

    // 定期更新UI
    setInterval(updateAdaptiveUI, 2000);
}

// 更新自适应面板UI
function updateAdaptiveUI() {
    if (!window.adaptiveEventManager) return;

    const stats = window.adaptiveEventManager.getStats();
    const weights = window.adaptiveEventManager.getWeights();

    if (stats) {
        document.getElementById('adaptive-rounds').textContent = stats.rounds || 0;
        document.getElementById('adaptive-repeat-rate').textContent = 
            (stats.averageRepeatRate || 0).toFixed(1) + '%';
        document.getElementById('adaptive-unique-events').textContent = stats.uniqueEvents || 0;
    }

    if (weights && weights.length > 0) {
        const weightList = document.getElementById('adaptive-weight-list');
        weightList.innerHTML = weights.slice(0, 5).map((item, index) => {
            const consecutive = item.consecutive > 0 ? 
                `<span class="weight-consecutive">(连续${item.consecutive})</span>` : '';
            
            return `
                <div class="weight-item">
                    <span class="weight-name">${index + 1}. ${item.event}</span>
                    <span class="weight-value">${item.weight.toFixed(3)}${consecutive}</span>
                </div>
            `;
        }).join('');
    }
}

// 显示详细报告模态框
function showAdaptiveReportModal(report) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'adaptive-modal';
    modal.innerHTML = `
        <div class="adaptive-modal-content">
            <div class="adaptive-modal-header">
                <h3>📊 自适应选择器详细报告</h3>
                <button class="adaptive-modal-close">&times;</button>
            </div>
            <div class="adaptive-modal-body">
                <div class="report-section">
                    <h4>📈 统计概览</h4>
                    <div class="report-stats">
                        <div class="report-stat">
                            <span class="report-label">当前策略:</span>
                            <span class="report-value">${report.stats.strategy}</span>
                        </div>
                        <div class="report-stat">
                            <span class="report-label">总轮次:</span>
                            <span class="report-value">${report.stats.rounds}</span>
                        </div>
                        <div class="report-stat">
                            <span class="report-label">总选择数:</span>
                            <span class="report-value">${report.stats.totalSelections}</span>
                        </div>
                        <div class="report-stat">
                            <span class="report-label">独特事件数:</span>
                            <span class="report-value">${report.stats.uniqueEvents}</span>
                        </div>
                        <div class="report-stat">
                            <span class="report-label">平均重复率:</span>
                            <span class="report-value">${report.stats.averageRepeatRate.toFixed(1)}%</span>
                        </div>
                        <div class="report-stat">
                            <span class="report-label">权重调整次数:</span>
                            <span class="report-value">${report.stats.weightAdjustments}</span>
                        </div>
                    </div>
                </div>
                
                <div class="report-section">
                    <h4>🏆 完整权重排行</h4>
                    <div class="report-weights">
                        ${report.weights.map((item, index) => {
                            const consecutive = item.consecutive > 0 ? ` (连续${item.consecutive}次)` : '';
                            return `
                                <div class="report-weight-item">
                                    <span class="weight-rank">${index + 1}</span>
                                    <span class="weight-name">${item.event}</span>
                                    <span class="weight-value">${item.weight.toFixed(3)}</span>
                                    <span class="weight-info">${consecutive}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加模态框样式
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        .adaptive-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .adaptive-modal-content {
            background: white;
            border-radius: 10px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .adaptive-modal-header {
            background: #4CAF50;
            color: white;
            padding: 16px 20px;
            border-radius: 10px 10px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .adaptive-modal-header h3 {
            margin: 0;
            font-size: 18px;
        }

        .adaptive-modal-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        }

        .adaptive-modal-close:hover {
            background: rgba(255,255,255,0.2);
        }

        .adaptive-modal-body {
            padding: 20px;
        }

        .report-section {
            margin-bottom: 24px;
        }

        .report-section h4 {
            margin: 0 0 12px 0;
            color: #333;
            border-bottom: 2px solid #4CAF50;
            padding-bottom: 4px;
        }

        .report-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }

        .report-stat {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            border: 1px solid #e9ecef;
        }

        .report-label {
            color: #666;
            font-weight: bold;
        }

        .report-value {
            color: #4CAF50;
            font-weight: bold;
        }

        .report-weights {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid #ddd;
            border-radius: 6px;
        }

        .report-weight-item {
            display: grid;
            grid-template-columns: 40px 1fr 80px 100px;
            gap: 12px;
            padding: 8px 12px;
            border-bottom: 1px solid #eee;
            align-items: center;
        }

        .report-weight-item:last-child {
            border-bottom: none;
        }

        .weight-rank {
            font-weight: bold;
            color: #666;
            text-align: center;
        }

        .weight-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .weight-value {
            font-weight: bold;
            color: #4CAF50;
            text-align: right;
        }

        .weight-info {
            color: #ff9800;
            font-size: 12px;
            text-align: center;
        }
    `;

    document.head.appendChild(modalStyle);
    document.body.appendChild(modal);

    // 绑定关闭事件
    const closeBtn = modal.querySelector('.adaptive-modal-close');
    const closeModal = () => {
        document.body.removeChild(modal);
        document.head.removeChild(modalStyle);
    };

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// 当自适应选择器可用时自动创建UI
document.addEventListener('DOMContentLoaded', () => {
    // 等待页面完全加载
    setTimeout(() => {
        if (window.AdaptiveEventSelector) {
            createAdaptiveSelectorUI();
            console.log('✅ 自适应选择器UI控制面板已创建');
        }
    }, 3000);
});

// 导出UI创建函数
if (typeof window !== 'undefined') {
    window.createAdaptiveSelectorUI = createAdaptiveSelectorUI;
    window.updateAdaptiveUI = updateAdaptiveUI;
}
