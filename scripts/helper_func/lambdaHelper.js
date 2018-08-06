var AWS = require('aws-sdk');
var config = require('../../config');

AWS.config.update({
	accessKeyId: config.aws.accessKey,
	secretAccessKey: config.aws.accessKeySecret });
	
var lambda = new AWS.Lambda({region: 'us-west-2', 
								apiVersion: '2015-03-31',
								maxRetries: 0,
								maxRedirects: 0, 
								httpOptions:{timeout:600000}
							});

/**
 * wrapper function to invoke any AWS lambda with parameters
 * @param function_name
 * @param args
 * @returns {Promise<any>}
 */
function lambdaInvoke(function_name, args){
	
	var params = {
		FunctionName: function_name,
		InvocationType: 'RequestResponse',
		LogType: 'Tail',
		Payload: JSON.stringify(args)
	};

	return new Promise((resolve,reject) =>{
		lambda.invoke(params, function(err, data) {
			if (err){
				console.log("there is an lambda error happening");
				reject(err);
			}else{
				response = JSON.parse(data.Payload);
				if ('errorMessage' in response){
					reject(response['errorMessage']);
				}
				resolve(response);
			}
		});
	});

}


module.exports = lambdaInvoke;
