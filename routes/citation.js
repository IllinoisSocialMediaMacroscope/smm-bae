var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/citation', function(req, res, next){
    res.render('citation', {});
});

module.exports = router;
