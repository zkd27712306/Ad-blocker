// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 不仅监听complete，还监听loading状态，确保尽早注入
    if ((changeInfo.status === 'complete' || changeInfo.status === 'loading') && tab.url) {
        if (isSearchEngine(tab.url)) {
            injectContentScript(tabId, '标签页更新');
        }
    }
});

// 监听历史状态变化（SPA翻页关键）
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    if (isSearchEngine(details.url)) {
        // 使用更可靠的注入策略
        injectWithRetry(details.tabId, 'HistoryState更新', details.url);
    }
}, { url: [{ schemes: ['http', 'https'] }] });

// 监听导航完成
chrome.webNavigation.onCompleted.addListener((details) => {
    if (isSearchEngine(details.url)) {
        injectContentScript(details.tabId, '导航完成');
    }
}, { url: [{ schemes: ['http', 'https'] }] });

// 监听DOM内容加载完成（这通常在onCompleted之前触发）
chrome.webNavigation.onDOMContentLoaded.addListener((details) => {
    if (isSearchEngine(details.url)) {
        injectContentScript(details.tabId, 'DOM加载完成');
    }
}, { url: [{ schemes: ['http', 'https'] }] });

// 监听导航提交（导航即将开始）
chrome.webNavigation.onCommitted.addListener((details) => {
    if (isSearchEngine(details.url)) {
        // 延迟注入，等待页面开始加载
        setTimeout(() => {
            injectContentScript(details.tabId, '导航提交');
        }, 100);
    }
}, { url: [{ schemes: ['http', 'https'] }] });

// 监听引用片段变化（某些SPA使用这种方式）
chrome.webNavigation.onReferenceFragmentUpdated.addListener((details) => {
    if (isSearchEngine(details.url)) {
        injectWithRetry(details.tabId, '片段更新', details.url);
    }
}, { url: [{ schemes: ['http', 'https'] }] });

// 核心注入函数
function injectContentScript(tabId, source) {
    console.log(`注入内容脚本: 来源=${source}, tabId=${tabId}`);
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
    }).catch(error => {
        // 忽略"无法访问页面"等预期内的错误
        if (!error.message.includes('无法访问页面') && 
            !error.message.includes('Cannot access')) {
            console.log(`注入失败: ${error.message}`);
        }
    });
}

// 带重试的注入（用于关键事件）
function injectWithRetry(tabId, source, url) {
    console.log(`尝试注入(带重试): 来源=${source}, tabId=${tabId}`);
    
    // 第一次快速注入
    injectContentScript(tabId, `${source}-1`);
    
    // 延迟200ms后再次注入，确保覆盖加载完成
    setTimeout(() => {
        injectContentScript(tabId, `${source}-2`);
    }, 200);
    
    // 延迟600ms后第三次注入，覆盖更晚加载的情况
    setTimeout(() => {
        injectContentScript(tabId, `${source}-3`);
    }, 600);
    
    // 延迟1200ms后第四次注入，作为终极保障
    setTimeout(() => {
        injectContentScript(tabId, `${source}-4`);
    }, 1200);
}

// 判断是否是搜索引擎
function isSearchEngine(url) {
    const engines = [
        'baidu.com/s', 'bing.com/search', 'bing.com.cn/search',
        'sogou.com/s', 'sogou.com/web', 'so.com/s', 'so.com/site',
        'yahoo.com/search', 'yahoo.com/news', 'google.com/search',
        'yandex.com/search', 'yandex.ru/search', 'duckduckgo.com'
    ];
    return engines.some(engine => url.includes(engine));
}