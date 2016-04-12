// routes used for main site navigation

// initial dependencies
var express = require('express');
var router = express.Router();
var userService = require('../services/userService');

// root route
router.get('/', function(req, res, next) {

  // if logged in, redirect to home,
  // otherwise, render the 'index' view
  if (req.isAuthenticated()) {
    res.redirect('/home');

  } else {
    res.render('index');
  }

});


// home route -- must be authenticated
// will redirect to '/' if not.
router.get('/home', verifyAuth, function(req, res, next) {

  // pull user record from db
  userService.getInfo(req.user.id, function(err, user) {

    // if error pulling user, return message
    if (err) res.status(501).json({
      message: "db error pulling user info"
    });

    // if user isn't found, return message
    else if (!user) res.status(400).json({
      message: "could not find user"
    });

    // render the homeview, and pass the user object
    else res.render('home', {
      user: user
    });

  });

});

// helper function used to verify authentication
function verifyAuth(req, res, next) {

  // if authenticated, execute the next function
  // otherwise reidrect to root (which will render index view).
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}


module.exports = router;
