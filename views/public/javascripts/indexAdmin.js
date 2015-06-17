$(function(){
    setTab();
});
$(".nav-item").click(function() {
    $(this).addClass("current");
    $(this).siblings().removeClass("current");
    var name = $(this).attr("name");
    var url = null;
    switch (name) {
        case "item-chat":
            url = "../page/user_chat.html";
            break;
        case "item-user":
            url = "../page/infoManage.html";
            break;
        case "item-esq":
            url = "../page/personManager.html";
            break;
        case "item-repository":
            url = "../page/repository.html";
            break;
    }
    $("#iframe").attr("src",url);
});

/*根据用户类别设置功能菜单*/
function setTab() {
    var type = $("#user-type").text();
    if(type !== "admin"){
        $("span[name='item-esq']").remove();
        $("span[name='item-repository']").remove();
    }
    $(".nav").show();
}

/*设置iframe高度*/
function setFrameHeight(iframe) {
    if (iframe) {
        var iDoc = iframe.contentWindow || iframe.contentDocument.parentWindow;
        if (iDoc.document.body) {
            iframe.height = (iDoc.document.documentElement.scrollHeight || iDoc.document.body.scrollHeight) + 20;
        }
    }
};