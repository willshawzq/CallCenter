var kf_id = $("#user-id", parent.document).text();
var kf_nick = $("#user-name", parent.document).text();

$(function(){
    //kf_id 需要先获取到页面
    $.get("/infoManage", {
        "kf_id" : kf_id
    }, function(data){
        /*data就是kefu对象
        data.kf_nick显示在页面上
        data.kf_img表示客服头像的url，如果有，则下载，get('/show_kfImg'),没有显示默认图片。
        */
        $("#kf-nick").val(data.kf_nick);
        var imgUrl = data.kf_img;
        if (imgUrl) {
            $("#kf-img").attr("src", ' /upload/img_upload/' + imgUrl);
        };
    });
});

$(".change-img input").on("change", function(){
    if (this.files.length != 0) {
        var file = this.files[0],
            reader = new FileReader();

        if (!reader) {
            this.value = '';
            return;
        };
        reader.onload = function(e) {
            $(".img").attr("src", e.target.result);
        };
        reader.readAsDataURL(file);
        $(this).next().addClass("active");
    };
});
$(".input").on("click", function(){
    $(this).nextAll(".option").addClass("active");
});
$(".cancel").on("click", function(){
    $(this).parent().removeClass("active");
});
$(".update").on("click", function(){
    var $parent = $(this).parents(".item");
    var type = $parent.data("type");
    switch(type) {
        case "img":
            var files = $("#img-file")[0].files;
            if(files.length){
                uploadImg({
                    file: files[0],
                    kf_id: kf_id,
                    url: "/edit_kfImg"
                },  _showWarning);
            }else {
                _showWarning("error", "请先选择图片~" );
            }
            break;
        case "nick":
            var $input = $parent.find(".input");
            $.post("/edit_kfNick", {
                kf_id: kf_id,
                kf_nick: $input.val()
            }, function(){
                _showWarning("success", "昵称修改成功~");
            });
            break;
        case "password":
            if(!($("#old-pw").val() &&
                    $("#new-pw").val() &&
                        $("#cfg-pw").val())) {
                _showWarning("error", "密码不能为空~");
                return;
            }
            if($("#new-pw").val() != $("#cfg-pw").val()){
                _showWarning("error", "两次密码输入不同~");
                return;
            }
            $.post("/edit_kfPass",{
                kf_id: kf_id,
                old_pw: $("#old-pw").val(),
                new_pw: $("#new-pw").val()
            }, function(data){
                if (data === "success"){
                    _showWarning("success", "密码修改成功~");
                    //跳转页面到login
                    top.location.href='/logout';
                }else {
                    _showWarning("error", "密码错误~");
                    //清空旧密码，定位到旧密码
                    $("#old-pw").val("").focus();
                }
            });
            break;
    }

    function _showWarning(status, responseStr) {
        if(status == "error"){
            $parent.find(".warning").text(responseStr).css("color", "red");
        }else {
            $parent.find(".warning").text(responseStr).css("color", "green");
        }
        $parent.find(".active").removeClass("active");
    }
});


function uploadImg(data, callback) {
    var fd = new FormData();
    fd.append("imgData", data.file);
    fd.append("kf_id", data.kf_id);
    $.ajax({
        url : data.url,
        type : 'POST',
        data : fd,
        dataType: "text",
        /**
         * 必须false才会避开jQuery对 formdata 的默认处理
         * XMLHttpRequest会对 formdata 进行正确的处理
         */
        processData : false,
        /**
         *必须false才会自动加上正确的Content-Type
         */
        contentType : false,
        success : function(responseStr) {
            //alert("成功：" + JSON.stringify(responseStr));
            callback('success' , responseStr);
        },
        error : function(responseStr) {
           // alert("失败:" + JSON.stringify(responseStr));//将json对象转成json字符串。
            callback('error', responseStr);
        }
    });
}