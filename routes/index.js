var express = require('express');
var router = express.Router();
var config = require('../config');
var path = require('path');
var appPath = path.dirname(__dirname);
var connectToRabbitMQ = require(path.join(appPath,'scripts','helper_func','rabbitmqSender.js'));
var s3Helper = require(path.join(appPath, 'scripts','helper_func', 's3Helper.js'));


router.get('/', function(req, res, next){
    res.render('index',{});
});

router.post('/update', function(req, res, next){
    var promises = [];
    promises.push( getTimeline(sessionID, req.body.userScreenName, req.body.algorithm, req.session));
    promises.push( getTimeline(sessionID, req.body.brandScreenName, req.body.algorithm, req.session));
    Promise.all(promises).then( results => {
        res.status(200).send(
        {
            algorithm: req.body.algorithm,
            user:results[0],
            brand:results[1]
        })
    }).catch( err =>{
        try{
            var parsedError = JSON.parse(err);
            if (parsedError.code === 401){
                // this error means personality credentials are invalid
                delete req.session.bluemixPersonalityApikey;
            }
        }catch(e){
            console.log(e);
        }

        res.status(404).send(err);
    });
});

router.get('/score', function(req, res, next){
    connectToRabbitMQ('bae_get_sim_score', {
        user_screen_name: req.query.userScreenName,
        brand_screen_name: req.query.brandScreenName,
        option: req.query.option,
        sessionID: sessionID,
        algorithm: req.query.algorithm
    }).then(score => {
        res.status(200).send(score);
    }).catch(err => {
        res.status(500).send(err);
    });

});

/**
 * main script to trigger aws lambda to pull twitter timeline and calcualte personality scores
 * @param sessionID
 * @param screenName
 * @param credentials
 * @returns {Promise<any>}
 */
function getTimeline(sessionID, screenName, algorithm, credentials){

    return new Promise((resolve, reject) =>

        // 1. check if username exist
        connectToRabbitMQ('bae_check_screen_name', {
            consumer_key: config.twitter.consumerKey,
            consumer_secret: config.twitter.consumerSecret,
            access_token: credentials.twtAccessTokenKey,
            access_token_secret: credentials.twtAccessTokenSecret,
            screen_name:screenName })
        .then( user => {

            // 1.1 if user name exist, check if timeline has been collected
            if (user['user_exist']) {
                s3Helper.listFiles(sessionID +'/' + screenName).then( timelines => {
                    var files = Object.keys(timelines);

                    // 1.1.1 if timeline has already been collected, check if personality has been collected
                    if (files.indexOf(screenName + '_tweets.txt') > -1
                        && timelines[screenName + '_tweets.txt']['upToDate']) {
                        console.log({ message: 'Timeline has already been collected and it is within on month of date range!'});

                        s3Helper.listFiles(sessionID +'/' + screenName).then( personalities => {
                            var files = Object.keys(personalities);
                            if (algorithm === 'IBM-Watson'){
                                var personalityFname = screenName + '_personality.json';
                            }
                            else if (algorithm === 'TwitPersonality'){
                                var personalityFname = screenName + '_twitPersonality.json';
                            }
                            else{
                                reject()
                            }
                            // 1.1.1.1 if personality has been collected, job done!
                            if (files.indexOf(personalityFname) > -1 && timelines[personalityFname]['upToDate']) {
                                console.log({message: 'Personality has already been collected and it is within one month of date range!'});

                                s3Helper.downloadFile(sessionID + '/' + screenName + '/' + personalityFname)
                                    .then( personality =>{
                                        resolve(personality);
                                    }).catch(err =>{
                                    reject(err);
                                });
                            }

                            // 1.1.1.2 if not collected, collect personality, job done!
                            else {
                                if (algorithm === 'IBM-Watson') {
                                    connectToRabbitMQ('bae_get_personality', {
                                        sessionID: sessionID,
                                        apikey: credentials.bluemixPersonalityApikey,
                                        screen_name: screenName,
                                        profile_img: user['profile_img']
                                    }).then(personality => {
                                        resolve(personality);
                                    }).catch(err => {
                                        reject(err);
                                    });
                                }
                                else if (algorithm === 'TwitPersonality'){
                                    reject("We are currently experiencing some problem with the TwitPersonality alogrithm, " +
                                        "and we have to temporarily deprecate it.");
                                }
                            }
                        }).catch( err => {
                            reject(err);
                        })
                    }

                    // 1.1.2 if timeline hasn't been collected, collect timeline
                    else {
                        connectToRabbitMQ('bae_collect_timeline', {
                            sessionID: sessionID,
                            consumer_key: config.twitter.consumerKey,
                            consumer_secret: config.twitter.consumerSecret,
                            access_token: credentials.twtAccessTokenKey,
                            access_token_secret: credentials.twtAccessTokenSecret,
                            screen_name:screenName
                        }).then( timelines => {

                            if (algorithm === 'IBM-Watson') {
                                connectToRabbitMQ('bae_get_personality', {
                                    sessionID: sessionID,
                                    apikey: credentials.bluemixPersonalityApikey,
                                    screen_name: screenName,
                                    profile_img: user['profile_img']
                                }).then(personality => {
                                    resolve(personality);
                                }).catch(err => {
                                    reject(err);
                                })
                            }
                            else if (algorithm === 'TwitPersonality'){
                                reject("We are currently experiencing some problem with the TwitPersonality alogrithm, " +
                                    "and we have to temporarily deprecate it.");
                            }
                        }).catch( err => {
                            reject(err);
                        });
                    }
                }).catch( err => {
                    console.log(err);
                    reject(err);
                })
            }

            // 1.2 if doesn't exist, reject
            else {
                reject('User screen name: ' + screenName + ' does not exist!');
            }
        }).catch( err => {
            console.log(err);
            reject(err);
    }));
}

module.exports = router;
