window.onload = function() {
    var hichat = new HiChat();
    hichat.init();
};
var HiChat = function() {
    this.socket = null;
};
HiChat.prototype = {
    init: function() {
        var that = this;
        this.socket = io.connect();
        var customer_id = "kf1_room"+Math.round(3*(Math.random())+1);
        alert("customer_id:"+customer_id);
        this.socket.on('connect', function (socket) {
            console.log(this.socket);
            //用户连接到服务器，请求客服。
            that.socket.emit('customer_connect',{
                customer_id : customer_id
            }, function (data, kefu_name, kefu_id, msg){
                if (data === 'success') {
                    //用户成功接入客服，在客服的socket中记录对应客服的socket信息，方便后面对应制定客服发信息
                    that.socket.name = {
                        user_name : customer_id,
                        user_type : "customer"
                    };
                    that.socket.kefu = {
                        name : kefu_name,
                        id : kefu_id
                    }
                    console.log(that.socket);
                    //可以对指定的客服发送信息
                    that._setStatus("success", msg);
                    //that._displayNewMsg(kefu_name, msg);
                }else if (data === 'busy') {
                    //用户聊天界面为灰，不能发送信息，提示客服忙，等待接入
                    that._setStatus("busy", "客服忙");
                }else if (data === 'none') {
                    //data.state === 'none',用户聊天界面为灰，不能发送信息，提示没有客服在线
                   that._setStatus("none", "无客服在线");
                }else {
                    that._setStatus("failed", "无法连接客服");
                }
            });
        });
        this.socket.on("message_from_kefu", function (data) {
            if(data.dataType === "audio"){
                that._displayAudioUser(data.from, data.message);
            }else {
                that._displayNewMsg(data.from, data.message);
            }
        });
        this.socket.on("user_disconnected", function (kefu_id){
             //提示用户下线，暂时无法进行聊天，但是上面的聊天记录不会被遮罩，还是可以看到之前的聊天记录的
             console.log(kefu_id + "以下线。")
        });
        this.socket.on('reconnect',function(){
        });

        this._initialEmoji();
        this._addBtnClick();
    },

    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../images/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _addBtnClick: function() {
        var that = this;
        var recorder;

        var audio = document.querySelector('audio');
        window.URL = window.URL || window.webkitURL;
        document.getElementById('recorder').addEventListener('click', function(){
            var wrapper = document.getElementById('recorderWrapper');

            if(wrapper.style.display == 'none'){
                document.getElementById('emojiWrapper').style.display = 'none';
                wrapper.style.display = 'block';
            }else {
                wrapper.style.display = 'none';
            }
        });
        document.getElementById('startRecording').addEventListener('click', function() {
            HZRecorder.get(function (rec) {
                recorder = rec;
                recorder.start();
            });
        }, false);

        document.getElementById('stopRecording').addEventListener('click', function() {
            recorder.stop();
        }, false);

        document.getElementById('playRecording').addEventListener('click', function() {
            recorder.play(audio);
        }, false);

        document.getElementById('emitAudio').addEventListener('click', function() {
            var blob = recorder.getBlob();
            recorder.upload("/audioData_upload", function (state, obj) {
                if(state === "success"){
                    that._emitAudio(recorder, obj.filePath);
                    document.getElementById('recorderWrapper').style.display = 'none';
                }else {
                    alert("error");
                }
            });
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                that._emitMessage({msg: msg, type: "txt"});
            };
        }, false);
        document.getElementById('sendImage').addEventListener('change', function() {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader();
                if (!reader) {
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    this.value = '';
                    var msg = "<img class='image' src='" + e.target.result + "' >";
                    that._emitMessage({msg: msg, dataType: "img"});
                };
                reader.readAsDataURL(file);
            };
        }, false);
        document.getElementById('emoji').addEventListener('click', function(e) {
            var wrapper = document.getElementById('emojiWrapper');

            if(wrapper.style.display == 'none'){
                document.getElementById('recorderWrapper').style.display = 'none';
                wrapper.style.display = 'block';
            }else {
                wrapper.style.display = 'none';
            }

            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                that._emitMessage({msg: '[emoji:' + target.title + ']', type: "emoji"});
            };
        }, false);
    },
    _emitMessage: function(data) {
        if (data.msg.trim().length != 0) {
            console.log('message_to_kefu');
            this._sendMessage( this.socket.kefu.id, data.msg, data.dataType);
            this._displayNewMsg('me', data.msg);
        };
    },
    _emitAudio: function(recorder, path) {
        console.log('message_to_kefu');
        this._sendMessage( this.socket.kefu.id, path, "audio");
        this._displayAudioMe(recorder);
    },

    _sendMessage: function(kefu_id, msg, type) {
        console.log("to:"+kefu_id+",msg:"+msg);
        this.socket.emit(
            "message_to_kefu",
            {
                to: kefu_id,
                message: msg,
                dataType: type
            }
        );
    },
    _setStatus: function(status, msg) {
        if(status === "success"){
            $("#status").text(msg);
            $("#sendBtn").removeAttr("disabled");
            $("#messageInput").removeAttr("disabled");
            $("#historyMsg").css("background-color", "#fff");
        }else {
            $("#status").text(msg);
            $("#sendBtn").attr("disabled", true);
            $("#sendBtn").attr("disabled", true);
            $("#historyMsg").html("");
            $("#historyMsg").css("background-color", "#ddd");
        }
    },
    _setWarnMsg: function(msg) {
        document.getElementById('sendBtn').disabled = true;
        document.getElementById('historyMsg').style.background = "#ddd";
        var messageInput = document.getElementById('messageInput');
        messageInput.value = msg;
        messageInput.disabled = true;
        messageInput.style.background = '#ddd';
    },
    _removeWarnMsg: function() {
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('historyMsg').style.background = "#fff";
        var messageInput = document.getElementById('messageInput');
        messageInput.value = '';
        messageInput.disabled = false;
        messageInput.style.background = '#fff';
    },
    _displayNewMsg: function(user, msg) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
            console.log(user, msg);
        var template = null;
        if(user != "me"){
            template = "user-template";
        }else {
            template = "esq-template";
        }
        var $text = $("."+template).clone(true);

        var result = this._showEmoji(msg);

        $text.removeClass("hidden")
            .removeClass(template)
            .addClass(template+"-added")
            .find(".message-text").append(result);

        $("#historyMsg").append($text);

        var $content = $("#historyMsg")[0];
        $content.scrollTop = $content.scrollHeight;
    },
    _displayAudioMe: function(recorder) {
        var audioId = "audio-" + $("audio").length;
        var audio = $("<audio controls id='"+audioId+"'></audio>")[0];

        var $text = $(".esq-template").clone(true);
        $text.removeClass("hidden")
            .removeClass("esq-template")
            .addClass("esq-template-added")
            .find(".message-text").append(audio);

        $('#historyMsg').append($text);

        recorder.play(audio);
        var container = $('#historyMsg');
        container.scrollTop = container.scrollHeight;
    },
    _displayAudioUser: function(user, path) {
        var audioId = "audio-" + $("audio").length;
        var audio = $("<audio controls id='"+audioId+"'></audio>")[0];

        var $text = $(".user-template").clone(true);
        $text.removeClass("hidden")
            .removeClass("user-template")
            .addClass("user-template-added")
            .find(".message-text").append(audio);

        $('#historyMsg').append($text);

        this._setAudioBlob(path, audio);

        var container = $('#historyMsg');
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _setAudioBlob: function(path, audio) {
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
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../images/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }
};
