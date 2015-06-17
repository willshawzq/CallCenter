var socket = null;
var kefu_id = $("#user-id", parent.document).text();
var kefu_nick = $("#user-name", parent.document).text();
var customer_max = $("#customer-max", parent.document).text();
var recorder;
window.URL = window.URL || window.webkitURL;

$(function() {
    socket = io.connect();
    /*客服上线，提交客服信息*/
    socket.on('connect', function() {
        socket.emit('user_connect',{
            kefu_id : kefu_id,
            kefu_nick : kefu_nick,
            customer_max : customer_max
        },function(data) {
            for(var o in data.customer_list){
                addChat("customer", o);
            }
            var online = data.online_kefus;
            //第一次上线，页面上刷新目前在线客服列表
            $.get("/manage",function(data){
                for(var i=0,len=data.length;i<len;i++){
                    if(data[i]["kf_id"] != kefu_id){
                        addChat("user", data[i]["kf_id"], data[i]["kf_nick"]);
                    }
                }

                for(var o in online){
                    kfOnlineStatus(o, "online");
                }
            });
        });
    });

    /*接收一个新的用户*/
    socket.on('new_customer_connect', function(customer_id, callback){
        console.log("new_customer_connect: " + customer_id);
        addChat("customer", customer_id);

        !callback || callback();
    });

    /*用户下线*/
    socket.on('customer_disconnected', function(customer_id){
        console.log("customer_disconnected:"+customer_id);
        removeChat("customer", customer_id);
    });

    /*有其他客服上线*/
    socket.on('user_online', function(kefu) {
        //console.log(kefu);
        console.log("上线客服:"+kefu.nick+" "+kefu.id);//上线客服
        kfOnlineStatus(kefu.id, "online");
    });
    /*有其他客服下线*/
    socket.on('user_offline', function(kefu) {
        //console.log(kefu);
        console.log("下线客服:"+kefu.nick+" "+kefu.id);//上线客服
        //在线客服列表删除离线的客服
        removeChat("user", kefu.id);
        kfOnlineStatus(kefu.id, "offline");
    });
    /*监听来自用户的信息*/
    socket.on('message_from_users', function(data) {
        console.log(data);
        console.log(JSON.stringify(data));
        console.log(data.dataType);
        if(data.dataType === "audio"){
            receiveAudio(data.message, data.from);
        }else {
            receiveMessage(data.message, data.from);
        }
    });

    /*监听来自客服的信息*/
    socket.on('message_from_user', function(data) {
        console.log(data);
        console.log(JSON.stringify(data));
        console.log(data.dataType);
        if(data.dataType === "audio"){
            receiveAudio(data.message, data.from);
        }else {
            receiveMessage(data.message, data.from);
        }
    });

    /*客服再次上线*/
    socket.on('reconnect',function(){

    });
    /*前端初始化*/
    initEmoji();
});

$(".chat-role-btn").on("click", function(){
    var role = $(this).data("role");
    var chats = $(".chat-users");
    if(role == "customer"){
        $(chats[0]).removeClass("hidden");
        $(chats[1]).addClass("hidden")
            .find(".user-current").removeClass("user-current");

        $(this).addClass("current-role");
        $(this).next().removeClass("current-role");
    }else {
        $(chats[1]).removeClass("hidden");
        $(chats[0]).addClass("hidden")
            .find(".user-current").removeClass("user-current");

        $(this).addClass("current-role");
        $(this).prev().removeClass("current-role");
    }
    $(".chat-content").find(".item-current").removeClass("item-current");
    $(".chat-widow").find(".chat-name").text("")
        .parent().find(".item-current").removeClass("item-current");
});

$(".send-icons button").on("click", function(){
    $(".emoji-container").show();
    $("body").on("click", onBodyDown);
});

$(".chat-options-button input").on("click",function(){
    showInputMessage($(".chat-options-input").val());
});

$(".chat-options-input").on("keyup", function(e){
    if(e.keyCode == 13){
        showInputMessage($(this).val());
    }
});

$(".emoji-container").on("click", "img", function(){
    //$(".chat-options-input").val($(".chat-options-input").val()+ "[emoji:" + $(this).attr("title") + "]");
    showInputMessage("[emoji:" + $(this).attr("title") + "]");
    $(".emoji-container").hide();
});

$(".chat-users li").on("click",function(){
    var $parent = $(this).parents("ul");
    var $prev = $parent.find(".user-current");
    $prev.removeClass("user-current");
    var prevChatId = $prev.attr("name");
    $("#"+prevChatId).removeClass("item-current");

    /*设置当前选中样式*/
    $(this).addClass("user-current");
    $(this).find(".unread-msg").css("visibility", "hidden").html("0");
    var name = $(this).find(".user-name span:first-child").text();
    $(".chat-name").text(name);
    var chatId = $(this).attr("name");
    $(this).insertBefore($parent.children("li")[0]);
    /*设置内容框显示样式*/
    $("#"+chatId).addClass("item-current");
});


$(".send-images input").on("change", function(){
    if (this.files.length != 0) {
        var file = this.files[0],
            reader = new FileReader();
        if (!reader) {
            //that._displayNewMsg('system', '!your browser doesn\'t support fileReader'//
            this.value = '';
            return;
        };
        reader.onload = function(e) {
            this.value = '';
            var msg = "<img class='image' src='" + e.target.result + "' >";
            showInputMessage(msg);
        };
        reader.readAsDataURL(file);
    };
});

$("#startRecording").on("click", function(){
    HZRecorder.get(function (rec) {
        recorder = rec;
        recorder.start();
    });
});

$("#stopRecording").on('click', function() {
    recorder.stop();
});

$("#playRecording").on('click', function() {
    recorder.play($(".send-audio audio")[0]);
});

$("#emitAudio").on("click", function(){
    var customer_id = $(".item-current").attr("id");
    if(!customer_id) return;
    var blob = recorder.getBlob();
    recorder.upload("/audioData_upload", function (state, obj) {
        if(state === "success"){
            //that.socket.emit('newRecorder', obj.filePath);
            //that._emitMessage({msg: obj.filePath, type: "audio"});
            showAudioInput();
        }else {
            alert("error");
        }
    });
});

function kfOnlineStatus(id, type){
    var list = $(".chat-users ul")[1];
    var $item = $(list).find("li[name='"+id+"']");
    console.log("------------------------------");
    console.log($item);
    if(type == "online"){
        $item.removeClass("offline-status").addClass("online-status");
    }else {
        $item.removeClass("online-status").addClass("offline-status");
    }
}

function showInputMessage(text) {
    var template = null;
    var customer_id = $(".item-current").attr("id");

    if(!text) return;
    if(!customer_id) return;

    var result = showEmoji(text);
    if($(window).width() >= 1400){
        template = "user-template";
    }else {
        template = "esq-template";
    }
    var $text = $("."+template).clone(true);
    $text.removeClass("hidden")
        .removeClass(template)
        .addClass(template+"-added")
        .find(".message-text").append(result);

    $(".item-current").append($text);
    $(".chat-options-input").val("");
    var $content = $(".chat-content")[0];
    $content.scrollTop = $content.scrollHeight;

    var role = $(".user-current").parents(".chat-users").data("role");
    //调用soketi.io信息提交函数
    emitChatMessage(customer_id, text, "txt", role);
}

function emitChatMessage(customer_id, msg, type, role){
    console.log("id:"+customer_id+",msg:"+msg);
    role = (role == "esqs") ? "message_to_kefu" : "message_to_customer";
    socket.emit(role, {
        to: customer_id,
        from: kefu_id,
        message: msg,
        dataType: type
    });
}

function receiveMessage(msg, from) {
    console.log("msg:"+msg+",id:"+from);
    var $text = $(".user-template").clone(true);

    var result = showEmoji(msg);

    $text.removeClass("hidden")
        .removeClass("user-template")
        .addClass("user-template-added")
        .find(".message-text").append(result);

    $("#"+from).append($text);

    var $content = $(".chat-content")[0];
    $content.scrollTop = $content.scrollHeight;

    var $left = $(".chat-users li[name='"+from+"']");
    $left.find(".user-info").text(msg);
    $left.find(".update-time").text(getTime());

    if($(".item-current").attr("id") !== from){
        var $unMsg = $left.find(".unread-msg");
        $unMsg.html(parseInt($unMsg.html())+1);
        $unMsg.css("visibility", "visible");
    }
}

function showAudioInput(){
    var template = null;
    var customer_id = $(".item-current").attr("id");

    if($(window).width() >= 1400){
        template = "user-template";
    }else {
        template = "esq-template";
    }
    var $text = $("."+template).clone(true);

    var audioId = "audio-" + $("audio").length;
    var audio = $("<audio controls id='"+audioId+"'></audio>")[0];
    audio.src = window.URL.createObjectURL(recorder.getBlob());
    //调用soketi.io信息提交函数
    uploadAudio(customer_id);

    $text.removeClass("hidden")
        .removeClass(template)
        .addClass(template+"-added")
        .find(".message-text").append(audio);

    $(".item-current").append($text);
    $(".chat-options-input").val("");
    var $content = $(".chat-content")[0];
    $content.scrollTop = $content.scrollHeight;
}

function uploadAudio(customer_id){
    recorder.upload("/audioData_upload", function (state, obj) {
        if(state === "success"){
            //that.socket.emit('newRecorder', obj.filePath);
            var role = $(".user-current").parents(".chat-users").data("role");
            emitChatMessage(customer_id, obj.filePath, "audio", role);
        }else {
            alert("语音发送失败~");
        }
    });
}

function receiveAudio(path, from) {
    console.log("msg:"+path+",id:"+from);
    var $text = $(".user-template").clone(true);
    var audioId = "audio-" + $("audio").length;
    var audio = $("<audio controls id='"+audioId+"'></audio>");

    $text.removeClass("hidden")
        .removeClass("user-template")
        .addClass("user-template-added")
        .find(".message-text").append(audio);

    $("#"+from).append($text);

    var $content = $(".chat-content")[0];
    $content.scrollTop = $content.scrollHeight;

    var $left = $(".chat-users li[name='"+from+"']");
    $left.find(".user-info").text("语音");
    $left.find(".update-time").text(getTime());

    playAudio(audio[0], path);
}

function playAudio(audio, path) {
    window.URL = window.URL || window.webkitURL;
    if (typeof history.pushState == "function") {
        var xhr = new XMLHttpRequest();
        var path = path.split("\\")[2];
        xhr.open("get", "/audioData_upload/"+path, true);
        xhr.responseType = "blob";
        xhr.onload = function() {
            if (this.status == 200) {
                var blob = this.response;
                audio.onload = function(e) {
                  window.URL.revokeObjectURL(audio.src); // 清除释放
                };
                audio.src = window.URL.createObjectURL(blob);
            }
        }
        xhr.send();
    }
}

function initEmoji(){
    var emoji = document.querySelectorAll(".emoji-container")[0];
    console.log(emoji);
    var frag = document.createDocumentFragment();
    for (var i = 69; i > 0; i--) {
        var item = document.createElement('img');
        item.src = '../images/emoji/' + i + '.gif';
        item.title = i;
        frag.appendChild(item);
    };
    emoji.appendChild(frag);
}

function showEmoji(msg) {
    var match, result = msg,
        reg = /\[emoji:\d+\]/g,
        emojiIndex,
        totalEmojiNum = $(".emoji-container img").length;
    while (match = reg.exec(msg)) {
        emojiIndex = match[0].slice(7, -1);
        if (emojiIndex > totalEmojiNum) {
            result = result.replace(match[0], '[X]');
        } else {
            result = result.replace(match[0], '<img class="emoji" src="../images/emoji/' + emojiIndex + '.gif" />');
        };
    };
    return result;
}

function onBodyDown(e){
    if((e.target === $(".emoji-container")[0]) ||
        $.contains($(".emoji-container")[0], e.target)){
        return;
    }else if(e.target === $(".send-icons button")[0] ||
        $.contains($(".send-icons button")[0], e.target)){
        return;
    }else {
        $(".emoji-container").hide();
        $("body").off("click", onBodyDown);
    }
}

function addChat(type, id, nick){
    nick = !nick ? id : nick;
    type = (type == "customer") ? 0 : 1;

    var temps = $(".user-list-template");
    var $copy = $(temps[type]).clone(true);
    $copy.removeClass("user-list-template")
        .attr("name", id)
        .find(".user-nick").text(nick)
        .next(".update-time").text(getTime());

    var chats = $(".chat-users ul");
    $(chats[type]).append($copy);



    $copy = $(".content-item-template").clone(true);
    $copy.removeClass("content-item-template")
        .addClass("content-item")
        .attr("id", id);
    $(".chat-content").append($copy);
}

function removeChat(type, id){
    console.log("removeChat:"+id);

    var chats = $(".chat-users ul");
    if(type == "customer"){
        $(chats[0]).find("li[name='"+id+"']").remove();
    }else {
        //$(chats[1]).find("li[name='"+id+"']").remove();
    }
    $("#"+id).remove();
}

function getTime(){
    var date = new Date();
    var hour = date.getHours();
    var minute = date.getMinutes();
    return hour + ":" + minute;
}