var lists = [];
var baseLink = ["https://download.fir.im/apps/","/install?download_token=","&release_id="];

// 右键菜单
chrome.contextMenus.create({
    title: "从 fir.im 下载",
    contexts: ['image'],
    documentUrlPatterns: ["https://fir.im/*"],
    onclick: anaylize
});

// 开始分析链接
function anaylize() {
    lists = [];
    var current_url = "";
    chrome.tabs.query(
        {
            lastFocusedWindow: true,
            active: true
        },
        function (tabs) {
            current_url = tabs[0].url;
            chrome.tabs.executeScript(tabs[0].id, {file: 'src/js/inject-script.js'});
            getDownloadInfo(current_url);
            chrome.tabs.sendMessage(tabs[0].id, lists)
        });
}

// 获取信息json
function getDownloadInfo(current_url){
    var a = document.createElement('a');
    a.href = current_url;
    var appName = a.pathname.split('/')[1];
    var downloadLink = "https://download.fir.im/" + appName;
    // 同步请求
    $.ajax({
        url: downloadLink,
        async: false,
        type: "GET",
        success: function (result) {
            getDownloadLink(result);
        }
    });
}

// 准备解析json
function getDownloadLink(obj){
    var frontLink = baseLink[0] + obj.app.id + baseLink[1] + obj.app.token + baseLink[2];
    // master
    if ("master" in obj.app.releases){
        parseJSON(frontLink,[obj.app.releases.master], 'master')
    }
    // history
    if ("history" in obj.app.releases){
        parseJSON(frontLink, obj.app.releases.history, 'history')
    }
}

// 解析 json 信息并返回给popup
function parseJSON(frontLink, jsonInfoList, branch){
    for (var i=0; i<jsonInfoList.length; i++){
        var link = frontLink + jsonInfoList[i].id;
        var latestTime = jsonInfoList[i].created_at;
        var version = jsonInfoList[i].version;
        var build = jsonInfoList[i].build;
        var fsize = jsonInfoList[i].fsize;
        lists.push({
            branch: branch,
            link: link,
            latestTime: latestTime,
            version: version,
            build: build,
            fsize: fsize
        });
    }
}

// User-Agent修改
var requestFilter = {
    urls: [
        "https://download.fir.im/apps/*"
    ]
};

chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    var headers = details.requestHeaders;
    for(var i = 0, l = headers.length; i < l; ++i) {
        if( headers[i].name == 'User-Agent' ) {
            headers[i].value = "itunesstored/1.0 iOS/8.3 model/iPhone6,1 build/12F70 (6; dt:89)";
            break;
        }
    }
    return {requestHeaders: headers};
}, requestFilter, ['requestHeaders','blocking']);

// 监听地址，fir.im下启用
chrome.runtime.onInstalled.addListener(function(){
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    // 只有打开百度才显示pageAction
                    new chrome.declarativeContent.PageStateMatcher({pageUrl: {urlContains: 'fir.im'}})
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.url) {
        chrome.downloads.download({
            url: message.url,
            conflictAction: 'uniquify',
            saveAs: false
        })
    }
});