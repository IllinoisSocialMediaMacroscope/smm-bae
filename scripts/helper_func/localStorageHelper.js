var fs = require('fs');
var path = require('path');

/**
 * upload local files destination
 * @param localFile
 * @param remoteKey
 * @returns {Promise<any>}
 */
function uploadToLocal(localFile, remoteKey){

    // return new Promise((resolve, reject) =>{
    //     var buffer = fs.readFileSync(localFile);
    //     var param = {Bucket:'macroscope-bae',
    //         Key: remoteKey,
    //         Body: buffer,
    //         ContentType:mime.getType(localFile)
    //     };
    //     s3.upload(param, function(err,data){
    //         if (err){
    //             console.log(err);
    //             reject(err);
    //         }else{
    //             var fileURL = s3.getSignedUrl('getObject',{Bucket:'macroscope-bae',Key:remoteKey, Expires:604800});
    //             resolve(fileURL);
    //         }
    //     });
    // })

}

/**
 * list all the folder names in local path
 * @param prefix
 * @returns {Promise<any>}
 */
function listFolders(prefix){
    // return new Promise((resolve,reject) =>{
    //     s3.listObjectsV2({Bucket:'macroscope-bae',Prefix:prefix, Delimiter:'/'},function(err,data){
    //         if (err){
    //             console.log(err);
    //             reject(err);
    //         }
    //
    //         folderObj = {};
    //         var fileList = data.CommonPrefixes;
    //         if (fileList !== []){
    //             for (var i=0, length=fileList.length; i< length; i++){
    //                 var folderID = fileList[i].Prefix.split('/').slice(-2)[0];
    //                 folderObj[folderID] = fileList[i].Prefix;
    //             }
    //         }
    //         resolve(folderObj);
    //     });
    // });

}

/**
 * list all the file names in local path
 * @param prefix
 * @returns {Promise<any>}
 */
function listFiles(prefix){

    var prefixPath = path.join("/tmp", prefix);
    return new Promise((resolve, reject) =>{

        fs.stat(prefixPath, function(statError, stats){
            if (statError) reject(statError);
            else {
                fs.readdir(prefixPath, function (readdirError, items) {
                    if (readdirError) reject(readdirError);
                    else {
                        var folderObj = {};
                        for (var i = 0, length = items.length; i < length; i++) {
                            var filename = items[i].Key.split('/').slice(-1)[0];
                            var fileStats = fs.statSync(path.join(prefixPath, items[i]));
                            var lastModified = new Date(fileStats.mtime);
                            var monthFromToday = new Date();
                            monthFromToday.setMonth(monthFromToday.getMonth() - 1);
                            monthFromToday.setHours(0, 0, 0);
                            monthFromToday.setMilliseconds(0);
                            var upToDate = +lastModified > +monthFromToday;

                            folderObj[filename] = {};
                            folderObj[filename]['lastModified'] = lastModified;
                            folderObj[filename]['upToDate'] = upToDate;
                        }

                        resolve(folderObj);
                    }
                });
            }
        });
    });
}

/**
 * delete local folder given pathname
 * @param prefix
 * @returns {Promise<any>}
 */
var deleteRemoteFolder = function(prefix){

    // return new Promise((resolve,reject) =>{
    //     s3.listObjectsV2({Bucket:'macroscope-bae',Prefix:prefix},function(err,data){
    //         if (err){
    //             // if not exist
    //             console.log('cannot list error' + err);
    //             resolve(err);
    //         }else{
    //             if (data.KeyCount === 0){
    //                 console.log('There is no data in the folder you specified!');
    //                 resolve();
    //             }else{
    //                 if (!data.IsTruncated){
    //                     params = { Bucket: 'macroscope-bae',
    //                         Delete:{ Objects:[] }
    //                     };
    //                     data.Contents.forEach(function(content) {
    //                         params.Delete.Objects.push({Key: content.Key});
    //                     });
    //
    //                     s3.deleteObjects(params, function(err, data) {
    //                         if(err){
    //                             console.log('cannot delete err');
    //                             reject(err);
    //                         }else{
    //                             resolve(data);
    //                         }
    //                     });
    //                 }else{
    //                     reject('You have more than 1000 items in your folders, we cannot download or delete that many files. ' +
    //                         'Please contact the administrator: TechServicesAnalytics@mx.uillinois.edu with your sessionID.');
    //                 }
    //             }
    //         }
    //     })
    // });

};

/**
 * download all the file given filename
 * @param fname
 * @returns {Promise<any>}
 */
function downloadFile(fname){
    var fnamePath = path.join("/tmp", fname);
    return new Promise((resolve,reject) => {
        fs.readFile(fnamePath, function(err, data){
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}


module.exports = {uploadToS3, listFolders, listFiles, deleteRemoteFolder, downloadFile};
