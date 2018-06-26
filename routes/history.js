var express = require('express');
var router = express.Router();
var config = require('../config');
var path = require('path');
var appPath = path.dirname(__dirname);
var s3_helper = require(path.join(appPath, 'scripts','helper_func', 's3Helper.js'));

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

router.post('/download', function(req,res, next){
    s3_helper.download_file(req.body.sessionID + '/' + req.body.screen_name + '/' + req.body.screen_name + '_personality.json')
        .then( data =>{
            res.send(data);
        }).catch(err =>{
        res.status(404).send(err);
    })
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

module.exports = router;
