$(function() {
    var socket = io.connect('http://lifecounter.herokuapp.com/');

    // サーバーと接続したタイミングでライフを取得（初期値はサーバーで生成している）
    socket.on('connect', function() {
        console.log('connected');
        socket.emit('init');
        socket.emit('getMyLife');
        socket.emit('getLifeTable');
        socket.emit('getMyRoomNumber');
        console.log('socket.emit(getMyLife)');
    });

    // サーバーからライフを受け取って表示を更新する
    socket.on('returnMyLife', function(life) {
        console.log(life);
        $("#life").text(life);
    });

    // サーバーから部屋番号を受け取って表示を更新する
    socket.on('returnMyRoomNumber', function(room) {
        console.log(room);
        $("#roomNumber").text(room);
    });


    // 参加者全員のライフが送られてくるので更新する
    socket.on('updateLifeTable', function(data) {
        var tr = $("#life-table tbody").children(); //全行を取得

        for (var i = 0, l = tr.length; i < l; i++) {
            var cells = tr.eq(i).children(); //1行目から順にth、td問わず列を取得
            var name = cells.eq(1).text();
            console.log("** > " + name + ":" + data[name]);
            if (typeof data[name] !== "undefined") {
                console.log("defined");
                cells.eq(2).text(data[name]);
                delete data[name];
            }
            else {
                console.log("undefined");
                tr.eq(i).remove();
                continue;
            }
        }

        for (var _name in data) {
            console.log(name + " : " + data[_name]);
            $("#life-table").append(
            $("<tr></tr>").append($("<td></td>").text("x")).append($("<td></td>").text(_name)).append($("<td></td>").text(data[_name])));
        }
    });


    $("#reset").click(

    function() {

        socket.emit('lifeSet', 20);
    });

    $("#inc5").click(

    function() {
        $("#life").text(parseInt($("#life").text()) + 5);
        socket.emit('lifeUpdate', 5);
    });

    $("#inc1").click(

    function() {
        $("#life").text(parseInt($("#life").text()) + 1);
        socket.emit('lifeUpdate', 1);
    });

    $("#dec5").click(

    function() {
        $("#life").text(parseInt($("#life").text()) - 5);
        socket.emit('lifeUpdate', - 5);
    });

    $("#dec1").click(

    function() {
        $("#life").text(parseInt($("#life").text()) - 1);
        socket.emit('lifeUpdate', - 1);
    });

});