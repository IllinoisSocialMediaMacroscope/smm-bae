var express = require('express');
var router = express.Router();

router.post('/prompt', function(req, res) {
    lambdaHandler.invoke('bae_screen_name_prompt', 'bae_screen_name_prompt', {
        consumer_key: TWITTER_CONSUMER_KEY,
        consumer_secret: TWITTER_CONSUMER_SECRET,
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
