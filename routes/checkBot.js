var express = require('express');
var router = express.Router();
var config = require('../config');
var lambdaInvoke = require(path.join(appPath,'scripts','helper_func','lambdaHelper.js'));

router.get('/botometer', function(req, res, next){
    lambdaInvoke('bae_botometer', {
        mashape_key: config.mashape.apiKey,
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token: req.session.twtAccessTokenKey,
        access_token_secret: req.session.twtAccessTokenSecret,
        screen_name: req.query.screenName
    }).then(scores => {
        console.log(scores)
        res.send(scores);
    }).catch(err => {
        reject(err);
    });
});
