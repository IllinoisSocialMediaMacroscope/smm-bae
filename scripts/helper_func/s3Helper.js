var AWS = require('aws-sdk');
var config = require('../../config');
var mime = require('mime');

AWS.config.update({
	accessKeyId: config.aws.access_key,
	secretAccessKey:config.aws.access_key_secret });
	
var s3 = new AWS.S3();
var fs = require('fs');

function uploadToS3(localFile, remoteKey){
	
	return new Promise((resolve, reject) =>{
				var buffer = fs.readFileSync(localFile);
				var param = {Bucket:'macroscope-bae',
					Key: remoteKey, 
					Body: buffer,
					ContentType:mime.getType(localFile)
				};
				s3.upload(param, function(err,data){
						if (err){
							console.log(err);
							reject(err);
						}else{
							var fileURL = s3.getSignedUrl('getObject',{Bucket:'macroscope-bae',Key:remoteKey, Expires:604800});
							resolve(fileURL);
						}
					});
			})
			
}

function list_folders(prefix){
	return new Promise((resolve,reject) =>{
		s3.listObjectsV2({Bucket:'macroscope-bae',Prefix:prefix, Delimiter:'/'},function(err,data){
			if (err){
				console.log(err);
				reject(err);
			}			
			
			folderObj = {};
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

function list_files(prefix){
	return new Promise((resolve,reject) =>{
		s3.listObjectsV2({Bucket:'macroscope-bae',Prefix:prefix},function(err,data){
			if (err){
				console.log(err);
				reject(err);
				
			}else{
				// folderObj = { filename: {lastModified: lastModified, upTodDate: boolean(lastmodified <= monthFromToday)} }
				var folderObj = {};
				var fileList = data.Contents;
				for (var i=0, length=fileList.length; i< length; i++){
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
				}

				resolve(folderObj);
			}
		});
	});					
}

function download_file(fname){
    return new Promise((resolve,reject) => {
        s3.getObject({Bucket: 'macroscope-bae', Key: fname}, function (err, data) {
            if (err) {
                console.log(err, err.stack);
                reject(err);
            } else {
                resolve(JSON.parse(data.Body.toString()));
            }
        });
    });
}

function download_folder(prefix){
	
	return new Promise((resolve,reject) =>{
		s3.listObjectsV2({Bucket:'macroscope-bae',Prefix:prefix}, function(err,data){
			if(err){
				console.log(err);
				reject(err);
			}else{
				if (!data.IsTruncated){
					// create a place to hold the the downloaded files
					if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads');
					
					// create a promise array to hold all the downloads since it's async
					var p_arr = [];
					
					data.Contents.forEach(function(val,index,array){
						console.log(prefix, val.Key);
						// making the path
						var path = val.Key.split('/');
						var currPath = './downloads';
						for (var i=1, length=path.length-1; i< length; i++){
							currPath += '/' + path[i];
							if (!fs.existsSync(currPath)) fs.mkdirSync(currPath);
						}					
						p_arr.push(new Promise((resolve,reject) =>{
							s3.getObject({ Bucket:'macroscope-bae', Key:val.Key},function(err,data){
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
					reject('You have more than 1000 items in your folders, we cannot download or delete that many files. Please contact the administrator: TechServicesAnalytics@mx.uillinois.edu with your sessionID.');
				}	
			}				
		});
	});
	
}

var deleteRemoteFolder = function(prefix){
	
	return new Promise((resolve,reject) =>{
		s3.listObjectsV2({Bucket:'macroscope-bae',Prefix:prefix},function(err,data){
			if (err){
				// if not exist
				console.log('cannot list error' + err);
				resolve(err);
			}else{
				if (data.KeyCount === 0){
					console.log('There is no data in the folder you specified!');
					resolve();
				}else{
					if (!data.IsTruncated){
						params = { Bucket: 'macroscope-bae',
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
							  resolve(data);
							}
						});
					}else{
						reject('You have more than 1000 items in your folders, we cannot download or delete that many files. Please contact the administrator: TechServicesAnalytics@mx.uillinois.edu with your sessionID.');
					}
				}
			}
		})
	});

};

function generate_downloadable(key){
    return new Promise((resolve,reject) =>{
        s3.getSignedUrl('getObject', {Bucket:'macroscope-bae',Key:key, Expires: 60*60*24*7},
			function(err,data){
        		if (err) reject(err);
        		resolve(data);
        });
    });
}

module.exports = {uploadToS3, list_folders, list_files, deleteRemoteFolder, download_folder, download_file, generate_downloadable};
