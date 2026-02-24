// ============================================
// 终极搜索引擎净化器 · 最小改动版
// 只修复搜狗搜索结果误删问题
// ============================================

(function() {
    'use strict';
    
    console.log('🔍 终极搜索引擎净化器启动 (最小改动版)');
    
    // ===== 搜索引擎检测 =====
    function getSearchEngine() {
        const url = window.location.href;
        const host = window.location.hostname;
        
        if (host.includes('baidu.com')) return 'baidu';
        if (host.includes('bing.com')) return 'bing';
        if (host.includes('sogou.com')) return 'sogou';
        if (host.includes('so.com')) return '360';
        if (host.includes('yahoo.com')) return 'yahoo';
        if (host.includes('google.com')) return 'google';
        if (host.includes('yandex')) return 'yandex';
        if (host.includes('duckduckgo.com')) return 'duckduckgo';
        
        return 'unknown';
    }
    
    const engine = getSearchEngine();
    console.log(`当前搜索引擎: ${engine}`);
    
    // ===== URL净化函数 =====
    function cleanSearchUrl() {
        try {
            const currentUrl = window.location.href;
            
            // 360搜索URL净化
            if (engine === '360' && currentUrl.includes('so.com/s?')) {
                const urlObj = new URL(currentUrl);
                const searchQuery = urlObj.searchParams.get('q');
                if (!searchQuery) return;
                
                // 只保留q参数
                const cleanUrl = `https://www.so.com/s?q=${encodeURIComponent(searchQuery)}`;
                
                if (currentUrl !== cleanUrl && !sessionStorage.getItem('360_redirected_' + searchQuery)) {
                    console.log('🔄 净化360搜索URL...');
                    sessionStorage.setItem('360_redirected_' + searchQuery, 'true');
                    window.location.replace(cleanUrl);
                }
            }
            
            // 必应URL净化
            if (engine === 'bing' && (currentUrl.includes('bing.com/search') || currentUrl.includes('bing.com.cn/search'))) {
                const urlObj = new URL(currentUrl);
                const searchQuery = urlObj.searchParams.get('q');
                if (!searchQuery) return;
                
                const cleanUrl = `https://${urlObj.hostname}/search?q=${encodeURIComponent(searchQuery)}`;
                
                if (currentUrl !== cleanUrl && !sessionStorage.getItem('bing_redirected_' + searchQuery)) {
                    console.log('🔄 净化必应URL...');
                    sessionStorage.setItem('bing_redirected_' + searchQuery, 'true');
                    window.location.replace(cleanUrl);
                }
            }
        } catch (e) {}
    }
    
    // ===== 广告特征库 =====
    const AD_FEATURES = {
        // 广告文字
        textMarkers: ['广告', '推广', '赞助商', '商业推广', 'Sponsored', 'Ad', 'Advertisement'],
        
        // 通用广告类名
        genericClasses: [
            'ad', 'ads', 'advert', 'sponsor', 'promote',
            'ad-', 'ads-', 'sponsored', 'promoted'
        ],
        
        // 搜索引擎特定选择器
        selectors: {
            baidu: [
                '#content_right', '#e_idea_container',
                '.ec_wisead', '.ec-ad', '.ec_ads',
                '.EC_result[srcid="213"]',
                '.EC_result[srcid="217"]',
                '.EC_result[srcid="204"]',
                '.EC_result[srcid="2210"]',
                '.EC_result[srcid="2134"]',
                '.rjegd1t', '.m12mvnb',
                '.ec-tuiguang', '[data-tuiguang]',
                '.c-text-hot', '.c-text-new'
            ],
            bing: [
                '.b_ad', '#b_results .b_ad',
                '.b_adSlot', '.ad-b',
                '.sb_ad', '.sb_adTA',
                '.sb_ad2', '.sb_ads',
                '.b_ads', '[data-bm="4"]'
            ],
            sogou: [
                '.rb', '.rb-ad', '.ad-zone',
                '.ad-item', '#ad', '.ad-container',
                '.ad-img', '.pic-ad', '.image-ad',
                '#aside', '.aside-ad', '.right-ad',
                '.sidebar-ad', '.bottom-ad', '.footer-ad',
                '[class*="hot-"]', '[class*="trending"]',
                '.hot-news', '.trending-list',
                // 新增搜狗广告选择器
                'iframe[src*="c.gdt.qq.com"]',
                '[data-role="ad"]',
                '.ads-wrapper',
                '.result-ad',
                '.sponsor-result'
            ],
            '360': [
                '.top-ad', '.header-ad', '#top-ad',
                '.bottom-ad', '.footer-ad', '#bottom-ad',
                '.right-bottom-ad', '.corner-ad',
                '.float-ad', '.popup-ad',
                '[class*="guess"]', '.guess-you-like',
                '[class*="related"]', '.related-product',
                '[class*="interest"]', '.you-may-like',
                '[class*="hot"]', '.hot-search',
                '.hot-list', '.hot-img', '.hot-pic',
                // 新增360侧边栏广告选择器
                '#sidebar', '.sidebar', '.right-side',
                '.right-aside', '.aside-content',
                '.module-hot', '.hot-module',
                '.recommend-box', '.recommend-module',
                '.related-words', '.related-searches',
                '.right-container', '.right-box',
                '.right-wrapper', '.right-module',
                '.aside-right', '.right-ad-side',
                '[class*="right-ad"]', '[id*="right-ad"]',
                '[class*="sidebar-ad"]', '[id*="sidebar-ad"]',
                '.ad-right', '.ad-sidebar'
            ],
            yahoo: [
                '.right-rail', '.sidebar',
                '.trending-now', '.hot-now',
                '.ads-container', '.ad-module',
                '.sponsored', '.sponsored-content',
                '.taboola', '.trc-content',
                '[class*="taboola"]',
                '[id*="taboola"]'
            ],
            google: [
                '.ads-ad', '.adsbygoogle',
                '.ad-container', '.ad-wrapper',
                '.ad-div', '.ad-card',
                '#tads', '#tadsb',
                '.commercial', '.pla-unit',
                '.shopping-ad'
            ],
            yandex: [
                '.serp-item_ad',
                '.advertisement',
                '.ads',
                '.direct',
                '.yandex-ads'
            ],
            duckduckgo: [
                '.ad',
                '.ads',
                '.sponsored',
                '.ad-link',
                '.result--ad',
                '[data-sponsor]'
            ]
        }
    };
    
    // ===== 添加一个安全的结果白名单（只用于搜狗）=====
    const SOGOU_RESULT_SELECTORS = [
        '.rb',  // 搜狗的标准结果类
        '.vr-result', // 垂直结果
        '.web-result', // 网页结果
        '.search-result' // 搜索结果
    ];
    
    // ===== 广告识别（仅修改搜狗部分）=====
    function isAdElement(element) {
        if (!element || !element.innerText) return false;
        
        const text = element.innerText;
        const className = element.className || '';
        const id = element.id || '';
        
        // 针对搜狗的特别处理：如果是标准结果类，需要仔细判断
        if (engine === 'sogou') {
            // 检查是否是标准搜索结果（这些应该保留）
            for (let selector of SOGOU_RESULT_SELECTORS) {
                if (element.matches && element.matches(selector)) {
                    // 即使是搜索结果，如果明确包含广告文字才删除
                    if (text.includes('广告') || text.includes('推广')) {
                        return true;
                    }
                    return false; // 正常搜索结果，保留
                }
            }
        }
        
        // 检查广告文字
        if (AD_FEATURES.textMarkers.some(marker => text.includes(marker))) {
            return true;
        }
        
        // 检查类名
        if (AD_FEATURES.genericClasses.some(keyword => 
            className.includes(keyword) || id.includes(keyword)
        )) {
            return true;
        }
        
        // 检查特定选择器
        const engineSelectors = AD_FEATURES.selectors[engine] || [];
        for (let selector of engineSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
        }
        
        // 检查子元素
        if (element.querySelector('.ec-tuiguang, [data-tuiguang], .c-text-hot, .c-text-new')) {
            return true;
        }
        
        // 检查搜狗广告特有的iframe
        if (engine === 'sogou' && element.querySelector('iframe[src*="c.gdt.qq.com"]')) {
            return true;
        }
        
        return false;
    }
    
    // ===== 清除广告 =====
    function removeAds() {
        try {
            let count = 0;
            
            // 收集所有可能的结果
            const candidates = document.querySelectorAll(
                '#content_left > div, #content_left .result, #content_left .c-container, ' +
                '#b_results > li, .algo, .result, .web-result, ' +
                '[srcid], [data-placeid], .EC_result, .gp2k11k, ' +
                '#main .rb, .vr-wrap, .result-wrap'
            );
            
            candidates.forEach(el => {
                if (isAdElement(el)) {
                    el.style.display = 'none';
                    el.remove ? el.remove() : null;
                    count++;
                }
            });
            
            // 针对360搜索清除侧边栏和右侧区域
            if (engine === '360') {
                // 清除所有可能的侧边栏和右侧区域
                const sideElements = [
                    '#sidebar', '.sidebar', '.right-side',
                    '.right-aside', '.aside-content', '.hot-module',
                    '.recommend-box', '.right-box', '.right-wrapper',
                    '.right-module', '.aside-right', '.right-container',
                    '#right', '.right', '.right-col', '#right-col',
                    '#rightColumn', '.rightColumn', '#right-column',
                    '#side', '.side', '.side-bar', '#side-bar'
                ];
                
                sideElements.forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        el.style.display = 'none';
                        count++;
                    });
                });
                
                // 清除任何带广告特征的div
                document.querySelectorAll('div[class*="ad"], div[id*="ad"], div[class*="hot"], div[id*="hot"], div[class*="recommend"], div[id*="recommend"]').forEach(el => {
                    if (!el.querySelector('#main, .result, .search-result')) { // 避免误删搜索结果
                        el.style.display = 'none';
                        count++;
                    }
                });
            }
            
            // 针对搜狗的额外处理（但使用更保守的策略）
            if (engine === 'sogou') {
                // 只删除明确的广告容器，不删除搜索结果
                document.querySelectorAll('iframe[src*="c.gdt.qq.com"], #aside, .aside-ad, .right-ad, .sidebar-ad').forEach(el => {
                    el.style.display = 'none';
                    el.remove ? el.remove() : null;
                    count++;
                });
            }
            
            // 清除右侧广告栏
            document.querySelectorAll('#content_right, .b_right, .right-rail, .sidebar').forEach(el => {
                el.style.display = 'none';
                count++;
            });
            
            // 清除Taboola相关
            document.querySelectorAll('[class*="taboola"], [id*="taboola"], a[href*="taboola"]').forEach(el => {
                el.style.display = 'none';
                el.remove ? el.remove() : null;
                count++;
            });
            
            if (count > 0) {
                console.log(`✅ ${engine}: 清除 ${count} 个广告`);
            }
            
        } catch (e) {
            console.log('清除出错:', e);
        }
    }
    
    // ===== 多重监控机制（保持不变）=====
    
    // 1. MutationObserver - 监控DOM变化
    const observer = new MutationObserver((mutations) => {
        let hasNewContent = false;
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                hasNewContent = true;
                break;
            }
        }
        if (hasNewContent) {
            setTimeout(removeAds, 50);
            setTimeout(removeAds, 150);
        }
    });
    
    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // 2. 监听点击事件（捕获翻页）
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.tagName === 'A' && target.href) {
            // 必应翻页、百度翻页等
            if (target.href.includes('first=') || 
                target.href.includes('pn=') || 
                target.href.includes('page=') ||
                target.href.includes('&q=')) {
                setTimeout(removeAds, 200);
                setTimeout(removeAds, 400);
                setTimeout(removeAds, 800);
            }
        }
    }, true);
    
    // 3. 监听URL变化（History API）
    let lastUrl = window.location.href;
    const urlObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            console.log('URL变化，重新清除广告');
            setTimeout(removeAds, 150);
            setTimeout(removeAds, 300);
            setTimeout(removeAds, 600);
        }
    });
    
    if (document.body) {
        urlObserver.observe(document.body, { subtree: true, childList: true });
    }
    
    // 4. 监听popstate（前进后退）
    window.addEventListener('popstate', () => {
        setTimeout(removeAds, 150);
        setTimeout(removeAds, 300);
    });
    
    // 5. 监听hashchange
    window.addEventListener('hashchange', () => {
        setTimeout(removeAds, 150);
    });
    
    // 6. 定时扫描（终极保障）
    setInterval(removeAds, 1000);
    
    // 7. 监听滚动（懒加载）
    let scrollTimer;
    window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(removeAds, 200);
    }, { passive: true });
    
    // 8. 捕获可能的AJAX请求（通过拦截XHR）
    try {
        const originalFetch = window.fetch;
        window.fetch = function() {
            return originalFetch.apply(this, arguments).then(response => {
                setTimeout(removeAds, 100);
                return response;
            });
        };
        
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function() {
            this.addEventListener('load', () => {
                setTimeout(removeAds, 100);
            });
            return originalXHROpen.apply(this, arguments);
        };
    } catch (e) {}
    
    // ===== 初始化 =====
    function init() {
        // 执行URL净化
        cleanSearchUrl();
        
        // 多次执行确保彻底
        removeAds();
        setTimeout(removeAds, 200);
        setTimeout(removeAds, 400);
        setTimeout(removeAds, 600);
        setTimeout(removeAds, 1000);
        setTimeout(removeAds, 2000);
        
        console.log(`✅ ${engine} 净化器已启动，监控已激活`);
    }
    
    // 启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();