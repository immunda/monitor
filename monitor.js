var sys = require('sys'),
    amqp = require('amqp'),
    ws = require('ws').Server,
    errorhandler = require('errorhandler'),
    express = require('express'),
    config = require('./config');

// Express
var web = express();

web.set('view engine', 'ejs');

// Should wrap in a node development environment check
web.use('/static/', express.static(__dirname + '/static'));
web.use(errorhandler());

web.get('/', function(req, res){
    res.render('index.ejs', {layout: false, servers: config.servers, websocket_host: config.ws.host});
});

web.listen(config.web.port, config.web.host);
var socket_server = new ws({port: config.ws.port});

socket_server.broadcast = function(data) {

    var json_data = JSON.stringify(data);

    for(var i in this.clients) {
        this.clients[i].send(json_data);
    }

};

// Define AMQP (RabbitMQ) connection options
var connection = amqp.createConnection({host: config.amqp.host});

// Wait for connection to become established.
connection.on('ready', function () {

    // Create servers exchange if it doesn't exist
    // var exchange = connection.exchange('servers', {type: 'topic'});

    var queue = connection.queue('server-stats', function(q) {

        // Create queue and bind
        q.bind('servers', 'stats.#');
        // Receive messages
        q.subscribe(function (msg) {

            // Marshal received string into JSON
            data = msg.data.toString('utf8');
            stats = JSON.parse(data);

            // Maybe move this to the poller, trying to keep it as generic as possible at the moment
            if (typeof stats.memory_total !== 'undefined' && typeof stats.memory_free !== 'undefined' && typeof stats.memory_buffered !== 'undefined' && typeof stats.memory_cached !== 'undefined') {
                stats.memory = {};
                stats.memory.low = parseInt((stats.memory_total/2)/1024, 10);
                stats.memory.high = parseInt((stats.memory_total*0.75)/1024, 10);
                stats.memory.total = parseInt(stats.memory_total/1024, 10);
                stats.memory.used = stats.memory.total - (parseInt(stats.memory_free/1024, 10) + parseInt(stats.memory_buffered/1024, 10) + parseInt(stats.memory_cached/1024, 10));
            }
            delete stats.memory_free;
            delete stats.memory_buffered;
            delete stats.memory_cached;
            delete stats.memory_total;

            // Easier than combining sys, user and nice load
            stats.cpu_use = 100 - parseInt(stats.cpu_idle, 10);
            delete stats.cpu_idle;

            // Relay JSON via websocket server (as string)
            socket_server.broadcast(stats);
        });
    });

});
