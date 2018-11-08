var express = require('express');
var router = express.Router();
var path = require('path');
var appPath = path.dirname(__dirname);
var documentation = require(path.join(appPath, 'public', 'documentation.json'));

router.get('/documentation', function(req, res, next){
    res.render('documentation', documentation);
});

module.exports = router;
