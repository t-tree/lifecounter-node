/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    path = require('path'),
    connect = require('connect'),
    Session = express.session.Session,
    passport = require('passport'),
    TwitterStrategy = require('passport-twitter').Strategy;

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

    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

var roomList = new Object();
var userList = new Object();

// development only
if ('development' == app.get('env')) {
    app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    console.log('app.get(/)');
    if (req.isAuthenticated()) {
        req.session.user_name = passport.session.profile.username;
        //      if(req.session.user_name in userList){
        //        delete userList[req.session.user_name];
        //      }
        res.render('index', {
            login_status: 'logout',
            login_url: '/logout/twitter'
        });
    }
    else {
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
            login_url: '/login/twitter'
        });
    }
});

app.get('/exit', function(req, res) {
    console.log('app.get(/)');
    if (req.isAuthenticated()) {
        var _room = userList[req.session.user_name];
        console.log('already entered room:' + userList[req.session.user_name]);
        delete roomList[_room][req.session.user_name];
        console.log('remove ' + req.session.user_name + ' from ' + userList[req.session.user_name]);
        delete userList[req.session.user_name];
        console.log('remove ' + req.session.user_name + ' from userList');
        if (roomList[_room].length === 0) {
            delete roomList[_room];
        }
    }
    res.redirect('/');
});

app.get('/check', function(req, res) {
    console.log('-----userList-----');
    console.log(userList);
    console.log('-----roomList-----');
    console.log(roomList);
    res.render('check');
})

app.get('/create', function(req, res) {
    console.log('app.get(create)');
    if (req.isAuthenticated()) {
        var room;

        //すでに部屋に入っている場合は退出して作成
        if (req.session.user_name in userList) {
            var _room = userList[req.session.user_name];
            console.log('already entered room:' + userList[req.session.user_name]);
            delete roomList[_room][req.session.user_name];
            console.log('remove ' + req.session.user_name + ' from ' + userList[req.session.user_name]);
            delete userList[req.session.user_name];
            console.log('remove ' + req.session.user_name + ' from userList');
            if (roomList[_room].length === 0) {
                delete roomList[_room];
            }
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
            res.redirect('/');
            return;
        }

        // 作成されていない部屋の場合は/にredirect
        if (typeof roomList[room] === "undefined") {
            console.log('illeagle room Number');
            res.redirect('/');
            return;
        }


        // すでにほかの部屋に入っている場合は退出する
        if (req.session.user_name in userList && userList[req.session.user_name] !== room) {
            var _room = userList[req.session.user_name];
            console.log('already entered room:' + userList[req.session.user_name]);
            delete roomList[_room][req.session.user_name];
            console.log('remove ' + req.session.user_name + ' from ' + userList[req.session.user_name]);
            delete userList[req.session.user_name];
            console.log('remove ' + req.session.user_name + ' from userList');
            if (roomList[_room].length === 0) {
                delete roomList[_room];
            }
        }

        if (userList[req.session.user_name] !== room) {
            roomList[room][req.session.user_name] = 20;
            userList[req.session.user_name] = room;
        }
        console.log('res.render(/room)');
        res.redirect("/room");
    }
    else {
        console.log('res.redirect(/)');
        res.redirect('/');
    }
});


app.get('/room', function(req, res) {
    console.log('app.get(room)');
    if (req.isAuthenticated() && userList[req.session.user_name]) {
        console.log('res.render(room)');
        res.render("room");
    }
    else {
        console.log('res.redirect(/)');
        res.redirect('/');
    }
});

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

//ここからTwitter認証の記述
var TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
var TWITTER_CALL_BACK_URL = process.env.TWITTER_CALL_BACK_URL

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
    res.redirect('/');
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

io.configure(function () {
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
        socket.set('room', userList[handshake.session.user_name]);
        socket.set('name', handshake.session.user_name);
        var room = userList[handshake.session.user_name];
        socket.join(room);
    });


    socket.on("getMyLife", function() {
        console.log("socket.on(getMyLife)");
        var room = userList[handshake.session.user_name];
        socket.emit('returnMyLife', roomList[room][handshake.session.user_name]);
    });

    socket.on("getMyRoomNumber", function() {
        console.log("socket.on(getMyRoomNumber)");
        var room = userList[handshake.session.user_name];
        socket.emit('returnMyRoomNumber', room);
    });

    socket.on("getLifeTable", function() {
        console.log("socket.on(getLifeTable)");
        var room = userList[handshake.session.user_name];
        socket.emit('updateLifeTable', roomList[room]);
        counter.to(room).emit('updateLifeTable', roomList[room]);
    });


    socket.on("lifeUpdate", function(val) {
        console.log("socket.on(lifeUpdate)");
        var room = userList[handshake.session.user_name];
        roomList[room][handshake.session.user_name] += val;
        socket.emit('returnMyLife', roomList[room][handshake.session.user_name]);
        socket.emit('updateLifeTable', roomList[room]);
        counter.to(room).emit('updateLifeTable', roomList[room]);
    });

    socket.on("lifeSet", function(val) {
        console.log("socket.on(lifeSet)");
        var room = userList[handshake.session.user_name];
        roomList[room][handshake.session.user_name] = val;
        socket.emit('returnMyLife', roomList[room][handshake.session.user_name]);
        socket.emit('updateLifeTable', roomList[room]);
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
});
