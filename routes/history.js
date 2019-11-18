var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var appPath = path.dirname(__dirname);
var localStorageHelper = require(path.join(appPath, 'scripts','helper_func', 'localStorageHelper.js'));
var connectToRabbitMQ = require(path.join(appPath,'scripts','helper_func','rabbitmqSender.js'));
var archiver = require('archiver');

router.get('/history', function(req, res, next){
    var promiseArr = [];

    // loop through folders
    localStorageHelper.listFolders(sessionID + '/').then( folders => {
        folders.forEach( folder =>{
            promiseArr.push(new Promise((resolve, reject) => {

                // loop through each folder to find its files
                localStorageHelper.listFiles(sessionID + '/' + folder + '/').then( files =>{
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

router.post('/history', function(req,res,next){
    connectToRabbitMQ('bae_bulk_comparison', {
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
    // create a place to hold the the downloaded files
    if (!fs.existsSync('downloads')) fs.mkdirSync('downloads');
    var downloadPath = '/tmp/' + sessionID + '/' + req.query.screenName +'/';
    var filename = 'downloads/BAE-' + req.query.screenName + '.zip';
    zipDownloads(filename,downloadPath, req.query.screenName).then(() => {
        res.on('finish', function(){
            localStorageHelper.deleteLocalFolders('downloads').then(data => {
                console.log(data);
            }).catch(err =>{
                console.log(err);
            })
        });
        res.download(filename);}).catch(err => {res.status(500).send(err);

    });
});

router.get('/deleteRemote', function(req,res,next){
    localStorageHelper.deleteLocalFolders(sessionID + '/' + req.query.screenName + '/')
        .then(data =>{
            console.log('remove', data);
            res.status(200).send(data);
        }).catch(err => { res.status(404).send(err)} );
});

router.get('/purgeRemote', function(req,res,next){
    localStorageHelper.deleteLocalFolders(sessionID + '/').then( values => {
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
