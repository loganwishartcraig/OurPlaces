var express = require('express');
var router = express.Router();
var passport = require('passport');
var userService = require('../services/userService');

router.get('/google', passport.authenticate('google', {
  scope: 'https://www.googleapis.com/auth/plus.login'
}));

router.get('/google/cb',
  passport.authenticate('google', {
    failureRedirect: '/'
    // successRedirect: '/home'
  }),
  function(req, res) {

   // should replace the 'user' object in the 'req' propery w/ the user
   // returned from this function
  
    userService.findOrCreate(req.user, function(err, user) {
      if(err) res.redirect('/err');
      if (!user.username) {
        res.redirect('/user/setCredentials');
      } else {
        res.redirect('/');
      }
    });
  });

module.exports = router;
