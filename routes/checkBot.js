var express = require('express');
var router = express.Router();
var path = require('path');
var appPath = path.dirname(__dirname);
var config = require('../config');
var connectToRabbitMQ = require(path.join(appPath, 'scripts', 'helper_func', 'rabbitmqSender.js'));

router.get('/botometer', function(req, res){
    connectToRabbitMQ('bae_botometer', {
        mashape_key: config.mashape.apiKey,
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
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
