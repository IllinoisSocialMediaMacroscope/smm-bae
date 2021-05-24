var express = require('express');
var router = express.Router();


router.get('/botometer', function(req, res){
    lambdaHandler.invoke('bae_botometer', 'bae_botometer', {
        consumer_key: TWITTER_CONSUMER_KEY,
        consumer_secret: TWITTER_CONSUMER_SECRET,
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
