var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  if (req.isAuthenticated()) {
    res.render('home', {authenticated: true, user: req.user
    });
  }else {
    res.render('index', {authenticated: false});
  }});

router.get('/register', function(req, res, next) {
  res.render('register');
});


function verifyAuth(req, res, next) {
  console.log(req.user);
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = router;
