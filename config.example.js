var config = {};

// List of servers to render in the front-end, should be replaced with AMQP RPC call
config.servers = [
//    'hostname'
];

// Webserver configuration
config.web = {
    'port' : 3000,
    'host' : 'localhost'
};

// Websocket server configuration
config.ws = {
    'port' : 8000,
    'host' : 'localhost'
};

// Message queue server configuration
config.amqp = {
    'host' : 'localhost'
}

module.exports = config;