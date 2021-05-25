var express = require('express');
var router = express.Router();


router.get('/', function (req, res, next) {
    res.render('index', {enableEmail: email});
});

router.post('/update', function (req, res, next) {
    var promises = [];
    promises.push(getTimeline(sessionID, req.body.userScreenName, req.body.algorithm, req.session, req.body.email, req.body.sessionURL));
    promises.push(getTimeline(sessionID, req.body.brandScreenName, req.body.algorithm, req.session, req.body.email, req.body.sessionURL));
    Promise.all(promises).then(results => {
        res.status(200).send(
            {
                algorithm: req.body.algorithm,
                user: results[0],
                brand: results[1]
            })
    }).catch(err => {
        console.log(err);
        try {
            var parsedError = JSON.parse(err);
            if (req.body.algorithm === "IBM-Watson" && parsedError.code === 401) {
                // this error means personality credentials are invalid
                delete req.session.bluemixPersonalityApikey;
            }
        } catch (e) {
            console.log(e);
        }

        res.status(404).send(err);
    });
});

router.get('/score', function(req, res, next){
    lambdaHandler.invoke('bae_get_sim_score', 'bae_get_sim_score', {
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
 * @param algorithm
 * @param credentials
 * @param emailAddress
 * @param sessionURL
 * @returns {Promise<any>}
 */
function getTimeline(sessionID, screenName, algorithm, credentials, emailAddress = "NA", sessionURL = null) {

    return new Promise((resolve, reject) =>

        // 1. check if username exist
        lambdaHandler.invoke('bae_check_screen_name', 'bae_check_screen_name', {
            consumer_key: TWITTER_CONSUMER_KEY,
            consumer_secret: TWITTER_CONSUMER_SECRET,
            access_token: credentials.twtAccessTokenKey,
            access_token_secret: credentials.twtAccessTokenSecret,
            screen_name: screenName,
            sessionID: sessionID,
        })
        .then(user => {

            // 1.1 if user name exist, check if timeline has been collected
            if (user['user_exist']) {
                s3.listFiles(sessionID +'/' + screenName).then( timelines => {
                    var files = Object.keys(timelines);

                    // 1.1.1 if timeline has already been collected, check if personality has been collected
                    if (files.indexOf(screenName + '_tweets.txt') > -1
                        && timelines[screenName + '_tweets.txt']['upToDate']) {
                        console.log({message: 'Timeline has already been collected and it is within on month of date range!'});

                        s3.listFiles(sessionID +'/' + screenName).then( personalities => {
                            var files = Object.keys(personalities);
                            if (algorithm === 'IBM-Watson') {
                                var personalityFname = screenName + '_personality.json';
                            }
                            else if (algorithm === 'TwitPersonality') {
                                var personalityFname = screenName + '_twitPersonality.json';
                            }
                            else if (algorithm === 'Pamuksuz-Personality') {
                                var personalityFname = screenName + '_utku_personality_average.json';
                            }
                            else {
                                reject("We cannot recognize the algorithm: " + algorithm + " you specified!");
                            }
                            // 1.1.1.1 if personality has been collected, job done!
                            if (files.indexOf(personalityFname) > -1 && timelines[personalityFname]['upToDate']) {
                                console.log({message: 'Personality has already been collected and it is within one month of date range!'});

                                s3.parseFile(sessionID + '/' + screenName + '/' + personalityFname)
                                    .then( personality =>{
                                        personality['screen_name'] = screenName;
                                        personality['profile_img'] = user['profile_img'];
                                        personality['statuses_count'] = user['statuses_count'];
                                        personality['lastModified'] = timelines[screenName + '_tweets.txt']['lastModified'];
                                        resolve(personality);
                                    }).catch(err =>{
                                    reject(err);
                                });
                            }

                            // 1.1.1.2 if not collected, collect personality, job done!
                            else {
                                if (algorithm === 'IBM-Watson') {
                                    lambdaHandler.invoke('bae_get_personality', 'bae_get_personality', {
                                        sessionID: sessionID,
                                        apikey: credentials.bluemixPersonalityApikey,
                                        screen_name: screenName,
                                    }).then(personality => {
                                        console.log(user);
                                        personality['screen_name'] = screenName;
                                        personality['profile_img'] = user['profile_img'];
                                        personality['statuses_count'] = user['statuses_count'];
                                        personality['lastModified'] = timelines[screenName + '_tweets.txt']['lastModified'];
                                        resolve(personality);
                                    }).catch(err => {
                                        reject(err);
                                    });
                                }
                                else if (algorithm === 'TwitPersonality') {
                                    reject("We are currently experiencing some problem with the TwitPersonality alogrithm, " +
                                        "and we have to temporarily deprecate it.");
                                }
                                else if (algorithm === 'Pamuksuz-Personality') {
                                    if (sessionURL === null) reject("You have to provide sessionURL!");
                                    var jobName = sessionID + '_' + screenName;

                                    // set default batch command
                                    var command = [
                                        "python3.6",
                                        "/scripts/batch_function.py",
                                        "--sessionID", sessionID,
                                        "--screen_name", screenName,
                                        "--email", emailAddress,
                                        "--sessionURL", sessionURL
                                    ];
                                    batchHandler.batch(
                                        'arn:aws:batch:us-west-2:083781070261:job-definition/bae_utku_brand_personality:1',
                                        jobName,
                                        'arn:aws:batch:us-west-2:083781070261:job-queue/SMILE_batch',
                                        "bae_utku_brand_personality",
                                        command)
                                    .then(data => {
                                        resolve(data);
                                    }).catch(err => {
                                        reject(err);
                                    });
                                }
                                else {
                                    reject("We cannot recognize the algorithm: " + algorithm + " you specified!");
                                }
                            }
                        }).catch(err => {
                            reject(err);
                        })
                    }

                    // 1.1.2 if timeline hasn't been collected, collect timeline
                    else {
                        lambdaHandler.invoke('bae_collect_timeline', 'bae_collect_timeline', {
                            sessionID: sessionID,
                            consumer_key: TWITTER_CONSUMER_KEY,
                            consumer_secret: TWITTER_CONSUMER_SECRET,
                            access_token: credentials.twtAccessTokenKey,
                            access_token_secret: credentials.twtAccessTokenSecret,
                            screen_name: screenName
                        }).then(timelines => {

                            if (algorithm === 'IBM-Watson') {
                                lambdaHandler.invoke('bae_get_personality', 'bae_get_personality', {
                                    sessionID: sessionID,
                                    apikey: credentials.bluemixPersonalityApikey,
                                    screen_name: screenName,
                                }).then(personality => {
                                    personality['screen_name'] = screenName;
                                    personality['profile_img'] = user['profile_img'];
                                    personality['statuses_count'] = user['statuses_count'];
                                    personality['lastModified'] = new Date();
                                    resolve(personality);
                                }).catch(err => {
                                    reject(err);
                                })
                            }
                            else if (algorithm === 'TwitPersonality') {
                                reject("We are currently experiencing some problem with the TwitPersonality alogrithm, " +
                                    "and we have to temporarily deprecate it.");
                            }
                            else if (algorithm === 'Pamuksuz-Personality') {
                                if (sessionURL === null) reject("You have to provide sessionURL!");
                                var jobName = sessionID + '_' + screenName;

                                // set default batch command
                                var command = [
                                    "python3.6",
                                    "/scripts/batch_function.py",
                                    "--sessionID", sessionID,
                                    "--screen_name", screenName,
                                    "--email", emailAddress,
                                    "--sessionURL", sessionURL
                                ];
                                batchHandler.batch(
                                    'arn:aws:batch:us-west-2:083781070261:job-definition/bae_utku_brand_personality:1',
                                    jobName,
                                    'arn:aws:batch:us-west-2:083781070261:job-queue/SMILE_batch',
                                    "bae_utku_brand_personality",
                                    command)
                                .then(data => {
                                    resolve(data);
                                }).catch(err => {
                                    reject(err);
                                });
                            }
                            else {
                                reject("We cannot recognize the algorithm: " + algorithm + " you specified!");
                            }
                        }).catch(err => {
                            reject(err);
                        });
                    }
                }).catch(err => {
                    console.log(err);
                    reject(err);
                })
            }

            // 1.2 if doesn't exist, reject
            else {
                reject('User screen name: ' + screenName + ' does not exist!');
            }
        }).catch(err => {
            console.log(err);
            reject(err);
        }));
}

module.exports = router;
