var express = require('express');
var router = express.Router();
var path = require('path');
var appPath = path.dirname(__dirname);
var connectToRabbitMQ = require(path.join(appPath, 'scripts', 'helper_func', 'rabbitmqSender.js'));

router.post('/prompt', function(req, res) {
    connectToRabbitMQ('bae_screen_name_prompt', {
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
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
