Monitoring
==========

A small 'realtime' (not really, because we're still polling every _x_ seconds) SNMP monitoring system, which currently supports display of load average, memory usage and CPU utilisation.

It uses RabbitMQ as a messaging middleware and topic routing, permitting poller nodes to be placed in private network segments. This also permits separate monitor.js instances to subscribe to different routing keys, allowing servers to be grouped.

There's a load things to add/fix, but it's worked well in helping quickly spot load, CPU and memory spikes so far.

### Dependencies

* A RabbitMQ (or maybe other AMQP) server

* The following node.js libraries:
    * amqp
    * express
    * ejs
    * websocket-server
    
* A browser with <meter> tag support; basically Webkit nightly or Chrome (it's not made it into Safari yet)
    
* The following Python libraries:
    * pika
    * pysnmp
    
### Setup

* If you don't have it, get npm and install the node.js dependancies

    * _npm install express amqp ejs websocket-server_

* For installing the Python pages, use pip (or easy_install)

    * _pip install pika pysnmp_

### Turning things on

* Start RabbitMQ

    * _rabbitmq-server_
    
* Then the node.js AMQP client/web(socket) server (I'm assuming you have nodemon)
    
    * _nodemon monitor.js_
    
* Finally

    * _python poller/poller.py_
    
* By default, node.js will start a webserver on your loopback interface (localhost) and port 3000, so go and visit that.