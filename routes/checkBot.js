var express = require('express');
var router = express.Router();
var path = require('path');
var appPath = path.dirname(__dirname);
var connectToRabbitMQ = require(path.join(appPath, 'scripts', 'helper_func', 'rabbitmqSender.js'));

router.get('/botometer', function(req, res){
    connectToRabbitMQ('bae_botometer', {
        mashape_key: process.env.MASHAPE_APIKEY,
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token: req.session.twtAccessTokenKey,
        access_token_secret: req.session.twtAccessTokenSecret,
        screen_name: req.query.screenName.slice(1,)
    })
    .then(scores =>{
        res.send(scores);
    })
    .catch(err =>{
        res.status(404).send(err);
    });
});

module.exports = router;
