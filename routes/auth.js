var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
// router.post('/login', function(req, res) {
//   res.redirect('/auth/google');
// });

router.get('/google', passport.authenticate('google', {
  scope: 'https://www.googleapis.com/auth/plus.login'
}));

router.get('/google/cb',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: '/home'
  }),
  function(req, res) {
    // console.log(req.isAuthenticated())
    // console.log(req.user.gender);
    // res.redirect('/home');
    res.sendStatus('200');
  });

module.exports = router;
