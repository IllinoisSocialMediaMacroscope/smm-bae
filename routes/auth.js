var express = require('express');
var router = express.Router();
var OAuth1 = require('oauth').OAuth;
var config = require('../config.json');

var consumer = new OAuth1(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
    config.twitter.consumer_key, config.twitter.consumer_secret, "1.0", "http://localhost:8001/login/twitter/callback", "HMAC-SHA1");

router.get('/login/twitter', function(req,res,next){
    // patch the oauth library node_modules/oauth/lib/oauth.js, line 540 add: extraParams["oauth_callback"]===undefined
    consumer.getOAuthRequestToken({ 'oauth_callback': "oob"}, function(error, oauthToken, oauthTokenSecret, results){
        if (error) {
            console.log(error);
            res.redirect(req.query.currentURL + 'query?error=' + JSON.stringify(error));
        } else {

            req.session.twt_oauthRequestToken = oauthToken;
            req.session.twt_oauthRequestTokenSecret = oauthTokenSecret;
            req.session.currentURL = req.query.currentURL;
            req.session.save();
            res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.twt_oauthRequestToken);
        }
    });
});

router.post('/login/twitter',function(req,res,next){
    consumer.getOAuthAccessToken(req.session.twt_oauthRequestToken,req.session.twt_oauthRequestTokenSecret,
        req.body.twt_pin, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
            if (error) {
                res.status(500).send(JSON.stringify(error));
            } else {
                req.session.twt_access_token_key = oauthAccessToken;
                req.session.twt_access_token_secret = oauthAccessTokenSecret;
                req.session.save();
                res.status(200).send({redirect_url: req.session.currentURL});
            }
        });

});

router.post('/login/bluemix',function(req,res,next){
    if (req.body.bluemix_personaity_username !== undefined && req.body.bluemix_personaity_username !== ''
        && req.body.bluemix_personaity_password !== undefined && req.body.bluemix_personaity_password !== ''){

        req.session.bluemix_personaity_username = req.body.bluemix_personaity_username;
        req.session.bluemix_personaity_password = req.body.bluemix_personaity_password;
        req.session.save();
        res.status(200).send({redirect_url: req.body.currentURL});
    }
    else{
        res.status(500).send('You have to provide a valid username/password!');
    }
});

router.get('/login/status', function(req,res,next){
    loginStatus = {twitter:false, bluemix:false};

    if (req.session.twt_access_token_key !== undefined && req.session.twt_access_token_secret !== undefined){
        loginStatus['twitter'] = true;
    }
    if (req.session.bluemix_personaity_username !== undefined && req.session.bluemix_personaity_password !== undefined){
        loginStatus['bluemix'] = true;
    }

    res.status(200).send(loginStatus);
})

module.exports = router;
