var pattaKey = /aKey\s=\s'(\w+)'/;
var pattPassMessage = /该应用设置了安装密码请输入密码继续/;
var aKey = '';
var finalLink = '';
var iosPgyerLink = '';
var iosPgyerSigLink = '';
var needPass = false;
var tabId = 0;
var ipaDownload = false;
var password = '';
var iosLink = ["https://www.pgyer.com/app/plist/", "/install//s.plist"];


// 创建右键菜单
chrome.contextMenus.create({
    title: "从蒲公英下载 ipa ",
    documentUrlPatterns: ["https://www.pgyer.com/*"],
    onclick: start
});

// 获取当前标签页 id & url
function start() {
    try {
        ipaDownload = true;
        chrome.tabs.query(
            {
                lastFocusedWindow: true,
                active: true
            },
            function (tabs) {
                tabId = tabs[0].id;
                downloadProcess(tabs[0].url);
            });
    } catch (e) {
        clear();
    }
}

function downloadProcess(link) {
    try {
        parseLink(link).then(function (){
            beforeGetaKey().then(function () {
                postPassword().then(function () {
                    getaKey().then(function () {
                        if (aKey.length === 0) {
                            return;
                        }
                        finalLink = iosLink[0] + aKey + iosLink[1];
                    }).then(getDownloadLink).then(function (result) {
                        parseXML(result)
                    })
                })
            })
        })
    } catch (e) {
        clear();
    }
}

// 如果发生错误，清除记录，防止污染
function clear() {
    aKey = '';
    finalLink = '';
    iosPgyerLink = '';
    iosPgyerSigLink = '';
    needPass = false;
    tabId = 0;
    ipaDownload = false;
    password = '';
}

// 获取 APP 根路径
async function parseLink (link) {
    var a = document.createElement('a');
    a.href = link;
    var appName = a.pathname.split('/')[1];
    await $.get("https://www.pgyer.com/" + appName);
}

// 预先请求一次，查看是否需要输入密码
async function beforeGetaKey() {
    // 这里需要添加页面判断，是否需要填充密码
    await $.get(iosPgyerLink, function (result) {
        if (result.search(pattPassMessage) !== -1) {
            needPass = true;
        }
    });
}

// 发送密码，并获取sig地址
async function postPassword() {
    if (!needPass) {
        return ;
    }
    await $.ajax({
        url: iosPgyerLink,
        type: 'POST',
        data: {"password": password},
        dataType: "json",
        success: function (result) {
            try {
                if (result.code === "0") {
                    iosPgyerSigLink = result.extra.href;
                } else {
                    alert(result.message);
                    clear()
                }
            } catch (e) {
                clear();
            }
        }
    })
}

// 获取 aKey
async function getaKey(){
    await $.get(iosPgyerSigLink, function (result) {
        try {
            findKey = pattaKey.exec(result);
            if (findKey.length > 0) {
                aKey = findKey[1];
            }
        } catch (e) {
            clear();
        }
    });
}

// apk 直链下载，ipa 解析下载
async function getDownloadLink() {
    return await $.get(finalLink, function (result) {
        return result;
    })
}

// 解析 xml 获取下载链接
function parseXML(xmlinfo) {
    try {
        var xmlString = xmlinfo.getElementsByTagName('string');
        for (var i = 0; i < xmlString.length; i++) {
            if (xmlString[i].childNodes[0].nodeValue == 'software-package') {
                var downlownLink = xmlString[i + 1].childNodes[0].nodeValue;
                console.log(downlownLink);
                downloadAction(downlownLink);
                break;
            }
        }
    } catch (e) {
        clear();
    }
}

// User-Agent 修改
var requestFilter = {
    urls: [
        "https://www.pgyer.com/*"
    ]
};

// 当请求下载 ipa 修改 UA
chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
    if (ipaDownload !== true) {
        return ;
    }
    var headers = details.requestHeaders;
    for(var i = 0, l = headers.length; i < l; ++i) {
        if(headers[i].name == 'User-Agent') {
            // UA 至关重要
            headers[i].value = "itunesstored/1.0 iOS/8.3 model/iPhone6,1 build/12F70 (6; dt:89) Version/11.0 Mobile/15A372 Safari/604.1";
            break;
        }
    }
    return {requestHeaders: headers};
}, requestFilter, ['requestHeaders','blocking']);

// 如果非直接打开 ipa 下载页面，会重定向, 直接获取最后页面地址
chrome.webRequest.onCompleted.addListener(function (details) {
    iosPgyerLink = details.url;
}, requestFilter);

// 文件下载
function downloadAction(link) {
    ipaDownload = false;
    chrome.downloads.download({
        url: link,
        conflictAction: 'uniquify',
        saveAs: false
    });
}

// 监听地址，pgyer.com 下启用
chrome.runtime.onInstalled.addListener(function(){
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function(){
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({pageUrl: {urlContains: 'pgyer.com'}})
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });
});