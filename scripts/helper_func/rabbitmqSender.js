var amqp = require('amqplib/callback_api');

function connectToRabbitMQ(queue, msg) {

    return new Promise((resolve, reject) => {
        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) reject(error0);

            connection.createChannel(function (error1, channel) {
                if (error1) {
                    reject(error1);
                }

                channel.assertQueue('', {exclusive:true}, function (error2, q) {
                    if (error2) {
                        reject(error2);
                    }
                    var correlationId = uuidv4();

                    // reply
                    channel.consume(q.queue, function (msg) {
                        if (msg.properties.correlationId === correlationId) {
                            resolve(JSON.parse(msg.content.toString()));
                        }
                        setTimeout(function() {
                            connection.close();
                        }, 60*1000*5); // time out in 5 minutes
                    }, {
                        noAck: true
                    });

                    // sender
                    channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)),
                        {correlationId: correlationId, replyTo: q.queue});

                });
            });
        });
    });
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


    module.exports = connectToRabbitMQ;

