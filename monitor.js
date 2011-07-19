var sys = require('sys'),
    amqp = require('amqp'),
    ws = require('websocket-server'),
    express = require('express'),
    config = require('./config');

// Express
var web = express.createServer();

web.set('view engine', 'ejs');

// Should wrap in a node development environment check
web.use('/static/', express.static(__dirname + '/static'));
web.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

web.get('/', function(req, res){
    res.render('index.ejs', {layout: false, servers: config.servers, websocket_host: config.ws.host});
});

web.listen(config.web.port, config.web.host);

var socket_server = ws.createServer();

// Define AMQP (RabbitMQ) connection options
var connection = amqp.createConnection({
    host: config.amqp.host,
});

// Wait for connection to become established.
connection.on('ready', function () {

    // Create servers exchange if it doesn't exist
    var servers_exch = connection.exchange('servers')

    // Create queue and bind
    var q = connection.queue('server-stats', function(queue) {
        q.bind('servers', 'stats.#');
    });

    // Receive messages
    q.subscribe(function (msg) {

        // Marshal received string into JSON
        data = msg.data.toString('utf8');
        stats = JSON.parse(data);
        
        // Maybe move this to the poller, trying to keep it as generic as possible at the moment
        if (typeof stats.memory_total !== 'undefined' && typeof stats.memory_free !== 'undefined' && typeof stats.memory_buffered !== 'undefined' && typeof stats.memory_cached !== 'undefined') {
            stats.memory = {};
            stats.memory.low = parseInt((stats.memory_total/2)/1024);
            stats.memory.high = parseInt((stats.memory_total*0.75)/1024);
            stats.memory.total = parseInt(stats.memory_total/1024);
            stats.memory.used = stats.memory.total - (parseInt(stats.memory_free/1024) + parseInt(stats.memory_buffered/1024) + parseInt(stats.memory_cached/1024));
        }
        delete stats.memory_free;
        delete stats.memory_buffered;
        delete stats.memory_cached;
        delete stats.memory_total;

        // Easier than combining sys, user and nice load
        stats.cpu_use = 100 - parseInt(stats.cpu_idle);
        delete stats.cpu_idle;
        
        // Relay JSON via websocket server (as string)
        //console.log(stats);
        socket_server.broadcast(JSON.stringify(stats));

    });
});

socket_server.listen(config.ws.port, config.ws.host);
