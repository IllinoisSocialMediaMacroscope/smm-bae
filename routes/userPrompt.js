var express = require('express');
var router = express.Router();
var config = require('../config');
var path = require('path');
var appPath = path.dirname(__dirname);
var connectToRabbitMQ = require(path.join(appPath, 'scripts', 'helper_func', 'rabbitmqSender.js'));

router.post('/prompt', function(req, res) {
    connectToRabbitMQ('bae_screen_name_prompt', {
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token: req.session.twtAccessTokenKey,
        access_token_secret: req.session.twtAccessTokenSecret,
        screen_name: req.body.screenName
    })
    .then(user => {
        res.send(user);
    })
    .catch(err => {
        console.log(err);
        reject(err);
    });
});

module.exports = router;
