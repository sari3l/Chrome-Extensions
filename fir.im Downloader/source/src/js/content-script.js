// 接收 inject-script 消息
window.addEventListener("message", function(message) {
    $.get(message.data, function (result) {
        // ios xml解析后下载
        parseXML(result)
    }).fail(function () {
        // android 直链下载
        fileDownload(message.data);
    })
}, false);

// 解析 xml，并进行下载
function parseXML(xmlinfo) {
    var finalLink = null;
    var domParser = new  DOMParser();
    var xmlDoc = domParser.parseFromString(xmlinfo, 'text/xml');
    var xmlString = xmlDoc.getElementsByTagName('string');
    for (var i = 0; i < xmlString.length; i++) {
        if (xmlString[i].childNodes[0].nodeValue == 'software-package') {
            finalLink = xmlString[i + 1].childNodes[0].nodeValue;
            break;
        }
    }
    fileDownload(finalLink);
}

// 向 background 传送下载链接
function fileDownload(link) {
    chrome.runtime.sendMessage({url: link}, function (response) {
    });
}