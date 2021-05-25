var AWS = require('aws-sdk');
var mime = require('mime');
var fs = require('fs');
var rmdir = require('rimraf');
var archiver = require('archiver');


class S3Helper {
	constructor(DOCKERIZED, AWS_ACCESSKEY, AWS_ACCESSKEYSECRET){
		//use minio for dockerized version
        if (process.env.HOST_IP){
            var hostIp = process.env.HOST_IP;
        }
        else {
            var hostIp = 'minio';
        }

		if (DOCKERIZED) {
			this.s3 = new AWS.S3({
				accessKeyId: AWS_ACCESSKEY,
				secretAccessKey: AWS_ACCESSKEYSECRET,
                endpoint:'http://' + hostIp + ':9000',
				s3ForcePathStyle: true,
				signatureVersion: 'v4'
			});
		}
		// use AWS s3 bucket
		else {
			this.s3 = new AWS.S3({
				accessKeyId: AWS_ACCESSKEY,
				secretAccessKey: AWS_ACCESSKEYSECRET,
			})
		}
	}

    /**
     * upload local files to s3 bucket
     * @param localFile
     * @param remoteKey
     * @returns {Promise<any>}
     */
    uploadToS3(localFile, remoteKey){
        // make sure no space in file object in S3
        remoteKey = remoteKey.replace(/\s+/g, "_");

        return new Promise((resolve, reject) =>{
            var buffer = fs.readFileSync(localFile);
            var param = {
            	Bucket:BUCKET_NAME,
                Key: remoteKey,
                Body: buffer,
                ContentType:mime.getType(localFile)
            };

            var s3 = this.s3;
            s3.upload(param, function(err,data){
                if (err){
                    console.log(err);
                    reject(err);
                }else{
                    var fileURL = s3.getSignedUrl('getObject',{Bucket:BUCKET_NAME,Key:remoteKey, Expires:604800});
                    resolve(fileURL);
                }
            });
        })

    };

    listFolders(prefix){
        return new Promise((resolve,reject) =>{
            this.s3.listObjectsV2({
				Bucket:BUCKET_NAME,
				Prefix:prefix,
				Delimiter:'/'
			},function(err,data){
                if (err){
                    console.log(err);
                    reject(err);
                }
                var folderObj = {};
                var fileList = data.CommonPrefixes;
                if (fileList !== []){
                    for (var i=0, length=fileList.length; i< length; i++){
                        var folderID = fileList[i].Prefix.split('/').slice(-2)[0];
                        folderObj[folderID] = fileList[i].Prefix;
                    }
                }
                resolve(folderObj);
            });
        });

    };

    listFiles(prefix, signedUrl=false){
        return new Promise((resolve,reject) =>{
            var s3 = this.s3;
            s3.listObjectsV2({
				Bucket:BUCKET_NAME,
				Prefix:prefix
			},function(err,data){
                if (err){
                    console.log(err);
                    reject(err);

                }else{

                    //if (!data.IsTruncated){

                    var folderObj = {};
                    var fileList = data.Contents;
                    for (var i=0, length=fileList.length; i< length; i++){
                        // generate downloadable URL
                        var filename = fileList[i].Key.split('/').slice(-1)[0];
                        var lastModified = new Date(fileList[i].LastModified);

                        var monthFromToday = new Date();
                        monthFromToday.setMonth(monthFromToday.getMonth() -1);
                        monthFromToday.setHours(0,0,0);
                        monthFromToday.setMilliseconds(0);
                        var upToDate = +lastModified > +monthFromToday;

                        folderObj[filename] = {};
                        folderObj[filename]['lastModified'] = lastModified;
                        folderObj[filename]['upToDate'] = upToDate;
                        folderObj[filename]['remoteKey'] = fileList[i].Key;

                        if (signedUrl){
                            var fileURL = s3.getSignedUrl('getObject',
                                {Bucket:BUCKET_NAME, Key:fileList[i].Key, Expires:604800});
                            folderObj[filename]['signedUrl'] = fileURL;
                        }
                    }

                    resolve(folderObj);
                }
            });
        });
    };

    downloadFolder(prefix, downloadPath){

        return new Promise((resolve,reject) =>{
            var s3 = this.s3;
            s3.listObjectsV2({
				Bucket:BUCKET_NAME,
				Prefix:prefix
			}, function(err,data){
                if(err){
                    console.log(err);
                    reject(err);
                }else{
                    if (!data.IsTruncated){
                        // create a promise array to hold all the downloads since it's async
                        var p_arr = [];

                        data.Contents.forEach(function(val,index,array){
                            // making the path
                            var path = val.Key.split('/');
                            var currPath = downloadPath;
                            for (var i=1, length=path.length-1; i< length; i++){
                                currPath += '/' + path[i];
                                if (!fs.existsSync(currPath)) fs.mkdirSync(currPath, {recursive:true});
                            }
                            p_arr.push(new Promise((resolve,reject) =>{
                                s3.getObject({ Bucket:BUCKET_NAME, Key:val.Key},function(err,data){
                                    if (err){
                                        console.log(err,err.stack);
                                        reject(err);
                                    }else {
                                        fs.writeFile(currPath+'/'+path.slice(-1), data.Body, function(err){
                                            if (err) console.log(err);
                                            console.log('finished: ' + val.Key);
                                            resolve(val.Key);
                                        });
                                    }
                                });
                            }));

                        });

                        Promise.all(p_arr).then( values => {
                            resolve(values);
                        }).catch( err =>{
                            console.log(err);
                            reject(err);
                        });
                    }else{
                        reject('You have more than 1000 items in your folders, we cannot download or delete that many files. ' +
							'Please contact the administrator: TechServicesAnalytics@mx.uillinois.edu with your sessionID.');
                    }
                }
            });
        });

    };

    deleteRemoteFolder(prefix){

        return new Promise((resolve,reject) =>{
            var s3 = this.s3;
            s3.listObjectsV2({
				Bucket:BUCKET_NAME,
				Prefix:prefix
			},function(err,data){
                if (err){
                    // if not exist
                    console.log('cannot list error' + err);
                    resolve(err);
                }else{
                    if (data.KeyCount === 0){
                        console.log('There is no data in the folder you specified!');
                        resolve(prefix);
                    }else{
                        if (!data.IsTruncated){
                            var params = {
                            	Bucket: BUCKET_NAME,
                                Delete:{ Objects:[] }
                            };
                            data.Contents.forEach(function(content) {
                                params.Delete.Objects.push({Key: content.Key});
                            });

                            s3.deleteObjects(params, function(err, data) {
                                if(err){
                                    console.log('cannot delete err');
                                    reject(err);
                                }else{
                                    resolve(prefix);
                                }
                            });
                        }else{
                            reject('You have more than 1000 items in your folders, we cannot download or delete that many files. ' +
								'Please contact the administrator: TechServicesAnalytics@mx.uillinois.edu with your sessionID.');
                        }
                    }
                }
            })
        });
    };

    deleteLocalFolders(path){

        return new Promise(function(resolve, reject){
            if (fs.existsSync(path)){
                rmdir(path,function(error){
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

    };

    deleteLocalFile(filepath) {
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
     * @param remoteKey
     * @returns {Promise<any>}
     */
    parseFile(remoteKey){
        return new Promise((resolve, reject) => {

            this.s3.getObject({ Bucket:BUCKET_NAME, Key:remoteKey},function(err,data){
                if (err){
                    console.log(err,err.stack);
                    reject(err);
                }else {
                    resolve(JSON.parse(data.Body));
                }
            });
        });
    }

    /**
     * zip the downloaded forder to one file
     * @param zipPath
     * @param zipFilename
     * @param sourceFolder
     * @param targetFolderName
     * @returns {Promise<any>}
     */
    zipDownloads(zipPath, zipFilename, sourceFolder, targetFolderName){

        return new Promise((resolve,reject) => {

            var archive = archiver('zip', {
                // Sets the compression level
                zlib: { level: 9 }
            });

            if (!fs.existsSync(zipPath)){
                console.log("create zipPath folder");
                fs.mkdirSync(zipPath, {recursive:true});
            }

            var fileOutput = fs.createWriteStream(zipPath + "/" + zipFilename)

            fileOutput.on('close',function(){
                resolve(zipPath + "/" + zipFilename);
            });

            archive.on('warning', function(err) {
                if (err.code === 'ENOENT') {
                    // log warning
                } else {
                    // throw error
                    throw err;
                }
            });

            archive.on('error',function(err){
                console.log(err);
                reject(err);
            });

            archive.pipe(fileOutput);
            archive.directory(sourceFolder, targetFolderName);

            archive.finalize();
        });

    }


}


module.exports = S3Helper;
