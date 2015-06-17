var express = require('express');
var router = express.Router();
var crypto = require('crypto');
var db = require('../dao/kfInfoDao');

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
            db.findBykefu_Id(req.body.username, function (err, user) {
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
    db.allKefus(function (err, kefus) {
        if(err) {
            return next(err);
        }
        res.send(kefus);
    });
});

router.post("/delete", function (req, res, next){
    if(!req.body.kefu_id) {
        return res.send("error");
    }
    db.delete(req.body.kefu_id, function (err) {
        if (err) {
            res.send(err);
            return next(err)
        }
        res.send("success");
    });
});

router.post("/add", function (req, res, next){
    if (!req.body) {
        res.send(err);
        next(err);
    }
    db.findBykefu_Id(req.body.kefu_id, function (err, kefu) {
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
                db.add_e (kefu, function (err) {
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

router.post("/update", function (req, res, next){
    console.log("request 'update' was called.");
    var body = req.body;
    var path ="./public/images/kfImg/"+body.kf_id;

    fs.writeFileSync(path, body.img);
    res.send({state: "success"});
    /*var form = new formidable.IncomingForm();
    form.uploadDir = "./public/images/kfImg";
    form.parse(req, function(error, fields, files) {
        //console.log("parsing done");
        //console.log(files);
        console.log("F.U.P: " + JSON.stringify(files));
        console.log("F.U.P: " + JSON.stringify(fields));

    });*/

});

router.post('/audioData_upload', function (req, res, next) {
    console.log("request 'upload' was called.");
    var form = new formidable.IncomingForm();
    form.uploadDir = "./public/audioData_upload";

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
