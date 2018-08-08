var fs = require('fs');
var rmdir = require('rimraf');

var deleteLocalFolders = function(path) {
	
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


module.exports = deleteLocalFolders;
