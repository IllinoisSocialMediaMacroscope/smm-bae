var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var appPath = path.dirname(__dirname);
var s3Helper = require(path.join(appPath, 'scripts','helper_func', 's3Helper.js'));
var lambdaInvoke = require(path.join(appPath,'scripts','helper_func','lambdaHelper.js'));
var deleteLocalFolders = require(path.join(appPath,'scripts', 'helper_func', 'deleteDir.js'));
var archiver = require('archiver');

router.get('/history', function(req, res, next){
    res.render('history', {});
});

router.get('/history-list', function(req, res, next){
    var promiseArr = [];

    // loop through folders
    s3Helper.listFolders(sessionID + '/').then( folders => {
        var folders = Object.keys(folders);

        folders.forEach( folder =>{
            promiseArr.push(new Promise((resolve, reject) => {

                // loop through each folder to find its files
                s3Helper.listFiles(sessionID + '/' + folder + '/').then( files =>{
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
    s3Helper.listFiles(sessionID + '/' + screenName).then(personalities => {
        var promises = [];
        var accountInfoFname = screenName + '_account_info.json';
        var IBMPersonalityFname = screenName + '_personality.json';
        var UtkuPersonalityFname = screenName + '_utku_personality_average.json';
        if (accountInfoFname in personalities){
            promises.push(s3Helper.downloadFile(sessionID + '/' + screenName + '/' + accountInfoFname));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }

        if (IBMPersonalityFname in personalities) {
            promises.push(s3Helper.downloadFile(sessionID + '/' + screenName + '/' + IBMPersonalityFname));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }

        if (UtkuPersonalityFname in personalities) {
            promises.push(s3Helper.downloadFile(sessionID + '/' + screenName + '/' + UtkuPersonalityFname));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }
        var accountInfo = results[0];
        var IBMPersonality = results[1];
        var UtkuPersonality = results[2];

        if (accountInfo){
            IBMPersonality['screen_name'] = screenName;
            IBMPersonality['profile_img'] = accountInfo['profile_image_url_https'];
            IBMPersonality['statuses_count'] = accountInfo['statuses_count'];
            UtkuPersonality['screen_name'] = screenName;
            UtkuPersonality['profile_img'] = accountInfo['profile_img'];
            UtkuPersonality['statuses_count'] = accountInfo['statuses_count'];
        }
        Promise.all(promises).then(results => {
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
    lambdaInvoke('bae_bulk_comparison', {
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
   s3Helper.downloadFolder(sessionID + '/' + req.query.screenName +'/')
        .then( fnames =>{
            var filename = 'downloads/BAE-' + req.query.screenName + '.zip';
            zipDownloads(filename,'downloads/'+req.query.screenName, req.query.screenName).then(() => {
                res.on('finish', function(){
                    deleteLocalFolders('downloads').then(data => {
                        console.log(data);
                    }).catch(err =>{
                        console.log(err);
                    })
                });
                res.download(filename);}).catch(err => {res.status(500).send(err);

            });
        }).catch(err =>{
        res.status(404).send(err);
    })
});

router.get('/deleteRemote', function(req,res,next){
    s3Helper.deleteRemoteFolder(sessionID + '/' + req.query.screenName + '/')
        .then(data =>{
            console.log('remove', data);
            res.status(200).send(data);
        }).catch(err => { res.status(404).send(err)} );
});

router.get('/purgeRemote', function(req,res,next){
    s3Helper.deleteRemoteFolder(sessionID + '/').then( values => {
        res.send({'data':'Successfully purged!'});
    }).catch( err =>{
        console.log(err);
        res.send({ERROR:err});
    });
});

/**
 * zip the downloaded forder to one file
 * @param filename
 * @param zipfolder
 * @param screenName
 * @returns {Promise<any>}
 */
function zipDownloads(filename,zipfolder, screenName){

    return new Promise((resolve,reject) => {

        var archive = archiver('zip', {
            // Sets the compression level
            zlib: { level: 9 }
        });

        var fileOutput = fs.createWriteStream(filename);
        fileOutput.on('close',function(){
            resolve(archive.pointer() + ' total bytes');
        });

        archive.on('error',function(err){
            console.log(err);
            reject(err);
        });

        archive.pipe(fileOutput);
        archive.directory(zipfolder, screenName);

        archive.finalize();
    });

}

module.exports = router;
