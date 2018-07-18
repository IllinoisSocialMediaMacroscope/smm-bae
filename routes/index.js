var express = require('express');
var router = express.Router();
var config = require('../config');
var path = require('path');
var appPath = path.dirname(__dirname);
var lambda_invoke = require(path.join(appPath,'scripts','helper_func','lambdaHelper.js'));
var s3_helper = require(path.join(appPath, 'scripts','helper_func', 's3Helper.js'));

router.get('/', function(req, res, next){
    res.render('index',{});
});

router.post('/update', function(req, res, next){
    var promises = [];

    promises.push( getTimeline(req.body.sessionID, req.body.user_screen_name, req.session));
    promises.push( getTimeline(req.body.sessionID, req.body.brand_screen_name, req.session));
    Promise.all(promises).then( results => {
        res.status(200).send(
        {
            user:results[0],
            brand:results[1]
        })
    }).catch( err =>{
        try{
            var parsedError = JSON.parse(err);
            if (parsedError.code === 401 && parsedError.error ==='Not Authorized'){
                // this error means personality credentials are invalid
                delete req.session.bluemix_personaity_username;
                delete req.session.bluemix_personaity_password;
            }
        }catch(e){
            console.log(e);
        }

        res.status(404).send(err);
    });
});

router.get('/score', function(req, res, next){

    lambda_invoke('bae_get_sim_score', {
        user_screen_name: req.query.user_screen_name,
        brand_screen_name: req.query.brand_screen_name,
        option: req.query.option,
        sessionID: req.query.sessionID
    }).then(score => {
        res.status(200).send(score);
    }).catch(err => {
        res.status(500).send(err);
    });

})

function getTimeline(sessionID, screen_name, credentials){

    return new Promise((resolve, reject) =>

        // 1. check if username exist
        lambda_invoke('bae_check_screen_name', {
            consumer_key: config.twitter.consumer_key,
            consumer_secret: config.twitter.consumer_secret,
            access_token: credentials.twt_access_token_key,
            access_token_secret: credentials.twt_access_token_secret,
            screen_name:screen_name })
        .then( user => {

            // 1.1 if user name exist, check if timeline has been collected
            if (user['user_exist']) {
                s3_helper.list_files(sessionID +'/' + screen_name).then( timelines => {
                    var files = Object.keys(timelines);

                    // 1.1.1 if timeline has already been collected, check if personality has been collected
                    if (files.indexOf(screen_name + '_tweets.txt') > -1
                        && timelines[screen_name + '_tweets.txt']['upToDate']) {
                        console.log({ message: 'Timeline has already been collected and it is within on month of date range!'});
                        s3_helper.list_files(sessionID +'/' + screen_name).then( personalities => {
                            var files = Object.keys(personalities);

                            // 1.1.1.1 if personality has been collected, job done!
                            if (files.indexOf(screen_name + '_personality.json') > -1
                                && timelines[screen_name + '_personality.json']['upToDate']) {
                                console.log({message: 'Personality has already been collected and it is within one month of date range!'});

                                s3_helper.download_file(sessionID + '/' + screen_name + '/' + screen_name + '_personality.json')
                                    .then( personality =>{
                                        resolve(personality);
                                }).catch(err =>{
                                    reject(err);
                                })
                            }
                            // 1.1.1.2 if not collected, collect personality, job done!
                            else {
                                lambda_invoke('bae_get_personality', {
                                    sessionID: sessionID,
                                    username: credentials.bluemix_personaity_username,
                                    password: credentials.bluemix_personaity_password,
                                    screen_name: screen_name,
                                    profile_img: user['profile_img']
                                }).then(personality => {
                                    resolve(personality);
                                }).catch(err => {
                                    reject(err);
                                })
                            }
                        }).catch( err => {
                            reject(err);
                        })
                    }

                    // 1.1.2 if timeline hasn't been collected, collect timeline
                    else {
                        lambda_invoke('bae_collect_timeline', {
                            sessionID: sessionID,
                            consumer_key: config.twitter.consumer_key,
                            consumer_secret: config.twitter.consumer_secret,
                            access_token: credentials.twt_access_token_key,
                            access_token_secret: credentials.twt_access_token_secret,
                            screen_name:screen_name
                        }).then( timelines => {
                            // 1.1.2.1 collect personality, job done
                            lambda_invoke('bae_get_personality', {
                                sessionID: sessionID,
                                username: credentials.bluemix_personaity_username,
                                password: credentials.bluemix_personaity_password,
                                screen_name: screen_name,
                                profile_img: user['profile_img']
                            }).then( personality => {
                                resolve(personality);
                            }).catch( err =>{
                                reject(err);
                            })

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
                reject('User screen name: ' + screen_name + ' does not exist!');
            }
        }).catch( err => {
            console.log(err);
            reject(err);
    }));
}

module.exports = router;
