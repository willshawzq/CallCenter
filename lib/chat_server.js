var io = require('socket.io')();
var fs = require("fs");
var path = require("path");

//io.set('log level', 1);
/*查找可用客服*/
var kfSorter = {
    /**
    *默认调用方法
    *@params objArr 传入call_center对象
    *return 返回处理结果
    */
    getUseableKF: function(objArr, key1, key2) {
        /*查找是否有完全空闲客服，有则返回*/
        for(var o in objArr){
            if(objArr[o][key1] === 0){
                return objArr[o];
            }
        }
        /*无完全空闲客服，则调用排序方法*/
        return this.sortObjNum(objArr, key1, key2);
    },
    /**
    *根据连接用户数排序
    *@params objArr 传入call_center对象
    *return 返回处理结果
    */
    sortObjNum: function(objArr, key1, key2) {
        var arr = [];
        /*将所有的客服存入数组*/
        for(var o in objArr){
            if (!objArr[o][key2])
            arr.push(objArr[o]);
        }

        if(arr.length == 0){
            return {};
        }
        /*调用数组的sort方法进行排序，
            compare为自定义比较规则*/
        var result = arr.sort(this.compare(key1));
        /*对排好序的数组，获取最小可用客户
            并返回结果*/
        return result[0];
         //return this.findMin(result, key2);
    },
    /**
    *传入数组sort方法的比较规则
    *@params propertyName 要进行比较的属性名
    *return 返回处理结果
    */
    compare: function(propertyName) {
        /*返回一个匿名函数，
            参数为sort方法每次比较时传入的对象*/
        return function(obj1, obj2){
            /*根据属性名获取对象相应的值*/
            var val1 = obj1[propertyName];
            var val2 = obj2[propertyName];
            /*申明比较规则*/
            if(val1 < val2){
                    //返回负数表示小值在前
                    return -1;
                }else if(val1 > val2){
                    //返回正数表示小值在前
                    return 1;
                }else {
                    //返回0则位置不变
                    return 0;
                }
            }
        }
};
function isEmptyObj(obj){
    return Object.keys(obj).length?false:true;
}
/*
var kefu = kfSorter.getUseableKF(call_center);
        kefu 对象的值
        kefu = {
            socket : {
                id : socket.id
                name : socket.name //socket.name = {user_name : kefu_id, user_type : "kefu"}
            },
            customer_list : {
                customer_id : {
                    id : socket.id,
                    name : customer_id
            },
            customer_num : 0,
            customer_max : customer_max,
            busy : false
        };*/


//呼叫中心客服用户对应列表，将users和customers的id以及连接的socket整合了

var call_center = {};
var online_kefus = {};
/*
online_kefus[kefu_id] = {
    id: kefu_id,
    nick: kefu_nick
};
*/
var sockets = {};

io.sockets.on('connection', function(socket) {
    /*监听客服上线*/
    socket.on('user_connect', function (data, callback) {
        console.log('user_connect');
        //将上线的用户名存储为 socket 对象的属性，
        //以区分每个 socket 对象，方便后面使用
        //var data = JSON.parse(data);
        var kefu_id = data.kefu_id;
        var kefu_nick = data.kefu_nick;
        console.log(data.kefu_nick);
        var customer_max = data.customer_max;
        //修改socket对象name属性
        socket.name = {
            user_id : kefu_id,
            user_name : kefu_nick,
            user_type : "kefu"
        };
        //新增online_kefus对象中kefu_id属性之value
        online_kefus[kefu_id] = {
            id: kefu_id,
            nick: kefu_nick
        };
        socket.broadcast.emit("user_online", online_kefus[kefu_id]);
        /*
        //对所有在线客服广播有新的客服上线
        for(var o in call_center){
            var kefu = call_center[o];
            console.log('kefu.socket.id....');
            console.log(kefu.socket.id);
            //新客服上线
            io.sockets.connected[kefu.socket.id].emit("user_online", online_kefus[kefu_id]);
        }*/

        //online_kefus[kefu_id] = socket.id;    // Store a reference to your socket ID
        //sockets[socket.id] = { username : kefu_id, socket : socket };  // Store a reference to your socket
        //call_center 对象中不存在该用户名则插入该用户名
        if (!call_center[kefu_id]) {
            call_center[kefu_id] = {  //客服系统中的客服
                socket : {      //客服连接的socket，相当于之前的users＋sockets
                    id : socket.id,
                    name : socket.name
                },
                customer_list : {},   //接入客服的用户,相当于之前的customers＋sockets
                //{customer_list[customer_id]={socket : { id : socket.id,  name : socket.name}}
                customer_num : 0,   //接入 call_center[kefu_id]的用户数
                customer_max : customer_max,    //允许最大接入用户数
                busy : false     //客服空闲状态
            }
        }
        call_center[kefu_id]["socket"]["id"] = socket.id;
        console.log(call_center);
        !callback || callback({
            customer_list: call_center[kefu_id]['customer_list'],
            online_kefus: online_kefus
        });
    });

    /*用户上线*/
    socket.on('customer_connect', function (data, callback){
        console.log('customer_connect');
        var customer_id = data.customer_id;
        //设置用户socket 相应的属性
        socket.name = {
            user_id : customer_id,
            user_name : customer_id,
            user_type : "customer"
        };
        if (isEmptyObj(call_center)) { //没有客服在线
            console.log('none');
            return callback('none', null);   //返回状态："none", kefu对象为null
        }
        //匹配空闲的客服
        var kefu = kfSorter.getUseableKF(call_center, "customer_num", "busy");
        console.log(kefu);
        if (isEmptyObj(kefu)) {   //所有的客服都busy
            console.log('busy');
            callback('busy', null);
        }else {
            console.log('success');
            //获取可以接入的客服的socket
            var temp_soc = io.sockets.connected[kefu.socket.id];
            //console.log(temp_soc);
            if (temp_soc !== undefined) {//可以获取到客服的socket
                var kefu_nick = kefu["socket"]["name"]["user_name"];
                var kefu_id = kefu["socket"]["name"]["user_id"];
                var kefu_soc_id = kefu["socket"]["id"];
                console.log(kefu_nick);
                var msg = kefu_nick + "为你服务";

                //用户socket中增加对应客服的信息
                socket.kefu = {
                    id : kefu_id,
                    nick : kefu_nick
                };
                //向接入的客服客户端socket发送信息
                temp_soc.emit('new_customer_connect', customer_id);
                //用户接入该客服后，如果达到接上限，busy状态修改
                if (kefu["customer_num"] >= kefu["customer_max"]-1) {
                    call_center[kefu_id]["busy"] = true;
                }
                //用户接入该客服后， 修改相应的属性
                call_center[kefu_id]["customer_list"][customer_id] = socket.id;
                call_center[kefu_id]["customer_num"]++;

                var dir = "public/upload/chatRecord_upload/" ;
                var filePath = path.join(dir, kefu_id, customer_id);
                var fileName= '',recordPath = '/';
                console.log(filePath);
                console.log(fs.existsSync(filePath));

                if (fs.existsSync(filePath)) {
                    var files = fs.readdirSync(filePath);
                     //对文件进行排序
                     files.sort(function(val1, val2){
                      //读取文件信息
                      var stat1 = fs.statSync(path.join(filePath, val1));
                      var stat2 = fs.statSync(path.join(filePath, val2));

                      //根据时间从最新到最旧排序
                      return stat2.mtime - stat1.mtime;
                     });
                     //console.log("------------------------------------");
                     fileName = path.join(filePath, (files[0]==".DS_Store")?files[1]:files[0]);
                     console.log("filePath : "+fileName);
                }else {
                    recordPath = ' ';
                }
                var pathtmp = fileName.split(path.sep);
                pathtmp.shift();
                pathtmp.forEach(function(e){
                    recordPath = path.join(recordPath, e);
                });
                console.log("recordPath : "+recordPath);
                callback('success', kefu_nick, kefu_id, msg, recordPath);
            }else {
                callback('failed', null);
            }
        }
        console.log("call_center");
        console.log(call_center);
    });

    /*客服给特定用户发消息*/
    socket.on('message_to_customer', function(data){
        console.log("message_to_customer:"+JSON.stringify(data));
        //给指定用户发消息，需从当前客服的用户列表中找到对应的用户的socket_id
        var customer_soc_id = call_center[data.from]["customer_list"][data.to];
        var kefu_nick = socket.name.user_name;
        io.sockets.connected[customer_soc_id].emit(
            "message_from_kefu",
            {
                message: data.message,
                dataType: data.dataType,
                from: kefu_nick
            });
    });

    /*用户or客服给特定客服发消息*/
    socket.on('message_to_kefu', function(data) {
        console.log("message_to_kefu:"+JSON.stringify(data));
        //获取用户id，以便客服端明确信息来源
        var from_id = socket.name.user_id;
        //获取接收消息方的socketID
        var kefu_soc_id = call_center[data.to]["socket"]["id"];
        io.sockets.connected[kefu_soc_id].emit(
            'message_from_users',
            {
                message: data.message,
                dataType: data.dataType,
                from: from_id
            });
    });

    socket.on('newRecorder', function(e) {
        console.log(JSON.stringify(e));
        socket.broadcast.emit('newRecorder', e);
    });


    //kefu disconnected or customer disconnected
    socket.on('disconnect', function () {
        if (!socket.id) return;
        console.log('disconnect....');
        var user_type = socket.name.user_type;
        console.log(user_type);
        if (user_type === "kefu") {
            var kefu_id = socket.name.user_id;
            var kefu_nick = socket.name.user_name;
            console.log(kefu_id + " " + kefu_nick);
            var customer_list = call_center[kefu_id]["customer_list"];
            console.log(customer_list);
            //对接入的所有用户广播客服下线
            for(var o in customer_list){
                var customer_soc_id = customer_list[o];
                io.sockets.connected[customer_soc_id].emit("user_disconnected", kefu_nick);
            }
            //删除call_center相应客服纪录
            delete call_center[kefu_id];

            //对所有在线广播客服下线
            socket.broadcast.emit("user_offline", online_kefus[kefu_id]);
            /*
            for(var o in call_center){
                kefu_soc_id = call_center[o]["socket"]["id"];
                io.sockets.connected[kefu_soc_id].emit("user_disconnected", online_kefus[kefu_id]);
            }
            */
            delete online_kefus[kefu_id];
        }else {//用户下线
            var customer_id = socket.name.user_name;
            //注意！！！当用户并没有成功接入任何客服，是不用广播和修改call_center的；
             //没有接入客服，输出undefined,所以不是判断kefu对象是否为空。
            if (socket.kefu !== undefined) {
                var kefu_id = socket.kefu.id;
                kefu_soc_id = call_center[kefu_id]["socket"]["id"];
                //对接入的客服进行广播
                io.sockets.connected[kefu_soc_id].emit("customer_disconnected", customer_id);
                //删除call_center中对应的客服的customer_list的用户信息
                delete call_center[kefu_id]["customer_list"][customer_id];
                //接入客服的用户离开前，接入用户如果达到接上限，用户离开后，busy状态修改
                if (call_center[kefu_id]["busy"]) {
                    call_center[kefu_id]["busy"] = false;
                }
                //接入客服的用户离开后， 修改相应的属性
                call_center[kefu_id]["customer_num"]--;
            }
        }
        console.log(call_center);
    });
});
exports.listen = function (_server) {
    return io.listen(_server);
};