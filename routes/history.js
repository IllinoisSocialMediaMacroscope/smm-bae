var express = require('express');
var router = express.Router();
var path = require('path');
var archiver = require('archiver');


router.get('/history', function(req, res, next){
    res.render('history', {});
});

router.get('/history-list', function(req, res, next){
    var promiseArr = [];

    // loop through folders
    s3.listFolders(sessionID + '/').then( folders => {
        var folders = Object.keys(folders);

        folders.forEach( folder =>{
            promiseArr.push(new Promise((resolve, reject) => {

                // loop through each folder to find its files
                s3.listFiles(sessionID + '/' + folder + '/').then( files =>{
                    var historyListItem = {};
                    var files = Object.keys(files);
                    historyListItem[folder] = files;

                    resolve(historyListItem);

                }).catch(err =>{
                    reject(err);
                });
            }));
        });

        Promise.all(promiseArr).then( results => {
            res.status(200).send({'historyList': results});
        }).catch( err => {
            res.status(500).send(err);
        });

    });
});

router.get('/preview', function(req, res, next){
    var screenName = req.query.screenName;
    s3.listFiles(sessionID + '/' + screenName).then(personalities => {
        var promises = [];
        var accountInfoFname = screenName + '_account_info.json';
        var IBMPersonalityFname = screenName + '_personality.json';
        var UtkuPersonalityFname = screenName + '_utku_personality_average.json';
        if (accountInfoFname in personalities){
            promises.push(s3.parseFile(personalities[accountInfoFname]['remoteKey']));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }

        if (IBMPersonalityFname in personalities) {
            promises.push(s3.parseFile(personalities[IBMPersonalityFname]['remoteKey']));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }

        if (UtkuPersonalityFname in personalities) {
            promises.push(s3.parseFile(personalities[UtkuPersonalityFname]['remoteKey']));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }
        Promise.all(promises).then(results => {
            var accountInfo = results[0];
            var IBMPersonality = results[1];
            var UtkuPersonality = results[2];

            if (accountInfo){
                if (IBMPersonality){
                    IBMPersonality['screen_name'] = screenName;
                    IBMPersonality['profile_img'] = accountInfo['profile_image_url_https'];
                    IBMPersonality['statuses_count'] = accountInfo['statuses_count'];
                    IBMPersonality['lastModified'] = personalities[screenName + '_tweets.txt']['lastModified'];
                }

                if (UtkuPersonality){
                    UtkuPersonality['screen_name'] = screenName;
                    UtkuPersonality['profile_img'] = accountInfo['profile_image_url_https'];
                    UtkuPersonality['statuses_count'] = accountInfo['statuses_count'];
                    UtkuPersonality['lastModified'] = personalities[screenName + '_tweets.txt']['lastModified'];
                }
            }
            res.status(200).send({
                "IBM-Personality": IBMPersonality,
                "Pamuksuz-Personality": UtkuPersonality
            });
        }).catch(err => {
            res.status(500).send(err);
        });
    })
    .catch(listFileErr =>{
        res.status(500).send(listFileErr);
    })
});

router.post('/bulk-comparison', function(req,res,next){
    lambdaHandler.invoke('bae_bulk_comparison', 'bae_bulk_comparison', {
        screen_names: req.body.screenNames,
        sessionID: sessionID,
        algorithm: req.body.algorithm
    }).then(table => {
        res.status(200).send(table);
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.get('/download', function(req,res, next){
    var tmpPath = "tmp";

    var downloadPath = path.join(tmpPath, "downloads", req.query.screenName);
    s3.downloadFolder(sessionID + '/' + req.query.screenName +'/', downloadPath)
    .then( fnames =>{

        // for zip
        var zipPath = path.join(tmpPath, "zip", req.query.screenName)
        var zipFilename = 'BAE-' + req.query.screenName + '.zip';

        s3.zipDownloads(zipPath, zipFilename, sourceFolder=downloadPath, targetFolderName=req.query.screenName).then((fullZipfileName) => {
            res.on('finish', function(){
                s3.deleteLocalFolders(tmpPath).then(data => {
                    console.log(data);
                }).catch(err =>{
                    console.log(err);
                })
            });
            res.download(fullZipfileName);}).catch(err => {res.status(500).send(err);
        });
    }).catch(err =>{
        res.status(404).send(err);
    })
});

router.get('/deleteRemote', function(req,res,next){
    s3.deleteRemoteFolder(sessionID + '/' + req.query.screenName + '/')
        .then(data =>{
            console.log('remove', data);
            res.status(200).send(data);
        }).catch(err => { res.status(404).send(err)} );
});

router.get('/purgeRemote', function(req,res,next){
    s3.deleteRemoteFolder(sessionID + '/').then( values => {
        res.send({'data':'Successfully purged!'});
    }).catch( err =>{
        console.log(err);
        res.send({ERROR:err});
    });
});

module.exports = router;
