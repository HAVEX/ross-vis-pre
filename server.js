var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    bodyParser = require('body-parser'),
    app = express(),
    // socketio = require('socket.io')(server),
    //WebSocketServer = require("ws").Server,
    server = require('http').Server(app);

var port = process.env.PORT || 8100,
    host = process.env.HOST || "localhost";

console.log("initializing server ");

// Static files
app.use(express.static('ui'));
app.use(express.static('jam'));
app.use("/data", express.static('data'));
app.use("/npm", express.static('node_modules'));

// ivastack libs
var srcDir = {
    vui: '../../vui/src',
    i2v: '../../i2v/src',
    p4: '../../p4/src'
}
app.use("/vui", express.static(srcDir.vui));
app.use("/i2v", express.static(srcDir.i2v));
app.use("/p4",  express.static(srcDir.p4));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var ctypes = require(srcDir.p4 + "/cquery/ctypes.js"),
    cstore = require(srcDir.p4 + "/cquery/cstore.js"),
    csv = require(srcDir.p4 + "/io/node-dsv.js");

server.listen(port, host, function(){
    console.log("server started, listening", host, port);
});
