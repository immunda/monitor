var config = {};

// List of servers to render in the front-end, should be replaced with AMQP RPC call
config.servers = [
//    'hostname'
];

config.web = {
    'port' : 3000,
    'host' : 'localhost'
};

config.ws = {
    'port' : 8000,
    'host' : 'localhost'
};

config.amqp = {
    'host' : 'localhost'
}

module.exports = config;