/**
 * Created by Lty on 2015/4/22.
 */

$(function(){
	$.get("/manage",function(data){
		var info = [ "kf_id", "kf_nick", "kf_type", "customer_max" ];
		for(var i=0,len=data.length;i<len;i++){
			var temp = data[i];
			if(temp[info[i]] != "admin"){
				var $clone = $(".temp-box").clone();
				$clone.removeClass("temp-box").prependTo("body");
				$clone.find("input").each(function(i,e){
					$(e).attr("value", temp[info[i]]);
				});
			}			
		}
	});
});
/*删除操作*/
$("body").on("click",".top-option i",function() {
	var value = $(this).parent().next().find("input:first-child").attr("value");
	if(value) {
		var $info = $(this).parents(".info-box");
		$.post("/delete",{kefu_id: value},function(status){
			if(status === "success"){
				$info.remove();
			}else {
				alert("T_T,I failed~");
			}
		});
	}else
		$(this).parents(".info-box").remove();
});
/*切换编辑和保存状态操作*/
$("body").on("click",".bottom-option",function() {
	if($(this).hasClass("bottom-option-edit")){
		var $details = $(this).prev().find(".details")
	    $details.addClass("edit");
	    $details.find("input").removeAttr("readonly");
	    $(this).find("i").attr("class", "glyphicon glyphicon-ok");
	    $(this).removeClass("bottom-option-edit").addClass("bottom-option-save");
	}else if($(this).hasClass("bottom-option-save")){
		var $that = $(this);
		var $details = $(this).prev().find(".details")
	    $details.removeClass("edit");

	    var $num = $(this).parents(".info-box").find(".customer_num");
	    var num = $num.val();
	    console.log(num);

		var inputs = $details.find("input");
		var vals = [];
		$.each(inputs,function(i,e){
			var val = $(e).val();
			vals.push(val);
		});
		if(vals[0] && vals[2]){
			var kefu = {
				kefu_id: vals[0],
				kefu_nick: vals[1],
				customer_max: vals[2]
			};
			console.log(kefu);
			var data = null;
			$.post("/add",kefu,function(status){
				if(status === "success"){
					$details.find("input").attr("readonly", "readonly");
					$that.find("i").attr("class", "icon-pencil");
					$that.removeClass("bottom-option-save").addClass("bottom-option-edit");
				}else {
					console.log(status);
					if (status === "exsist") {
						alert("该客服信息已存在");
					}else if (status === "customer_max") {
						alert("最大接待数范围：1～5");
						$num.focus();
					}else
						alert(status);

				}
			});
		}else {
			alert("请完成输入！");
		}
	}
});
$("body").on("click",".add-person",function() {
    $(".hide-box").clone().removeClass("hide-box").prependTo("body");
});

