var bg = chrome.extension.getBackgroundPage();

$('#default_pass').val(bg.password);

$('#confirm_default_pass').click(function () {
    try{
        bg.password = $('#default_pass').val();
        alertNotifiacation("green", "成功");
    } catch (e) {
        alertNotifiacation("red", "失败");
    }
});

function alertNotifiacation(color, status) {
    var message = "设置密码"+status;
    chrome.notifications.create(null, {
        type: 'basic',
        iconUrl: "/src/img/icon.png",
        title: "",
        message: message
    });
}