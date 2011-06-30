# Really basic SNMPv2 client, just something to push SNMP data into AMQP for the moment
import pika
from time import sleep
import json
from pysnmp.entity.rfc3413.oneliner import cmdgen
# Grab configuration settings
from config import *

connection = pika.BlockingConnection(
    pika.ConnectionParameters(
    host=AMQP_HOST)
)

channel = connection.channel()

channel.exchange_declare(exchange=AMQP_EXCHANGE, type='topic')

oids = {
    'load' : (1,3,6,1,4,1,2021,10,1,3,1),
    'memory_total' : (1,3,6,1,4,1,2021,4,5,0),
    'memory_free' : (1,3,6,1,4,1,2021,4,6,0),
    'cpu_idle' : (1,3,6,1,4,1,2021,11,11,0),
}

# All very slow, bad, inefficient.
while(True):

    for server_name, domain in SERVERS.items():

        output = {}

        for metric, oid in oids.items():

            error_indication, error_status, error_index, var_binds = cmdgen.CommandGenerator().getCmd(
                # SNMP v2
                cmdgen.CommunityData('orochi', COMM_KEY),
                cmdgen.UdpTransportTarget((domain, 161)),
                oid,
                (('SNMPv2-MIB', 'sysObjectID'), 0)
            )


            try:
                name, val = var_binds[0]
                output[metric] = str(val)
            except:
                pass

        output['uri'] = domain
        output['name'] = server_name

        message = json.dumps(output)

        channel.basic_publish(
                exchange=AMQP_EXCHANGE,
                routing_key=AMQP_ROUTING_KEY,
                body=message
            )

        #print 'Sent: "%s"' % message
    sleep(POLL_INTERVAL)

connection.close()
