class ScreenController {
    constructor() {
        this.wakeLock = null;
        this.wakeLockStartTime = null;
        this.wakeLockTimer = null;
        this.orientationSupported = false;
        this.wakeLockSupported = false;
        
        // 模拟模式相关属性
        this.simulationMode = false;
        this.simulatedOrientation = 'portrait-primary';
        this.simulatedLocked = false;
        
        this.init();
    }
    init() {
        this.checkCompatibility();
        this.bindEvents();
        this.updateOrientationStatus();
        this.startOrientationMonitoring();
        this.checkMobileOptimizations();
        this.log('系统初始化完成');
    }

    // 检查移动设备优化
    checkMobileOptimizations() {
        if (!this.isDesktopEnvironment()) {
            this.log('🔧 移动设备检测到，应用移动优化...', 'info');
            
            // 添加移动设备特定的提示
            this.log('💡 移动设备提示：', 'info');
            this.log('1. 确保允许浏览器全屏访问', 'info');
            this.log('2. 某些浏览器需要用户手势才能锁定方向', 'info');
            this.log('3. 建议在Chrome或Safari中测试', 'info');
            
            // 检查是否在WebView中
            if (this.isInWebView()) {
                this.log('⚠️ 检测到WebView环境，功能可能受限', 'warning');
            }
            
            // 检查浏览器类型
            this.checkMobileBrowserSupport();
        }
    }

    // 检查是否在WebView中
    isInWebView() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('wv') || 
               userAgent.includes('webview') ||
               (userAgent.includes('android') && !userAgent.includes('chrome')) ||
               window.navigator.standalone === true;
    }

    // 检查移动浏览器支持情况
    checkMobileBrowserSupport() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // 检测具体浏览器类型
        if (userAgent.includes('quark')) {
            this.log('⚠️ 夸克浏览器检测到，方向锁定功能可能受限', 'warning');
            this.log('💡 夸克浏览器建议：尝试在设置中开启"允许网页全屏"权限', 'info');
            this.log('💡 或者尝试使用Chrome、Edge等浏览器进行测试', 'info');
        } else if (userAgent.includes('ucbrowser') || userAgent.includes('ucweb')) {
            this.log('⚠️ UC浏览器检测到，方向锁定支持有限', 'warning');
            this.log('💡 建议使用Chrome或系统默认浏览器', 'info');
        } else if (userAgent.includes('miuibrowser')) {
            this.log('⚠️ 小米浏览器检测到，方向锁定支持一般', 'warning');
        } else if (userAgent.includes('huaweibrowser')) {
            this.log('⚠️ 华为浏览器检测到，方向锁定支持一般', 'warning');
        } else if (userAgent.includes('samsungbrowser')) {
            this.log('✅ 三星浏览器检测到，方向锁定支持较好', 'success');
        } else if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
            this.log('✅ Chrome浏览器，方向锁定支持最佳', 'success');
        } else if (userAgent.includes('edg')) {
            this.log('✅ Edge浏览器，方向锁定支持良好', 'success');
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
            this.log('⚠️ Safari浏览器，方向锁定支持有限', 'warning');
            this.log('💡 Safari需要用户手势且可能需要全屏模式', 'info');
        } else if (userAgent.includes('firefox')) {
            this.log('⚠️ Firefox浏览器，方向锁定支持有限', 'warning');
        } else if (userAgent.includes('opera')) {
            this.log('⚠️ Opera浏览器，方向锁定支持一般', 'warning');
        } else {
            this.log('❓ 未知浏览器，方向锁定支持情况不明', 'warning');
            this.log('💡 建议使用Chrome、Edge或系统默认浏览器', 'info');
        }
        
        // 显示浏览器兼容性排行
        this.showBrowserCompatibilityRanking();
    }
    
    // 显示浏览器兼容性排行
    showBrowserCompatibilityRanking() {
        this.log('📊 移动端浏览器兼容性排行（方向锁定API）：', 'info');
        this.log('🥇 最佳：Chrome、Edge、Samsung Browser', 'success');
        this.log('🥈 良好：系统默认浏览器（Android WebView）', 'info');
        this.log('🥉 一般：Safari、Firefox、小米浏览器、华为浏览器', 'warning');
        this.log('❌ 受限：夸克浏览器、UC浏览器、QQ浏览器', 'error');
    }

    // 检查浏览器兼容性
    checkCompatibility() {
        // 检查屏幕方向API支持
        this.orientationSupported = this.checkOrientationSupport();
        const lockSupportElement = document.getElementById('lockSupport');
        
        // 更详细的支持状态显示
        const orientationStatus = this.getOrientationSupportStatus();
        lockSupportElement.innerHTML = orientationStatus.html;
        lockSupportElement.className = orientationStatus.className;

        // 检查Wake Lock API支持
        this.wakeLockSupported = 'wakeLock' in navigator;
        const wakeLockSupportElement = document.getElementById('wakeLockSupport');
        wakeLockSupportElement.textContent = this.wakeLockSupported ? '✅ 支持' : '❌ 不支持';
        wakeLockSupportElement.className = this.wakeLockSupported ? 'text-green-400 font-medium' : 'text-red-400 font-medium';

        // 显示兼容性警告和建议
        if (!this.orientationSupported || !this.wakeLockSupported) {
            document.getElementById('compatibilityWarning').classList.remove('hidden');
            this.showCompatibilityAdvice();
        }

        this.log(`屏幕方向API: ${orientationStatus.message}`);
        this.log(`屏幕常亮API: ${this.wakeLockSupported ? '支持' : '不支持'}`);
        this.log(`当前环境: ${this.getEnvironmentInfo()}`);
    }

    // 检查屏幕方向API支持
    checkOrientationSupport() {
        // 基础API检查
        if (!('screen' in window) || !('orientation' in window.screen)) {
            return false;
        }

        // 检查lock方法是否存在
        if (!('lock' in screen.orientation)) {
            return false;
        }

        return true;
    }

    // 获取方向支持状态详情
    getOrientationSupportStatus() {
        if (!('screen' in window)) {
            return {
                html: '❌ 不支持 (缺少Screen API)',
                className: 'text-red-400 font-medium',
                message: '不支持 - 缺少Screen API'
            };
        }

        if (!('orientation' in window.screen)) {
            return {
                html: '❌ 不支持 (缺少Orientation API)',
                className: 'text-red-400 font-medium',
                message: '不支持 - 缺少Orientation API'
            };
        }

        if (!('lock' in screen.orientation)) {
            return {
                html: '⚠️ 部分支持 (无lock方法)',
                className: 'text-yellow-400 font-medium',
                message: '部分支持 - 可读取方向但无法锁定'
            };
        }

        // 检查是否为桌面环境
        if (this.isDesktopEnvironment()) {
            return {
                html: '⚠️ 桌面环境 (功能受限)',
                className: 'text-yellow-400 font-medium',
                message: '桌面环境 - 方向锁定功能受限'
            };
        }

        return {
            html: '✅ 支持',
            className: 'text-green-400 font-medium',
            message: '完全支持'
        };
    }

    // 检查是否为桌面环境
    isDesktopEnvironment() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // 更全面的移动设备检测
        const mobileKeywords = [
            'android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 
            'iemobile', 'opera mini', 'mobile', 'tablet', 'kindle',
            'silk', 'gt-', 'sm-', 'lg-', 'htc', 'nokia', 'samsung'
        ];
        
        const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // 检查触摸支持
        const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // 检查屏幕尺寸（移动设备通常较小）
        const isSmallScreen = window.screen.width <= 768 || window.screen.height <= 768;
        
        // 检查设备方向API（移动设备通常支持）
        const hasOrientationAPI = 'orientation' in window || 'onorientationchange' in window;
        
        // 综合判断
        const isMobile = isMobileUA || (hasTouchSupport && isSmallScreen) || 
                        (hasTouchSupport && hasOrientationAPI && isSmallScreen);
        
        return !isMobile;
    }

    // 获取环境信息
    getEnvironmentInfo() {
        const isHTTPS = location.protocol === 'https:';
        const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        const isDesktop = this.isDesktopEnvironment();
        
        return `${isDesktop ? '桌面' : '移动'}设备, ${isHTTPS ? 'HTTPS' : 'HTTP'}, ${isLocalhost ? '本地' : '远程'}环境`;
    }

    // 显示兼容性建议
    showCompatibilityAdvice() {
        const isDesktop = this.isDesktopEnvironment();
        const isHTTPS = location.protocol === 'https:';
        
        if (isDesktop) {
            this.log('💡 建议：屏幕方向锁定主要适用于移动设备，桌面浏览器通常不支持此功能', 'warning');
            this.log('💡 测试建议：请在移动设备或使用浏览器开发者工具的设备模拟模式进行测试', 'info');
        }
        
        if (!isHTTPS && location.hostname !== 'localhost') {
            this.log('💡 建议：某些API需要HTTPS环境，建议使用HTTPS或localhost进行测试', 'warning');
        }
    }

    // 绑定事件监听器
    bindEvents() {
        // 屏幕方向控制按钮 - 使用立即执行确保用户激活状态
        document.getElementById('portraitPrimaryBtn').addEventListener('click', (event) => {
            event.preventDefault();
            this.handleOrientationLockWithUserGesture('portrait-primary');
        });
        document.getElementById('portraitSecondaryBtn').addEventListener('click', (event) => {
            event.preventDefault();
            this.handleOrientationLockWithUserGesture('portrait-secondary');
        });
        document.getElementById('landscapePrimaryBtn').addEventListener('click', (event) => {
            event.preventDefault();
            this.handleOrientationLockWithUserGesture('landscape-primary');
        });
        document.getElementById('landscapeSecondaryBtn').addEventListener('click', (event) => {
            event.preventDefault();
            this.handleOrientationLockWithUserGesture('landscape-secondary');
        });
        document.getElementById('unlockOrientationBtn').addEventListener('click', (event) => {
            event.preventDefault();
            this.handleOrientationUnlock();
        });
        
        // 添加模拟模式切换按钮（如果存在）
        const simulationToggle = document.getElementById('simulationToggle');
        if (simulationToggle) {
            simulationToggle.addEventListener('click', () => this.toggleSimulationMode());
        }

        // 屏幕常亮控制按钮
        document.getElementById('enableWakeLockBtn').addEventListener('click', () => this.handleEnableWakeLock());
        document.getElementById('disableWakeLockBtn').addEventListener('click', () => this.handleDisableWakeLock());

        // 清空日志按钮
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());

        // 监听屏幕方向变化
        if (this.orientationSupported) {
            screen.orientation.addEventListener('change', () => this.updateOrientationStatus());
        }

        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        // 监听页面卸载
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    // 处理带用户手势的屏幕方向锁定
    async handleOrientationLockWithUserGesture(orientation) {
        // 确保在用户交互的上下文中立即执行
        this.log(`用户请求锁定屏幕方向: ${orientation}`, 'info');
        
        // 立即尝试锁定，不延迟
        await this.handleOrientationLock(orientation);
    }

    // 处理屏幕方向锁定
    async handleOrientationLock(orientation) {
        // 预检查
        const preCheckResult = this.preCheckOrientationLock();
        if (!preCheckResult.canProceed) {
            this.log(preCheckResult.message, 'error');
            this.showOrientationLockAdvice();
            return;
        }

        try {
            this.log(`尝试锁定屏幕方向: ${orientation}`);
            
            // 解释为什么需要全屏模式
            if (!document.fullscreenElement) {
                this.log('📖 为什么需要全屏模式？', 'info');
                this.log('1. 浏览器安全策略：防止恶意网站随意改变设备方向', 'info');
                this.log('2. 用户体验保护：避免影响系统UI和其他应用', 'info');
                this.log('3. W3C规范要求：方向锁定API需要在全屏上下文中使用', 'info');
                this.log('正在尝试进入全屏模式...', 'info');
                
                try {
                    await this.requestFullscreenWithMultipleMethods();
                    // 等待全屏模式稳定
                    await new Promise(resolve => setTimeout(resolve, 300));
                    this.log('✅ 全屏模式已激活，现在可以锁定方向', 'success');
                } catch (fullscreenError) {
                    this.log('⚠️ 全屏模式请求失败，尝试直接锁定方向', 'warning');
                    this.log('💡 某些浏览器可能不需要全屏模式', 'info');
                }
            }
            
            // 尝试锁定屏幕方向
            await screen.orientation.lock(orientation);
            this.log(`🎯 屏幕方向已成功锁定: ${orientation}`, 'success');
            this.addRotateAnimation();
            
        } catch (error) {
            this.handleOrientationLockError(error, orientation);
        }
    }

    // 预检查方向锁定条件
    preCheckOrientationLock() {
        if (!('screen' in window) || !('orientation' in window.screen)) {
            return {
                canProceed: false,
                message: '屏幕方向API不受支持 - 缺少基础API'
            };
        }

        if (!('lock' in screen.orientation)) {
            return {
                canProceed: false,
                message: '屏幕方向锁定不受支持 - 缺少lock方法'
            };
        }

        // 对移动设备放宽安全上下文检查
        const isMobile = !this.isDesktopEnvironment();
        const isSecure = window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        
        if (!isSecure && !isMobile) {
            return {
                canProceed: false,
                message: '屏幕方向锁定需要安全上下文 (HTTPS或localhost)'
            };
        }

        // 移动设备即使在非安全上下文也尝试执行
        if (!isSecure && isMobile) {
            this.log('⚠️ 非安全上下文，但在移动设备上尝试执行', 'warning');
        }

        return { canProceed: true };
    }

    // 处理方向锁定错误
    handleOrientationLockError(error, orientation) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('not available on this device')) {
            this.log('❌ 当前设备不支持屏幕方向锁定', 'error');
            if (this.isDesktopEnvironment()) {
                this.log('💡 这通常发生在桌面浏览器中，请在移动设备上测试', 'info');
            } else {
                this.log('💡 某些移动浏览器可能限制了此功能', 'info');
            }
        } else if (errorMessage.includes('fullscreen') || errorMessage.includes('document not active')) {
            this.log('❌ 需要全屏模式才能锁定屏幕方向', 'error');
            this.log('💡 正在尝试进入全屏模式...', 'info');
            this.tryFullscreenLock(orientation);
        } else if (errorMessage.includes('user activation') || errorMessage.includes('user gesture')) {
            this.log('❌ 需要用户交互才能锁定屏幕方向', 'error');
            this.log('💡 请确保在用户点击后立即调用此功能', 'info');
        } else if (errorMessage.includes('security') || errorMessage.includes('secure context')) {
            this.log('❌ 安全限制：需要HTTPS环境', 'error');
            this.log('💡 请使用HTTPS或localhost进行测试', 'info');
        } else if (errorMessage.includes('invalid') || errorMessage.includes('not supported')) {
            this.log(`❌ 不支持的方向值: ${orientation}`, 'error');
            this.log('💡 尝试使用标准方向值: portrait-primary 或 landscape-primary', 'info');
        } else if (errorMessage.includes('aborted') || errorMessage.includes('interrupted')) {
            this.log('❌ 方向锁定被中断', 'error');
            this.log('💡 正在重试...', 'info');
            // 延迟重试
            setTimeout(() => {
                this.retryOrientationLock(orientation);
            }, 1000);
        } else {
            this.log(`屏幕方向锁定失败: ${error.message}`, 'error');
            this.log('💡 正在尝试替代方案...', 'info');
            this.tryAlternativeLockMethod(orientation);
        }
        
        console.error('Orientation lock error:', error);
        this.showOrientationLockAdvice();
    }

    // 尝试全屏模式下锁定方向
    async tryFullscreenLock(orientation) {
        try {
            await this.requestFullscreen();
            setTimeout(async () => {
                try {
                    await screen.orientation.lock(orientation);
                    this.log(`全屏模式下屏幕方向已锁定: ${orientation}`, 'success');
                    this.addRotateAnimation();
                } catch (error) {
                    this.log(`全屏模式下方向锁定仍然失败: ${error.message}`, 'error');
                }
            }, 100);
        } catch (error) {
            this.log(`无法进入全屏模式: ${error.message}`, 'error');
        }
    }

    // 请求全屏模式（多种方法尝试）
    async requestFullscreenWithMultipleMethods() {
        const element = document.documentElement;
        const methods = [
            { name: 'requestFullscreen', method: element.requestFullscreen },
            { name: 'webkitRequestFullscreen', method: element.webkitRequestFullscreen },
            { name: 'mozRequestFullScreen', method: element.mozRequestFullScreen },
            { name: 'msRequestFullscreen', method: element.msRequestFullscreen }
        ];
        
        for (const { name, method } of methods) {
            if (method) {
                try {
                    this.log(`尝试使用 ${name} 进入全屏...`, 'info');
                    await method.call(element);
                    this.log('✅ 全屏模式激活成功', 'success');
                    return;
                } catch (error) {
                    this.log(`${name} 失败: ${error.message}`, 'warning');
                    continue;
                }
            }
        }
        
        // 如果所有方法都失败，尝试特殊处理
        await this.tryAlternativeFullscreenMethods();
    }
    
    // 尝试替代全屏方法
    async tryAlternativeFullscreenMethods() {
        this.log('尝试替代全屏方法...', 'info');
        
        // 方法1：尝试视频元素全屏（某些浏览器支持）
        try {
            const video = document.createElement('video');
            video.style.position = 'fixed';
            video.style.top = '0';
            video.style.left = '0';
            video.style.width = '100%';
            video.style.height = '100%';
            video.style.zIndex = '-1';
            video.style.opacity = '0';
            document.body.appendChild(video);
            
            if (video.requestFullscreen) {
                await video.requestFullscreen();
                this.log('✅ 通过视频元素进入全屏模式', 'success');
                return;
            }
        } catch (error) {
            this.log('视频元素全屏方法失败', 'warning');
        }
        
        // 方法2：模拟全屏效果
        this.log('应用模拟全屏效果...', 'info');
        this.applyPseudoFullscreen();
        
        throw new Error('所有全屏方法均失败');
    }
    
    // 应用伪全屏效果
    applyPseudoFullscreen() {
        const style = document.createElement('style');
        style.id = 'pseudoFullscreen';
        style.textContent = `
            body.pseudo-fullscreen {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                z-index: 9999 !important;
                background: #000 !important;
            }
        `;
        document.head.appendChild(style);
        document.body.classList.add('pseudo-fullscreen');
        this.log('⚠️ 应用伪全屏模式（可能无法完全替代真实全屏）', 'warning');
    }
    
    // 请求全屏模式（保持原有方法兼容性）
    async requestFullscreen() {
        return this.requestFullscreenWithMultipleMethods();
    }

    // 重试方向锁定
    async retryOrientationLock(orientation) {
        this.log(`重试锁定屏幕方向: ${orientation}`, 'info');
        try {
            await screen.orientation.lock(orientation);
            this.log(`重试成功，屏幕方向已锁定: ${orientation}`, 'success');
            this.addRotateAnimation();
        } catch (error) {
            this.log(`重试失败: ${error.message}`, 'error');
        }
    }

    // 尝试替代锁定方法
    async tryAlternativeLockMethod(orientation) {
        this.log('尝试替代方向锁定方法...', 'info');
        
        // 方法1: 先进入全屏再锁定
        if (!document.fullscreenElement) {
            try {
                await this.requestFullscreen();
                await new Promise(resolve => setTimeout(resolve, 500));
                await screen.orientation.lock(orientation);
                this.log(`替代方法成功，屏幕方向已锁定: ${orientation}`, 'success');
                this.addRotateAnimation();
                return;
            } catch (error) {
                this.log(`替代方法1失败: ${error.message}`, 'warning');
            }
        }

        // 方法2: 使用不同的方向值
        const alternativeOrientations = {
            'portrait-primary': ['portrait', 'portrait-primary'],
            'landscape-primary': ['landscape', 'landscape-primary'],
            'portrait': ['portrait-primary', 'portrait'],
            'landscape': ['landscape-primary', 'landscape']
        };

        const alternatives = alternativeOrientations[orientation] || [orientation];
        
        for (const altOrientation of alternatives) {
            if (altOrientation !== orientation) {
                try {
                    this.log(`尝试替代方向值: ${altOrientation}`, 'info');
                    await screen.orientation.lock(altOrientation);
                    this.log(`替代方向值成功: ${altOrientation}`, 'success');
                    this.addRotateAnimation();
                    return;
                } catch (error) {
                    this.log(`替代方向值失败: ${altOrientation}`, 'warning');
                }
            }
        }

        this.log('所有替代方法均失败', 'error');
    }

    // 显示方向锁定建议
    showOrientationLockAdvice() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (this.isDesktopEnvironment()) {
            this.log('🔧 桌面环境解决方案:', 'info');
            this.log('1. 使用移动设备或平板电脑进行测试', 'info');
            this.log('2. 在Chrome DevTools中启用设备模拟模式', 'info');
            this.log('3. 尝试进入全屏模式后再锁定方向', 'info');
        } else {
            this.log('🔧 移动设备解决方案:', 'info');
            
            // 针对夸克浏览器的特殊建议
            if (userAgent.includes('quark')) {
                this.log('📱 夸克浏览器专项解决方案:', 'warning');
                this.log('1. 打开夸克浏览器设置 → 网页浏览 → 允许网页全屏', 'info');
                this.log('2. 尝试在夸克浏览器中手动进入全屏模式', 'info');
                this.log('3. 考虑使用Chrome、Edge等标准浏览器', 'info');
                this.log('4. 检查夸克浏览器版本，更新到最新版本', 'info');
            } else if (userAgent.includes('ucbrowser') || userAgent.includes('ucweb')) {
                this.log('📱 UC浏览器解决方案:', 'warning');
                this.log('1. UC浏览器对此API支持很有限，建议更换浏览器', 'info');
                this.log('2. 推荐使用Chrome、Edge或系统默认浏览器', 'info');
            } else {
                this.log('1. 确保使用HTTPS或localhost环境', 'info');
                this.log('2. 确保在用户交互后立即调用API', 'info');
                this.log('3. 尝试进入全屏模式', 'info');
                this.log('4. 检查浏览器权限设置', 'info');
            }
            
            this.log('🏆 推荐浏览器排行:', 'success');
            this.log('1. Chrome (最佳兼容性)', 'success');
            this.log('2. Edge (良好兼容性)', 'success');
            this.log('3. Samsung Internet (良好兼容性)', 'success');
            this.log('4. 系统默认浏览器 (一般兼容性)', 'info');
        }
        
        // 通用建议
        this.log('💡 通用最佳实践:', 'info');
        this.log('• 在用户点击按钮后立即调用API（保持用户激活状态）', 'info');
        this.log('• 优先尝试进入全屏模式', 'info');
        this.log('• 使用HTTPS协议或localhost环境', 'info');
        this.log('• 确保浏览器版本为最新版本', 'info');
    }

    // 处理屏幕方向解锁
    handleOrientationUnlock() {
        if (!this.orientationSupported) {
            this.log('屏幕方向解锁不受支持', 'error');
            return;
        }

        try {
            screen.orientation.unlock();
            this.log('屏幕方向已解锁', 'success');
            this.addRotateAnimation();
        } catch (error) {
            this.log(`屏幕方向解锁失败: ${error.message}`, 'error');
            console.error('Orientation unlock error:', error);
        }
    }

    // 处理启用屏幕常亮
    async handleEnableWakeLock() {
        if (!this.wakeLockSupported) {
            this.log('屏幕常亮功能不受支持', 'error');
            return;
        }

        if (this.wakeLock) {
            this.log('屏幕常亮已经处于激活状态', 'warning');
            return;
        }

        try {
            this.log('正在启用屏幕常亮...');
            this.wakeLock = await navigator.wakeLock.request('screen');
            this.wakeLockStartTime = Date.now();
            
            this.wakeLock.addEventListener('release', () => {
                this.log('屏幕常亮已释放', 'info');
                this.wakeLock = null;
                this.wakeLockStartTime = null;
                this.updateWakeLockStatus();
                this.stopWakeLockTimer();
            });

            this.log('屏幕常亮已启用', 'success');
            this.updateWakeLockStatus();
            this.startWakeLockTimer();
            this.addPulseAnimation();
        } catch (error) {
            this.log(`屏幕常亮启用失败: ${error.message}`, 'error');
            console.error('Wake lock error:', error);
        }
    }

    // 处理禁用屏幕常亮
    handleDisableWakeLock() {
        if (!this.wakeLock) {
            this.log('屏幕常亮未激活', 'warning');
            return;
        }

        try {
            this.wakeLock.release();
            this.log('屏幕常亮已手动关闭', 'success');
        } catch (error) {
            this.log(`屏幕常亮关闭失败: ${error.message}`, 'error');
            console.error('Wake lock release error:', error);
        }
    }

    // 更新屏幕方向状态
    updateOrientationStatus() {
        const currentOrientationElement = document.getElementById('currentOrientation');
        const orientationAngleElement = document.getElementById('orientationAngle');
        const orientationIcon = document.getElementById('orientationIcon');

        if (this.orientationSupported) {
            const orientation = screen.orientation;
            const orientationMap = {
                'portrait-primary': '竖屏',
                'portrait-secondary': '倒置竖屏',
                'landscape-primary': '横屏',
                'landscape-secondary': '倒置横屏'
            };

            currentOrientationElement.textContent = orientationMap[orientation.type] || orientation.type;
            orientationAngleElement.textContent = `${orientation.angle}°`;

            // 更新图标
            orientationIcon.className = orientation.type.includes('landscape') 
                ? 'fas fa-mobile-alt fa-rotate-90 text-2xl text-blue-400'
                : 'fas fa-mobile-alt text-2xl text-blue-400';
        } else {
            currentOrientationElement.textContent = '不支持';
            orientationAngleElement.textContent = '--°';
        }
    }

    // 更新屏幕常亮状态
    updateWakeLockStatus() {
        const wakeLockStatusElement = document.getElementById('wakeLockStatus');
        const wakeLockIcon = document.getElementById('wakeLockIcon');

        if (this.wakeLock) {
            wakeLockStatusElement.textContent = '✅ 已激活';
            wakeLockStatusElement.className = 'text-green-400 font-medium';
            wakeLockIcon.className = 'fas fa-lightbulb text-2xl text-yellow-400 pulse-animation';
        } else {
            wakeLockStatusElement.textContent = '❌ 未激活';
            wakeLockStatusElement.className = 'text-red-400 font-medium';
            wakeLockIcon.className = 'fas fa-lightbulb text-2xl text-gray-400';
        }
    }

    // 开始屏幕方向监控
    startOrientationMonitoring() {
        // 定期更新方向状态
        setInterval(() => {
            this.updateOrientationStatus();
        }, 1000);
    }

    // 开始Wake Lock计时器
    startWakeLockTimer() {
        this.wakeLockTimer = setInterval(() => {
            if (this.wakeLockStartTime) {
                const duration = Date.now() - this.wakeLockStartTime;
                const minutes = Math.floor(duration / 60000);
                const seconds = Math.floor((duration % 60000) / 1000);
                document.getElementById('wakeLockDuration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    // 停止Wake Lock计时器
    stopWakeLockTimer() {
        if (this.wakeLockTimer) {
            clearInterval(this.wakeLockTimer);
            this.wakeLockTimer = null;
        }
        document.getElementById('wakeLockDuration').textContent = '--';
    }

    // 处理页面可见性变化
    async handleVisibilityChange() {
        if (document.visibilityState === 'visible' && this.wakeLockSupported && !this.wakeLock) {
            // 页面重新可见时，如果之前有Wake Lock，尝试重新获取
            this.log('页面重新可见，检查屏幕常亮状态');
        } else if (document.visibilityState === 'hidden') {
            this.log('页面已隐藏');
        }
    }

    // 添加旋转动画
    addRotateAnimation() {
        const orientationIcon = document.getElementById('orientationIcon');
        orientationIcon.classList.add('rotate-animation');
        setTimeout(() => {
            orientationIcon.classList.remove('rotate-animation');
        }, 500);
    }

    // 添加脉冲动画
    addPulseAnimation() {
        const wakeLockIcon = document.getElementById('wakeLockIcon');
        wakeLockIcon.classList.add('pulse-animation');
    }

    // 日志记录
    log(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        const timestamp = new Date().toLocaleTimeString();
        const typeColors = {
            info: 'text-blue-400',
            success: 'text-green-400',
            warning: 'text-yellow-400',
            error: 'text-red-400'
        };
        
        const typeIcons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-times-circle'
        };

        const logEntry = document.createElement('div');
        logEntry.className = `${typeColors[type]} mb-1`;
        logEntry.innerHTML = `
            <span class="text-gray-500">[${timestamp}]</span>
            <i class="${typeIcons[type]} mr-1"></i>
            ${message}
        `;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // 限制日志条数
        const logEntries = logContainer.children;
        if (logEntries.length > 50) {
            logContainer.removeChild(logEntries[0]);
        }
    }

    // 清空日志
    clearLog() {
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = '<div class="text-green-400">[系统] 日志已清空</div>';
    }

    // 清理资源
    cleanup() {
        if (this.wakeLock) {
            this.wakeLock.release();
        }
        if (this.wakeLockTimer) {
            clearInterval(this.wakeLockTimer);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    window.screenController = new ScreenController();
});

// 添加一些实用的全局函数
window.getScreenInfo = () => {
    const info = {
        orientation: screen.orientation ? {
            type: screen.orientation.type,
            angle: screen.orientation.angle
        } : 'Not supported',
        wakeLockActive: window.screenController?.wakeLock ? true : false,
        screenSize: {
            width: screen.width,
            height: screen.height
        },
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };
    
    console.table(info);
    return info;
};

// 在ScreenController类中添加模拟模式方法
ScreenController.prototype.toggleSimulationMode = function() {
    this.simulationMode = !this.simulationMode;
    const status = this.simulationMode ? '已启用' : '已禁用';
    this.log(`🎭 模拟模式${status}`, 'info');
    
    if (this.simulationMode) {
        this.log('💡 在模拟模式下，方向锁定将显示模拟效果', 'info');
        this.enableSimulationMode();
    } else {
        this.disableSimulationMode();
    }
};

ScreenController.prototype.enableSimulationMode = function() {
    // 创建模拟模式提示
    this.createSimulationIndicator();
    this.updateOrientationStatus();
};

ScreenController.prototype.disableSimulationMode = function() {
    // 移除模拟模式提示
    this.removeSimulationIndicator();
    this.simulatedLocked = false;
    this.updateOrientationStatus();
};

ScreenController.prototype.createSimulationIndicator = function() {
    let indicator = document.getElementById('simulationIndicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'simulationIndicator';
        indicator.className = 'fixed top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium z-50';
        indicator.innerHTML = '🎭 模拟模式';
        document.body.appendChild(indicator);
    }
};

ScreenController.prototype.removeSimulationIndicator = function() {
    const indicator = document.getElementById('simulationIndicator');
    if (indicator) {
        indicator.remove();
    }
};

ScreenController.prototype.simulateOrientationLock = function(orientation) {
    this.simulatedOrientation = orientation;
    this.simulatedLocked = true;
    
    const orientationMap = {
        'portrait-primary': '主竖屏',
        'portrait-secondary': '倒置竖屏',
        'landscape-primary': '主横屏',
        'landscape-secondary': '倒置横屏'
    };
    
    this.log(`🎭 模拟锁定屏幕方向: ${orientationMap[orientation]}`, 'success');
    this.addRotateAnimation();
    this.updateSimulatedOrientationStatus();
    
    // 模拟视觉效果
    this.applySimulationVisualEffect(orientation);
};

ScreenController.prototype.simulateOrientationUnlock = function() {
    this.simulatedLocked = false;
    this.log('🎭 模拟解锁屏幕方向', 'success');
    this.addRotateAnimation();
    this.updateSimulatedOrientationStatus();
    this.removeSimulationVisualEffect();
};

ScreenController.prototype.updateSimulatedOrientationStatus = function() {
    if (!this.simulationMode) return;
    
    const currentOrientationElement = document.getElementById('currentOrientation');
    const orientationAngleElement = document.getElementById('orientationAngle');
    const orientationIcon = document.getElementById('orientationIcon');
    
    const orientationMap = {
        'portrait-primary': '主竖屏 (模拟)',
        'portrait-secondary': '倒置竖屏 (模拟)',
        'landscape-primary': '主横屏 (模拟)',
        'landscape-secondary': '倒置横屏 (模拟)'
    };
    
    const angleMap = {
        'portrait-primary': 0,
        'portrait-secondary': 180,
        'landscape-primary': 90,
        'landscape-secondary': 270
    };
    
    if (currentOrientationElement) {
        currentOrientationElement.textContent = orientationMap[this.simulatedOrientation] || this.simulatedOrientation;
    }
    
    if (orientationAngleElement) {
        orientationAngleElement.textContent = `${angleMap[this.simulatedOrientation] || 0}° (模拟)`;
    }
    
    if (orientationIcon) {
        // 根据不同方向设置不同的图标样式
        let iconClass = 'fas fa-mobile-alt text-2xl text-blue-400';
        if (this.simulatedOrientation === 'portrait-secondary') {
            iconClass = 'fas fa-mobile-alt fa-rotate-180 text-2xl text-blue-400';
        } else if (this.simulatedOrientation === 'landscape-primary') {
            iconClass = 'fas fa-mobile-alt fa-rotate-90 text-2xl text-blue-400';
        } else if (this.simulatedOrientation === 'landscape-secondary') {
            iconClass = 'fas fa-mobile-alt text-2xl text-blue-400';
            orientationIcon.style.transform = 'rotate(270deg)';
        } else {
            orientationIcon.style.transform = '';
        }
        orientationIcon.className = iconClass;
    }
};

ScreenController.prototype.applySimulationVisualEffect = function(orientation) {
    const body = document.body;
    body.classList.add('simulation-active');
    
    // 添加CSS样式来模拟方向变化
    if (!document.getElementById('simulationStyles')) {
        const style = document.createElement('style');
        style.id = 'simulationStyles';
        style.textContent = `
            .simulation-active {
                transition: transform 0.5s ease-in-out;
            }
            .simulation-portrait-primary {
                transform: rotate(0deg);
                transform-origin: center center;
            }
            .simulation-portrait-secondary {
                transform: rotate(180deg);
                transform-origin: center center;
            }
            .simulation-landscape-primary {
                transform: rotate(90deg);
                transform-origin: center center;
            }
            .simulation-landscape-secondary {
                transform: rotate(270deg);
                transform-origin: center center;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 移除所有方向类
    body.classList.remove(
        'simulation-portrait-primary', 
        'simulation-portrait-secondary',
        'simulation-landscape-primary', 
        'simulation-landscape-secondary'
    );
    
    // 应用对应的方向类
    const orientationClass = `simulation-${orientation}`;
    body.classList.add(orientationClass);
};

ScreenController.prototype.removeSimulationVisualEffect = function() {
    const body = document.body;
    body.classList.remove(
        'simulation-active', 
        'simulation-portrait-primary', 
        'simulation-portrait-secondary',
        'simulation-landscape-primary', 
        'simulation-landscape-secondary'
    );
};

// 重写handleOrientationLock方法以支持模拟模式
const originalHandleOrientationLock = ScreenController.prototype.handleOrientationLock;
ScreenController.prototype.handleOrientationLock = async function(orientation) {
    if (this.simulationMode) {
        this.simulateOrientationLock(orientation);
        return;
    }
    
    // 如果真实API失败，提供模拟模式选项
    try {
        await originalHandleOrientationLock.call(this, orientation);
    } catch (error) {
        this.log('💡 提示：可以启用模拟模式来体验功能效果', 'info');
        throw error;
    }
};

// 重写handleOrientationUnlock方法以支持模拟模式
const originalHandleOrientationUnlock = ScreenController.prototype.handleOrientationUnlock;
ScreenController.prototype.handleOrientationUnlock = function() {
    if (this.simulationMode) {
        this.simulateOrientationUnlock();
        return;
    }
    
    return originalHandleOrientationUnlock.call(this);
};

// 导出控制器类以便在控制台中使用
window.ScreenController = ScreenController;
