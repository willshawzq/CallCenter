/**
 * Created by 醉 on 2015/4/22.
 */
 $(function(){
 	//你到时候写好后台并且有数据的时候就把下面注释掉的代码打开
 	//下面的代码是从后台取数据的
	//$.get("/repository",function(data){
		data = [
			{
				key: "hell",//词条名
				detail: "world"//词条内容
			},
			{
				key: "hello",
				detail: "ons"
			}
		];//这个data是我测试的数据，你看看到时后台回传数据按这种格式来吧，这个data到时也要删掉

		for(var i=0,len=data.length;i<len;i++){
			var temp = data[i];
			var $clone = $(".temp-box").clone(true);
			$clone.removeClass("temp-box").prependTo("body");
			$clone.find(".top-option .title input").val(temp["key"]);
			$clone.find(".info-detail textarea").val(temp["detail"]);
		}
	//});
});

/*绑定新增事件*/
$("body").on("click",".top-option .add",function() {
	var $clone = $(".temp-box").clone(true)
				.addClass("new-add").removeClass("temp-box");
	var $parent = $(this).parents(".info-box");
	$clone.find(".top-option .title input").removeAttr("readonly");
	$clone.insertAfter($parent);
});
/*绑定删除事件*/
$("body").on("click",".bottom-option .left",function() {
	var key = $(this).parent().prevAll(".top-option").find(".title").val();
	var newAdd = $(this).parents(".info-box").hasClass("new-add");
	if(key && !newAdd){
		$.post("/delete_r",{key: key},function(status){
			if(status === "success"){
				$(this).parents(".info-box").remove();
			}else {
				alert("T_T,I failed~");
			}
		});
	}else {
		$(this).parents(".info-box").remove();
	}	
});
/*绑定编辑事件，即进行内容编辑*/
$("body").on("click",".bottom-option .right",function() {
	$(this).parent().prev().find("textarea").removeAttr("readonly");
	$(this).find("i").attr("class", "icon-ok");
	$(this).addClass("edit");
});

/*绑定完成事件，即完成内容编辑后，进行保存*/
$("body").on("click",".bottom-option .edit",function() {
	var detail = $(this).parent().prev().find("textarea").attr("readonly", "readonly").val();
	var key = $(this).parent().prevAll(".top-option").find(".title").text();
	
	$.post("/update_r", {
		key: key,
		detail: detail
	},function(data){
		if(data == "success"){
			$(this).find("i").attr("class", "icon-pencil");
			$(this).removeClass("edit");
		}else {
			alert("T_T,I failed~");
		}
	});
});