var express = require('express');
var router = express.Router();
var userService = require('../services/userService');

/* GET home page. */

router.get('/getUser', verifyAuth, function(req, res, next) {

  userService.getInfo(req.user.id, function(err, user) {
    if (err) res.json(err);
    if (user) res.json(user);
  });
});


function verifyAuth(req, res, next) {
  console.log(req.user);
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = router;
