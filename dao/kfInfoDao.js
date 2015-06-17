var util = require('util');
var crypto = require('crypto');
var mongoose = require('mongoose');
var db = require('./getConnect');
var Schema = mongoose.Schema;
//kfInfoScheme结构
var kfInfoScheme = new Schema({
    kf_acount : String,
    kf_id : {
        type : String,
        index : {unique: true}, //客服id唯一
        required : true //客服id不为空
    },
    kf_type : {
        type : String,
        //enum : ['admin', 'user'] //用户类型限定
        default : 'user' //密码不为空
    },
    kf_nick : String,
    kf_img : String,
    password : {
        type : String,
        default : '123456' //密码不为空
    },
    customer_max : {
        type : Number,
        min : 1,
        max : 5,   //接待用户数限定上限5
        default: 5
    }
});

//kfInfo对象模型
var KefuModel = mongoose.model('kfInfo', kfInfoScheme);

//创建Kefu实例
var Kefu =new KefuModel()
//增加客服人员(基于实例entity的操作)
exports.add_e = function(kefu, callback) {
    var md5 = crypto.createHash('md5');
    Kefu.password = md5.update(Kefu.password).digest('base64');
    Kefu.kf_acount = kefu.kf_acount;
    Kefu.kf_id = kefu.kf_id;
    Kefu.kf_nick = kefu.kf_nick;
    Kefu.customer_max = kefu.customer_max;
    Kefu.save(function(err) {
        if (err) {
            util.log("FATAL" + err);
            callback(err);
        } else {
            util.log('save ok');
            callback(null);
        }
    });
    console.log(Kefu);
}

//增加客服人员(基于model的操作)
exports.add = function(kefu, callback) {
    var password = md5.update(kefu.password).digest('base64');
    kefu.password = password;
    KefuModel.create(kefu, function(err) {
        if (err) {
            util.log("FATAL" + err);
            callback(err);
        } else {
            util.log('save ok');
            callback(null);
        }
    });
}

exports.delete = function(id, callback) {
    console.log(id);
    findBykefu_Id(id, function (err, kefu) {
        if (err) {
            util.log("FATAL" + err);
            callback(err);
        }else {
            util.log(util.inspect(kefu));
            console.log(kefu);
            kefu.remove();
            util.log('save ok');
            callback(null);
        }
    });
}

exports.update_online_state = function (_id, online_state, callback) {
    KefuModel.findByIdAndUpdate(_id, {$set:{online: online_state}}, function (err, kefu){
         if (err) {
            util.log("FATAL" + err);
            callback(err);
        }else {
            util.log('update ok');
            callback(null);
        }
    });
}

//修改昵称
exports.edit_kfnick = function(id, kf_nick, callback) {
    findBykefu_Id(id, function(err, kefu) {
        if (err)
            callback(err);
        else {
            kefu.kf_nick = kf_nick;
            kefu.save(function(err) {
                if (err) {
                    util.log('FATAL '+ err);
                    callback(err);
                } else {
                    util.log('update ok');
                    callback(null, kefu);
                }
            });
        }
    });
}

//修改密码
exports.edit_kfPassW = function(id, password_old, password_new, callback) {
    findBykefu_Id(id, function(err, kefu) {
        if (err)
            callback(err);
        else {
            if (kefu.password === md5.update(password_old).digest('base64')) {
                kefu.password = md5.update(password_new).digest('base64');
                kefu.save(function(err) {
                    if (err) {
                        util.log('FATAL '+ err);
                        callback(err);
                    } else {
                        util.log('update ok');
                        callback(null, kefu);
                    }
                });
            }else {
                util.log('old password wrong');
                callback('old password wrong');
            }
        }
    });
}

exports.allKefus = function(callback) {
    KefuModel.find({}, function (err, kefu) {
        if (err) {
            util.log('FATAL ' + err);
            callback(err, null);
        }
        callback(null, kefu);
    });
};

var findById = exports.findById = function(id, callback) {
    KefuModel.findOne({_id: id}, function (err, kefu) {
        if (err) {
            util.log('FATAL ' + err);
            callback(err, null);
        }
        callback(null, kefu);
    });
};

var findBykefu_Id = exports.findBykefu_Id = function(id, callback) {
    KefuModel.findOne({kf_id: id}, function(err, kefu) {
        if (err) {
            util.log('FATAL ' + err);
            callback(err, null);
        }
        callback(null, kefu);
    });
};
