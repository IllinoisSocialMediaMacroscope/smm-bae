var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var appPath = path.dirname(__dirname);
var s3_helper = require(path.join(appPath, 'scripts','helper_func', 's3Helper.js'));
var deleteLocalFolders = require(path.join(appPath,'scripts', 'helper_func', 'deleteDir.js'));
var archiver = require('archiver');

router.get('/history', function(req, res, next){
    var personality_list = [];
    s3_helper.list_folders(req.query.sessionID + '/').then( folders => {
        var folders = Object.keys(folders);
        res.status(200).send({'history_list': folders});

    });

});

router.post('/history', function(req,res,next){
    var promises = [];
    promises.push( getPersonality(req.body.sessionID, req.body.user_screen_name));
    promises.push( getPersonality(req.body.sessionID, req.body.brand_screen_name));
    Promise.all(promises).then( results => {
        res.status(200).send(
        {
            user:results[0],
            brand:results[1]
        })
    }).catch( err =>{
        res.status(404).send(err);
    });
});

router.get('/download', function(req,res, next){
   s3_helper.download_folder(req.query.sessionID + '/' + req.query.screen_name +'/')
        .then( fnames =>{
            var filename = 'downloads/BAE-' + req.query.screen_name + '.zip';
            zipDownloads(filename,'downloads/'+req.query.screen_name, req.query.screen_name).then(() => {
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
    s3_helper.deleteRemoteFolder(req.query.sessionID + '/' + req.query.screen_name + '/')
        .then(data =>{
            console.log('remove', data);
            res.status(200).send(data);
        }).catch(err => { res.status(404).send(err)} );
});


router.get('/sunburst', function(req, res, next){
    getPersonality(req.query.sessionID, req.query.screen_name).then(data =>{
        res.render('sunburst', {personality:data.personality, profile_img:data.profile_img});
    }).catch(err =>{ res.status(404).render(err)});
});

function getPersonality(sessionID, screen_name){
    return new Promise((resolve, reject) =>{
        s3_helper.download_file(sessionID + '/' + screen_name + '/' + screen_name + '_personality.json')
            .then( personality =>{
                resolve(personality);
            }).catch(err =>{
            reject(err);
        })
    });
}

function zipDownloads(filename,zipfolder, screen_name){

    return new Promise((resolve,reject) => {

        var archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
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
        archive.directory(zipfolder, screen_name);

        archive.finalize();
    });

}

module.exports = router;
