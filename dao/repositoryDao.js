var util = require('util');
var crypto = require('crypto');
var mongoose = require('mongoose');
var db = require('./getConnect');
var Schema = mongoose.Schema;

//kbScheme结构
var kbScheme = new Schema({
    key : {
        type : String,
        index : {unique: true}, //客服id唯一
        required : true //客服id不为空
    },
    contents : String
});

//kb对象模型
var KbModel = mongoose.model('kb', kbScheme);

//创建repository实例
var Kb = new KbModel()

//增加知识库(基于实例entity的操作)
exports.add_e = function(kb, callback) {
    Kb = kb;
    Kb.save(function(err) {
        if (err) {
            util.log("FATAL" + err);
            callback(err);
        } else {
            util.log('kb save ok');
            callback(null);
        }
    });
    console.log(Kb);
}

//增加客服人员(基于model的操作)
exports.add = function(kb, callback) {
    KbModel.create(kb, function(err) {
        if (err) {
            util.log("FATAL" + err);
            callback(err);
        } else {
            util.log('kb save ok');
            callback(null);
        }
    });
}

//修改关键字内容
exports.edit_contents = function(key, contents, callback) {
    findBykey(key, function(err, kb) {
        if (err)
            callback(err);
        else {
            kb.contents = contents;
            kb.save(function(err) {
                if (err) {
                    util.log("FATAL" + err);
                    callback(err);
                } else {
                    util.log('edit_contents ok');
                    callback(null);
                }
            });
        }
    });
}

exports.delete = function(key, callback) {
    console.log(keyWord);
    findBykey(key, function (err, kb) {
        if (err) {
            util.log("FATAL" + err);
            callback(err);
        }else {
            util.log(util.inspect(kb));
            console.log(kb);
            kb.remove();
            util.log('kb delete ok');
            callback(null);
        }
    });
}

exports.allRepositorys = function(callback) {
    KbModel.find({}, function (err, kb) {
        if (err) {
            util.log('FATAL ' + err);
            callback(err, null);
        }
        callback(null, kb);
    });
};

var findBykey = exports.findBykey = function(key, callback) {
    KbModel.findOne({key: key}, function (err, kb) {
        if (err) {
            util.log('FATAL ' + err);
            callback(err, null);
        }
        callback(null, kb);
    });
};