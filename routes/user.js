var express = require('express');
var router = express.Router();
var userService = require('../services/userService');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/getUser', verifyAuth, function(req, res, next) {
  res.sendStatus('200');
});


function verifyAuth(req, res, next) {
  console.log(req.user);
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = router;
