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
    s3Helper.listFolders(req.query.sessionID + '/').then( folders => {
        var folders = Object.keys(folders);
        res.status(200).send({'history_list': folders});

    });
});

router.post('/history', function(req,res,next){
    lambdaInvoke('bae_bulk_comparison', {
        screen_names: req.body.screenNames,
        sessionID: req.body.sessionID
    }).then(table => {
        res.status(200).send(table);
    }).catch(err => {
        res.status(500).send(err);
    });
});

router.get('/download', function(req,res, next){
   s3Helper.downloadFolder(req.query.sessionID + '/' + req.query.screenName +'/')
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

            })
        }).catch(err =>{
        res.status(404).send(err);
    })
});

router.get('/deleteRemote', function(req,res,next){
    s3Helper.deleteRemoteFolder(req.query.sessionID + '/' + req.query.screenName + '/')
        .then(data =>{
            console.log('remove', data);
            res.status(200).send(data);
        }).catch(err => { res.status(404).send(err)} );
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
