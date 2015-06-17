var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var kfInfo = require('../dao/kfInfoDao');
var url = require('url');
var path = require('path');

var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");

var files_upload_path, newPath;
/* GET home page. */

router.get('/', function (req, res, next) {
    return res.redirect('/login');
});
//客服人员在后台登录
router.route('/login')
    .get(function (req, res) {
        res.render('login', {
            title: '用户登录'
        });
    })
    .post(function (req, res, next) {
        if (req.body.usertype ==='admin'){
            if (req.body.username === 'admin' && req.body.password ==='123456'){
                var md5 = crypto.createHash('md5');
                var password = md5.update(req.body.password).digest('base64');
                req.session.user = {
                    kf_id: req.body.username,
                    kf_type: req.body.usertype,
                    password: password
                };
                var dir = '/chat/' + req.body.usertype;
                return res.redirect(dir);
            }else {
                req.session.error = '用户名或密码错误';
                return res.redirect('/login');
            }
        }else {
            var md5 = crypto.createHash('md5');
            var password = md5.update(req.body.password).digest('base64');
            kfInfo.findBykefu_Id(req.body.username, function (err, user) {
                if (err) {
                    return next(err);
                }
                if (!user) {
                    req.session.error = '用户名不存在';
                    return res.redirect('/login');
                }
                if (req.body.usertype === user.kf_type && password === user.password) {
                    req.session.user = user;
                    var dir = '/chat/' + user.kf_type;
                    return res.redirect(dir);
                } else {
                    req.session.error = '用户名或密码错误';
                    console.log(req.session.error);
                    return res.redirect('/login');
                }
            });
        }
    });

router.get('/logout', function (req, res) {
    req.session.user = null;
    return res.redirect('/login');
});

router.get('/chat/:userType', function (req, res, next) {
    userType = req.params.userType;
    if (userType === 'customer') {
        return res.render('customer_chat_mobile', {
            title: '客服系统'
        });
    }else {
        if (!authentication(req, res)) {
            return res.redirect('/login');
        }else {
            if (userType === 'admin') {
                return res.render('indexAdmin', {
                    title: '管理员系统',
                    user: req.session.user
                });
            }else if (userType === 'user') {
                return res.render('indexAdmin', {
                    title: '客服系统',
                    user: req.session.user
                });
            }
        }
    }
});

router.get("/manage", function (req, res, next){
    kfInfo.allKefus(function (err, kefus) {
        if(err) {
            return next(err);
        }
        res.send(kefus);
    });
});

router.get("/infoManage", function (req, res, next){
    var params = url.parse(req.url, true).query;
    kfInfo.findBykefu_Id(params.kf_id, function (err, kefu) {
        if(err) {
            return next(err);
        }
        res.send(kefu);
    });
});

router.post("/delete_kefu", function (req, res, next){
    if(!req.body.kefu_id) {
        return res.send("error");
    }
    kfInfo.delete(req.body.kefu_id, function (err) {
        if (err) {
            res.send(err);
            return next(err)
        }
        res.send("success");
    });
});

router.post("/add_kefu", function (req, res, next){
    if (!req.body) {
        res.send(err);
        next(err);
    }
    kfInfo.findBykefu_Id(req.body.kefu_id, function (err, kefu) {
        if (err) {
            res.send(err);
            next(err);
        }else {
            if (kefu) {
                res.send("exsist");
            }else {
                var kefu = {
                    kf_acount: req.body.kefu_id + '@test',
                    kf_id: req.body.kefu_id,
                    kf_nick: req.body.kefu_nick,
                    customer_max: req.body.customer_max
                };
                console.log('kefu');
                console.log(kefu);
                kfInfo.add_e (kefu, function (err) {
                    if (err) {
                        console.log('add_err');
                        console.log(err);
                        res.send(err);
                    }else
                        res.send("success");
                });
            }
        }
    });
});
router.post("/chat_record", function(req, res, next){
    console.log('chat_record');
    var data = req.body;
    var files_uploadDir = "public/upload/chatRecord_upload/";
    var files_path = data.kf_id + "/" + data.customer_id + "/";
    _mkdirsSync(files_uploadDir ,[data.kf_id, data.customer_id]);
    var date =  new Date().getTime() ;
    console.log(date);
    str = date + ".txt";
    files_upload_path = path.join(files_uploadDir, files_path , str );
    console.log('files_upload_path');
    console.log(files_uploadDir);
    console.log(files_upload_path);

    try{
        fs.writeFile(files_upload_path, data.record, "utf8");
    }catch(e) {
        console.log(e);
        return res.send('error');
    }
    res.send("success");

    function _mkdirsSync(dir, list) {
        var childPath = dir;
        list.forEach(function(e){
            childPath = path.join(childPath, e);
            console.log(childPath);
            if (!fs.existsSync(childPath)) {
                var tep = fs.mkdirSync(childPath);
                console.log('Common目录创建成功');
            }
        });
    }
});

router.post("/chat_img", function(req, res, next){
    var form = new formidable.IncomingForm(),
        files_upload_path, img_name, new_path;
    form.uploadDir = "public/upload/chatImg_upload/";
    form.parse(req, function(error, fields, files){
        files_upload_path = files.imgData.path;
        temp = (files.imgData.name).split(".");
        img_type = temp.pop();
        img_path = files_upload_path+"."+img_type;
        console.log(img_path);
        try{
            fs.renameSync(files.imgData.path, img_path);
        }catch(e) {
            console.log(e);
            return res.send('error');
        }
        var imgPath = '/',
            pathtmp = img_path.split(path.sep);
        pathtmp.shift();
        pathtmp.forEach(function(e){
            imgPath = path.join(imgPath, e);
        });
        console.log(imgPath);
        res.send(imgPath);
    });
});

router.post("/edit_kfImg", function (req, res, next){
    var form = new formidable.IncomingForm();
    var files_upload_path, img_type, temp, new_path;
    form.uploadDir = "public/upload/img_upload/";
    form.parse(req, function(error, fields, files) {
        files_upload_path = files.imgData.path;
        temp = (files.imgData.name).split(".");
        img_type = temp.pop();
        imgUrl = fields.kf_id+"."+img_type;
        new_path =form.uploadDir + imgUrl;
        try{
            fs.renameSync(files.imgData.path, new_path)
        }catch(e) {
            console.log(e);
            return res.send(e);
        }
        console.log('edit_kfimg');
        kfInfo.edit_kfimg(fields.kf_id, imgUrl, function (err) {
            if (err) {
                res.send(err);
                return next(err)
            }
            res.send("success");
        });
    });
});

router.post("/edit_kfNick", function (req, res, next){
    if(!req.body.kf_id) {
        return res.send("error");
    }
    kfInfo.edit_kfnick(req.body.kf_id, req.body.kf_nick, function (err) {
        if (err) {
            res.send(err);
            return next(err)
        }
        res.send("success");
    });
});

router.post("/edit_kfPass", function (req, res, next){
    if(!req.body.kf_id) {
        return res.send("error");
    }
    kfInfo.edit_kfPass(req.body.kf_id, req.body.old_pw, req.body.new_pw, function (err) {
        if (err) {
            console.log(err);
            res.send(err);
            return next(err)
        }
        res.send("success");
    });
});

router.post('/audioData_upload', function (req, res, next) {
    console.log("request 'audioData_upload' was called.");
    var form = new formidable.IncomingForm();
    form.uploadDir = "./public/upload/audioData_upload";
    form.parse(req, function(error, fields, files) {
        files_upload_path = files.audioData.path;
        console.log('files.upload.path');
        console.log(files);
        var obj = {filePath: files_upload_path};
        res.send(obj);
    });
});

//session认证：当session为空或是session的中的用户type与url中的usertype不一致，要求用户先登录
function authentication(req, res) {
    var user = req.session.user;
    if (!(user && req.params.userType === user.kf_type)) {
        req.session.error = '请先登陆';
        return false;
    }
    return true;
};

//session认证：当session的中的用户type与url中的usertype一致，直接跳转到用户首页
function notAuthentication(req, res) {
    if (req.session.user) {
        req.session.error = '已登陆';
        var dir = '/chat/' + req.session.user.kf_type;
        return dir;
    }
    return false;
};

module.exports = router;
