var express = require('express');
var router = express.Router();
var passport = require('passport');
var userService = require('../services/userService');

/* GET home page. */
// router.post('/login', function(req, res) {
//   res.redirect('/auth/google');
// });

router.get('/google', passport.authenticate('google', {
  scope: 'https://www.googleapis.com/auth/plus.login'
}));

router.get('/google/cb',
  passport.authenticate('google', {
    failureRedirect: '/'
    // successRedirect: '/home'
  }),
  function(req, res) {
    userService.findOrCreate(req.user, function(err, user) {

      console.log(err, user);

      // if (err) res.send(err);
      // if (user) res.send(user);

      // res.sendStatus(200);
      res.redirect('/home');
    });
    // res.sendStatus('200');
  });

module.exports = router;
