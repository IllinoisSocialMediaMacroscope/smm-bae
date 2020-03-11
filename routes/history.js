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
            console.log(err);
            res.status(500).send(err);
        });

    });
});

router.get('/preview', function(req, res, next){
    var screenName = req.query.screenName;
    s3Helper.listFiles(sessionID + '/' + screenName).then(personalities => {
        var promises = [];
        if (screenName + '_personality.json' in personalities) {
            var IBMPersonality = screenName + '_personality.json';
            promises.push(s3Helper.downloadFile(sessionID + '/' + screenName + '/' + IBMPersonality));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }

        if (screenName + '_utku_personality_average.json' in personalities) {
            var UtkuPersonality = screenName + '_utku_personality_average.json';
            promises.push(s3Helper.downloadFile(sessionID + '/' + screenName + '/' + UtkuPersonality));
        }
        else{
            // push empty promise to resever the spot
            promises.push(new Promise((resolve,reject) => {resolve();}));
        }

        //TODO if twitPersonality algorithm in it then do the same for twitPersonality algorithm

        Promise.all(promises).then(results => {
            res.status(200).send({
                "IBM-Personality": results[0],
                "Pamuksuz-Personality": results[1]
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
