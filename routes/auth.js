var express = require('express');
var router = express.Router();
var OAuth1 = require('oauth').OAuth;

var consumer = new OAuth1(
    "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token",
    TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, "1.0", "http://localhost:8001/login/twitter/callback", "HMAC-SHA1");

router.get('/login/twitter', function(req,res,next){
    // patch the oauth library node_modules/oauth/lib/oauth.js, line 540 add: extraParams["oauth_callback"]===undefined
    consumer.getOAuthRequestToken({ 'oauth_callback': "oob"}, function(error, oauthToken, oauthTokenSecret, results){
        if (error) {
            console.log(error);
            res.redirect(req.query.currentURL + '?error=' + JSON.stringify(error));
        } else {
            req.session.twtOauthRequestToken = oauthToken;
            req.session.twtOauthRequestTokenSecret = oauthTokenSecret;
            req.session.save();
            res.redirect("https://twitter.com/oauth/authorize?oauth_token="+req.session.twtOauthRequestToken);
        }
    });
});

router.post('/login/twitter',function(req,res,next){
    consumer.getOAuthAccessToken(req.session.twtOauthRequestToken,req.session.twtOauthRequestTokenSecret,
        req.body.twtPin, function(error, oauthAccessToken, oauthAccessTokenSecret, results) {
            if (error) {
                res.status(500).send(JSON.stringify(error));
            } else {
                req.session.twtAccessTokenKey = oauthAccessToken;
                req.session.twtAccessTokenSecret = oauthAccessTokenSecret;
                req.session.save();
                res.status(200).send({redirectUrl: req.body.currentURL});
            }
        });

});

router.post('/login/bluemix',function(req,res,next){
    if (req.body.bluemixPersonalityApikey !== undefined && req.body.bluemixPersonalityApikey !== ''){

        req.session.bluemixPersonalityApikey = req.body.bluemixPersonalityApikey;
        req.session.save();
        res.status(200).send({redirectUrl: req.body.currentURL});
    }
    else{
        res.status(500).send('You have to provide a API key');
    }
});

router.get('/login/status', function(req,res,next){
    loginStatus = {twitter:false, bluemix:false};

    if (req.session.twtAccessTokenKey !== undefined && req.session.twtAccessTokenSecret !== undefined){
        loginStatus['twitter'] = true;
    }
    if (req.session.bluemixPersonalityApikey !== undefined){
        loginStatus['bluemix'] = true;
    }

    res.status(200).send(loginStatus);
});

module.exports = router;
