var express = require('express');
var path = require('path');
var http = require('http');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();
var LambdaHelper = require(path.join(__dirname, 'scripts', 'helper_func', 'lambdaHelper.js'));
var BatchHelper = require(path.join(__dirname, 'scripts', 'helper_func', 'batchHelper.js'));
var RabbitmqSender = require(path.join(__dirname, 'scripts', 'helper_func', 'rabbitmqSender.js'));
var S3Helper = require(path.join(__dirname, 'scripts', 'helper_func', 's3Helper.js'));


/**
 * default path from environment file and set it global; maybe not be used
 */
baeHomePath = path.join(process.env.HOME, 'bae');
s3FolderName = process.env.USER || 'local';
email = true;

app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000*1800 },
    rolling: true
}));

app.use(express.static(path.join(__dirname, '/public')));
app.set('views',path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

if (process.env.DOCKERIZED === 'true'){
    // determine credentials either from file or from environment variable
    AWS_ACCESSKEY = process.env.AWS_ACCESSKEY;
    AWS_ACCESSKEYSECRET = process.env.AWS_ACCESSKEYSECRET;
    TWITTER_CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
    TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
    BUCKET_NAME = process.env.BUCKET_NAME;
    if (process.env.EMAIL_HOST === "" || process.env.EMAIL_HOST === undefined || process.env.EMAIL_HOST === null ||
        process.env.EMAIL_PORT === "" || process.env.EMAIL_PORT === undefined || process.env.EMAIL_PORT === null ||
        process.env.EMAIL_FROM_ADDRESS === "" || process.env.EMAIL_FROM_ADDRESS === undefined || process.env.EMAIL_FROM_ADDRESS === null ||
        process.env.EMAIL_PASSWORD === "" || process.env.EMAIL_PASSWORD === undefined || process.env.EMAIL_PASSWORD === null ){
        email = false;
    }

    // decide what handler to use
    lambdaHandler = new RabbitmqSender();
    batchHandler = new RabbitmqSender();
    s3 = new S3Helper(true, AWS_ACCESSKEY, AWS_ACCESSKEYSECRET);
}
else{
    var config = require('./config.json');
    AWS_ACCESSKEY = config.aws.accessKey;
    AWS_ACCESSKEYSECRET = config.aws.accessKeySecret;
    TWITTER_CONSUMER_KEY = config.twitter.consumerKey;
    TWITTER_CONSUMER_SECRET = config.twitter.consumerSecret;
    BUCKET_NAME = "macroscope-bae";
    lambdaHandler = new LambdaHelper(AWS_ACCESSKEY, AWS_ACCESSKEYSECRET);
    batchHandler = new BatchHelper(AWS_ACCESSKEY, AWS_ACCESSKEYSECRET);
    s3 = new S3Helper(false, AWS_ACCESSKEY, AWS_ACCESSKEYSECRET);
}

// paths
app.use('/', require('./routes/index'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/history'));
app.use('/', require('./routes/documentation'));
app.use('/', require('./routes/checkBot'));
app.use('/', require('./routes/userPrompt'));
app.use('/', require('./routes/citation'));

// set server
var debug = require('debug');
var port = normalizePort('8001');
app.set('port', port);
var server = http.createServer(app);
server.timeout = 1000*60*10; // 10 minutes

// listen to a certain port
server.listen(port);
console.log("App is listening on \n\tlocalhost:" + port);
server.on('error', onError);
server.on('Listening', onListening);

function normalizePort(val){
    var port = parseInt(val, 10);

    if (isNaN(port)){ return val; }
    if (port >= 0){ return port; }

    return false;
}

// event listener for HTTP server "error" event
function onError(error){
    if (error.syscall !== 'listen'){ throw error; }

    var bind = typeof port === 'string'? 'Pipe ' + port : 'Port '+port;

    // handle specific listen errors with friendly messages
    switch(error.code){
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;

        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;

        default:
            throw error;
    }
}

// event listener for http server "listening" event
function onListening(){
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe '+addr : 'port '+addr.port;
    debug('Listening on ' + bind);
}

/**
 * read user name from environment file and set it global
 */
sessionID = process.env.USER || 'local';
