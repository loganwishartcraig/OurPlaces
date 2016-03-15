var express = require('express');
var router = express.Router();

var userService = require('../services/userService');

/* GET home page. */
router.get('/', function(req, res, next) {

  if (req.isAuthenticated()) {
    res.redirect('/home');

  } else {
    res.render('index');
  }
});

router.get('/home', function(req, res, next) {

  if (req.isAuthenticated()) {

    userService.getInfo(req.user.id, function(err, user) {
      console.log(user);

      if (err) res.status(501).json({
        message: "db error pulling user info"
      });
      else if (!user) res.status(400).json({
        message: "could not find user"
      });
      else res.render('home', {
        user: user
      });

    });
  } else {
    res.redirect('/');
  }
});

function verifyAuth(req, res, next) {
  console.log(req.user);
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

module.exports = router;
