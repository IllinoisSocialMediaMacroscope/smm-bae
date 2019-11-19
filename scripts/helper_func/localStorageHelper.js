var fs = require('fs');
var rmdir = require('rimraf');
var path = require('path');
var archiver = require('archiver');


/**
 * list all the folder names in local path
 * @param prefix
 * @returns {Promise<any>}
 */
function listFolders(prefix){

    var prefixPath = path.join("/tmp", prefix);
    return new Promise((resolve, reject) =>{
        fs.access(prefixPath, function(statError, stats){
            if (statError) resolve([]);
            else {
                fs.readdir(prefixPath, function (readdirError, items) {
                    if (readdirError) reject(readdirError);
                    else {
                        var folders = [];
                        for (var i = 0, length = items.length; i < length; i++) {
                            // need check if it is a folder and not a file;
                            // to make sure folder is not hidden
                            if (fs.lstatSync(path.join(prefixPath,items[i])).isDirectory() && !items[i].startsWith(".")){
                                folders.push(items[i]);
                            }
                        }
                        resolve(folders);
                    }
                });
            }
        });
    });
}

/**
 * list all the file names in local path
 * @param prefix
 * @returns {Promise<any>}
 */
function listFiles(prefix){

    var prefixPath = path.join("/tmp", prefix);
    return new Promise((resolve, reject) =>{

        fs.access(prefixPath, function(statError, stats){
            if (statError) resolve({});
            else {
                fs.readdir(prefixPath, function (readdirError, items) {
                    if (readdirError) reject(readdirError);
                    else {
                        var folderObj = {};
                        for (var i = 0, length = items.length; i < length; i++) {
                            // need check if it is a file and not a folder;
                            // to make sure filename does not include hidden files
                            if (fs.lstatSync(path.join(prefixPath,items[i])).isFile() && !items[i].startsWith(".")){
                                var filename = items[i];
                                var fileStats = fs.statSync(path.join(prefixPath, filename));
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
function deleteLocalFolders(prefix) {
    var prefixPath = path.join("/tmp", prefix);
    return new Promise(function(resolve, reject){
        if (fs.existsSync(prefixPath)){
            rmdir(prefixPath,function(error){
                if (error){
                    console.log(error);
                    reject(error);
                }else{
                    resolve('success');
                }
            });
        }else{
            resolve('That local folder does not exist!');
        }
    });
}

function deleteLocalFile(filepath) {
    return new Promise(function(resolve, reject){
        if (fs.existsSync(filepath)){
            fs.unlink(filepath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        }
        else{
            resolve('That local folder does not exist!');
        }
    });
}

/**
 * download all the file given filename
 * @param fname
 * @returns {Promise<any>}
 */
function parseFile(fname){
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


/**
 *
 * @param prefix
 * @param filename
 * @param screenName
 * @returns {Promise<any>}
 */
function zipDownloads(prefix, filename, screenName){
    var zipfolder = path.join('/tmp', prefix);
    return new Promise((resolve,reject) => {

        var archive = archiver('zip', {
            // Sets the compression level
            zlib: { level: 9 }
        });

        var fileOutput = fs.createWriteStream(path.join(zipfolder, filename));
        fileOutput.on('close',function(){
            resolve(path.join(zipfolder, filename));
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


module.exports = {listFolders, listFiles, deleteLocalFolders, deleteLocalFile, zipDownloads, parseFile};
