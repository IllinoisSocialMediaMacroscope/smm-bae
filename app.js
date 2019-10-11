var express = require('express');
var path = require('path');
var http = require('http');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var app = express();

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
