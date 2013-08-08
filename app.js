/**
 * Module dependencies.
 */

var TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
var TWITTER_CALL_BACK_URL = process.env.TWITTER_CALL_BACK_URL;
var ADMINISTRATOR = process.env.ADMINISTRATOR;

var express = require('express'),
    http = require('http'),
    path = require('path'),
    connect = require('connect'),
    Session = express.session.Session,
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy,
    flash = require('connect-flash');

var sessionStore = new express.session.MemoryStore();

var app = express();

// all environments
app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));

    app.set('secretKey', 'mySecret');
    app.set('cookieSessionKey', 'sid');

    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser("secret"));
    app.use(express.session({
        secret: 'secret',
        key: 'connect.sid',
        store: sessionStore,
        access_token: "",
        user_name: ""
    }));
    app.use(passport.initialize());
    app.use(passport.session({
        user_name: "",
        access_token: ""
    }));
    
    app.use(flash());

    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(function(req, res, next){
        req.flash('alert','無効なurlです。');
        res.redirect('/');
    });
});

var roomList = {};
var userList = {};

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    console.log('app.get(/)');
    if (req.isAuthenticated()) {
        req.session.user_name = passport.session.profile.username;
        res.render('index', {
            login_status: 'logout',
            login_url: '/logout/twitter',
            alerts: req.flash('alert'),
            infos: req.flash('info'),
            resume: req.session.user_name in userList
        });
    }
    else {
        req.flash('alert','Twitterでログインしてください。');
        res.redirect('/login');
    }
});

app.get('/login', function(req, res) {
    console.log('app.get(/)');
    if (req.isAuthenticated()) {
        res.redirect('/');
    }
    else {
        res.render('login', {
            login_status: 'login',
            login_url: '/login/twitter',
            alerts: req.flash('alert'),
            infos: req.flash('info')
        });
    }
});

app.get('/exit', function(req, res) {
    console.log('app.get(/exit)');
    if (req.isAuthenticated()) {
        if(req.session.user_name in userList){
            removeFromRoomList(req);
            deleteUserList(req);
            req.flash('info','退出しました。');
        } else {
            console.log('untill entered room');
            req.flash('alert','まだ部屋に入っていません。');
        }
        res.redirect('/');
    } else {
        res.redirect('/');
    }
});

app.get('/check', function(req, res) {
    if (req.isAuthenticated() && req.session.user_name == 't_tree') {
        res.render('check', {
            userList: userList,
            roomList: roomList
        });
    }
    else {
        res.redirect('/');
    }
});

app.get('/clear', function(req, res) {
    roomList = {};
    userList = {};
    res.redirect('/check');
});

app.get('/create', function(req, res) {
    console.log('app.get(create)');
    if (req.isAuthenticated()) {
        var room;

        //すでに部屋に入っている場合は退出して作成
        if (req.session.user_name in userList) {
            removeFromRoomList(req);
            deleteUserList(req);
        }

        while (1) {
            var rnd = Math.floor(Math.random() * 10000);
            console.log('create room number =' + rnd);
            if (!roomList[rnd]) {
                console.log('this room is empty');
                room = rnd;
                roomList[room] = {};
                roomList[room][req.session.user_name] = 20;
                userList[req.session.user_name] = room;
                console.log(roomList[room].length);
                break;
            }
        }

        console.log('res.render(/room)');
        res.redirect("/room");
    }
    else {
        console.log('res.redirect(/)');
        res.redirect('/');
    }
});

app.post('/join', function(req, res) {
    console.log('app.get(join)');
    if (req.isAuthenticated()) {
        var room;

        // roomをちゃんと入力してもらえているか
        if (req.body.roomNumber) {
            room = req.body.roomNumber;
        }
        else {
            // だめなら/にredirect
            console.log('req.body.room is empty');
            req.flash('alert','部屋番号を入力してください。');
            res.redirect('/');
            return;
        }

        // 作成されていない部屋の場合は/にredirect
        if (typeof roomList[room] === "undefined") {
            console.log('illeagle room Number');
            req.flash('alert','作成されていない部屋です。');
            res.redirect('/');
            return;
        }


        // すでにほかの部屋に入っている場合は退出する
        if (req.session.user_name in userList && userList[req.session.user_name] !== room) {
            removeFromRoomList(req);
            deleteUserList(req);
        }

        if (userList[req.session.user_name] !== room) {
            roomList[room][req.session.user_name] = 20;
            userList[req.session.user_name] = room;
        }
        console.log('res.redirect(/room)');
        res.redirect("/room");
    }
    else {
        console.log('res.redirect(/)');
        res.redirect('/');
    }
});


app.get('/room', function(req, res) {
    console.log('app.get(room)');
    if (req.isAuthenticated()) {
        if(userList[req.session.user_name]){
            console.log('res.render(room)');
            res.render("room");
        } else {
            console.log('res.redirect(/)');
            req.flash('alert','まだ部屋に入っていません。');
            res.redirect('/');
        }
    }
    else {
        console.log('res.redirect(/)');
        res.redirect('/');
    }
});

function deleteUserList(_req){
    var userName = _req.session.user_name;
    delete userList[userName];
    console.log('remove ' + userName + ' from userList');
}

function removeFromRoomList(_req){
    var _room = userList[_req.session.user_name];
    console.log('already entered room:' + userList[_req.session.user_name]);
    delete roomList[_room][_req.session.user_name];
    console.log('remove ' + _req.session.user_name + ' from ' + userList[_req.session.user_name]);
    var length = 0;
    for( var key in roomList[_room] ){ length++; } 
    console.log(length);
    if (length === 0) {
        console.log('delete room : ' + _room);
        delete roomList[_room];
    }
}

var server = http.createServer(app).listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

//passportのセッションを使うので
//リアライズ、デシリアライズのための関数を追記。
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: TWITTER_CALL_BACK_URL
},

function(token, tokenSecret, profile, done) {
    passport.session.accessToken = token;
    passport.session.profile = profile;
    process.nextTick(function() {
        return done(null, profile);
    });
}));

//app.get('/account/twitter', twitterEnsureAuthenticated, routes.account);

app.get('/login/twitter', function(req, res) {
    console.log('app.get(/login/twitter)');
    res.redirect('auth/twitter');
});

app.get('/auth/twitter',
passport.authenticate('twitter'),

function(req, res) {
    console.log('app.get(/auth/twitter)');
});

app.get('/auth/twitter/callback',
passport.authenticate('twitter', {
    failureRedirect: '/'
}),

function(req, res) {
    console.log('app.get(/auth/twitter/callback)');
    console.log(passport.profile);
    //    req.session.user_name = passport.profile.username;
    res.redirect('/');
});

app.get('/logout/twitter', function(req, res) {
    cleanRoom(req);
    req.logout();
    req.flash('info','ログアウトしました。');
    res.redirect('/login');
});

function twitterEnsureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login/twitter');
}
function cleanRoom(req) {
    // ルームに参加しているか
    if (typeof userList[req.session.user_name] !== "undefined") {
        console.log('already entered room:' + _room);

        var _room = userList[req.session.user_name];
        delete roomList[_room][req.session.user_name];
        console.log('remove ' + req.session.user_name + ' from ' + userList[req.session.user_name]);
        delete userList[req.session.user_name];
        console.log('remove ' + req.session.user_name + ' from userList');
        if (roomList[_room].length === 0) {
            delete roomList[_room];
        }
    }
}
    
var io = require('socket.io').listen(server);

io.configure(function() {
    //HerokuではWebSocketがまだサポートされていない？ので、以下の設定が必要                                                                                                                                                                       
    io.set("transports", ["xhr-polling"]);
    io.set("polling duration", 10);

    // socket.ioのログ出力を抑制する                                                                                                                                                                                            
    io.set('log level', 1);
});

io.set('authorization', function(handshakeData, callback) {
    if (handshakeData.headers.cookie) {
        //cookieを取得
        var cookie = require('express/node_modules/cookie').parse(decodeURIComponent(handshakeData.headers.cookie));
        //cookie中の署名済みの値を元に戻す
        cookie = connect.utils.parseSignedCookies(cookie, 'secret');
        //cookieからexpressのセッションIDを取得する
        var sessionID = cookie['connect.sid'];

        // セッションをストレージから取得
        sessionStore.get(sessionID, function(err, session) {
            if (err) {
                //セッションが取得できなかったら
                console.dir(err);
                callback(err.message, false);
            }
            else if (!session) {
                console.log('session not found');
                callback('session not found', false);
            }
            else {
                console.log("authorization success");

                // socket.ioからもセッションを参照できるようにする
                handshakeData.cookie = cookie;
                handshakeData.sessionID = sessionID;
                handshakeData.sessionStore = sessionStore;
                handshakeData.session = new Session(handshakeData, session);

                callback(null, true);
            }
        });
    }
    else {
        //cookieが見つからなかった時
        return callback('cookie not found', false);
    }
});


var counter = io.sockets.on('connection', function(socket) {
    console.log("sockets.on(connection)");
    var handshake = socket.handshake;
    socket.on('init', function() {
        console.log("socket.on(init)");
        var room = getRoomNumber();
        socket.set('room', room);
        socket.set('name', getUserName());
        socket.join(room);
    });


    socket.on("getMyLife", function() {
        console.log("socket.on(getMyLife)");
        socket.emit('returnMyLife', getLife());
    });

    socket.on("getMyRoomNumber", function() {
        console.log("socket.on(getMyRoomNumber)");
        socket.emit('returnMyRoomNumber', getRoomNumber());
    });

    socket.on("getLifeTable", function() {
        console.log("socket.on(getLifeTable)");
        var roomData = getRoomData();
        socket.emit('updateLifeTable', roomData);
        counter.to(getRoomNumber()).emit('updateLifeTable', roomData);
    });


    socket.on("lifeUpdate", function(val) {
        console.log("socket.on(lifeUpdate)");
        setLife(getLife()+val);
        socket.emit('returnMyLife', getLife());
        socket.emit('updateLifeTable', getRoomData());
        counter.to(getRoomNumber()).emit('updateLifeTable', getRoomData());
    });

    socket.on("lifeSet", function(val) {
        console.log("socket.on(lifeSet)");
        setLife(val);
        socket.emit('returnMyLife', getLife());
        socket.emit('updateLifeTable', getRoomData());
        counter.to(getRoomNumber()).emit('updateLifeTable', getRoomData());
    });

    //接続が解除された時に実行する
    socket.on("disconnect", function() {
        console.log('socket.on(disconnect)');
        var room;
        socket.get('room', function(err, _room) {
            room = _room;
        });

        socket.leave(room);
    });
    
    function getUserName(){
        return handshake.session.user_name;
    }
    
    function getRoomNumber(){
        return userList[getUserName()];
    }
    
    function getLife(){
        return roomList[getRoomNumber()][getUserName()];
    }
    
    function setLife(val){
        roomList[getRoomNumber()][getUserName()] = val;
    }
    
    function getRoomData(){
        return roomList[getRoomNumber()];
    }
});
