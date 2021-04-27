var express = require('express');
var router = express.Router();
var path = require('path');
var appPath = path.dirname(__dirname);
var config = require('../config');
var lambdaInvoke = require(path.join(appPath,'scripts','helper_func','lambdaHelper.js'));

router.get('/botometer', function(req, res, next){
    lambdaInvoke('bae_botometer', {
        consumer_key: config.twitter.consumerKey,
        consumer_secret: config.twitter.consumerSecret,
        access_token: req.session.twtAccessTokenKey,
        access_token_secret: req.session.twtAccessTokenSecret,
        screen_name: req.query.screenName.slice(1,)
    }).then(scores => {
        res.send(scores);
    }).catch(err => {
        reject(err);
    });
});

module.exports = router;
