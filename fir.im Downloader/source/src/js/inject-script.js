// 注入页面
document.getElementsByClassName('app-brief')[0].insertAdjacentHTML('beforebegin','<div style="position: relative;"><div id="popup_content"><br><button onclick="hidePopup()">Close</button></div></div>');

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    showLinks(message);
});

function showLinks(message) {
    showPopup(500,522);
    document.getElementById('popup_content').insertAdjacentHTML('afterBegin', parseMessage(message));
}

function showPopup(w,h) {
    var popUp = document.getElementById("popup_content");
    popUp.style.width = w + "px";
    popUp.style.height = h + "px";
    popUp.style.visibility = "visible";
    popUp.style.position = "absolute";
    popUp.style.zIndex = "100";
    popUp.style.left = "100px";
    popUp.style.marginLeft = "auto";
    popUp.style.marginRight = "auto";
    popUp.style.background = "white";
}

function hidePopup() {
    var popUp = document.getElementById("popup_content");
    popUp.style.visibility = "hidden";
}

function parseMessage(message) {
    tableText = "<tr><th>branch</th>" +
        "<th>latest time</th>" +
        "<th>file size</th>" +
        "<th>version</th>" +
        "<th>build</th>" +
        "<th>download</th></tr>";
    for (var i=0; i<message.length; i++) {
        tableText = tableText +
            "<tr>" +
            "<td>"+message[i].branch+"</td>" +
            "<td>"+unixToDate(message[i].latestTime)+"</td>" +
            "<td>"+readablizeBytes(message[i].fsize)+"</td>" +
            "<td>"+message[i].version+"</td>" +
            "<td>"+message[i].build+"</td>" +
            "<td><button onclick=doDownload('"+message[i].link+"')>下载</button></td>" +
            "</tr>";
    }
    return "<table border='1' style='margin:auto'>" + tableText + "</table>";
}

function doDownload(link) {
    window.postMessage(link, '*');
}

function unixToDate(time) {
    var date = new Date(time*1000);
    Y = date.getFullYear() + '-';
    M = (date.getMonth()+1 < 10 ? '0'+(date.getMonth()+1) : date.getMonth()+1) + '-';
    D = date.getDate() + ' ';
    h = date.getHours() + ':';
    m = date.getMinutes() + ':';
    s = date.getSeconds();
    return Y+M+D+h+m+s;
}

function readablizeBytes(bytes) {
    var s = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes)/Math.log(1024));
    return (bytes/Math.pow(1024, Math.floor(e))).toFixed(2)+" "+s[e];
}