//routes used for authentication purposes

// initial dependencies
var express = require('express');
var router = express.Router();
var passport = require('passport');
var userService = require('../services/userService');


// authentication with Google.
// Currently the only way to log in
router.get('/google', passport.authenticate('google', {
  scope: 'https://www.googleapis.com/auth/plus.login'
}));

// callback route for google OAuth
router.get('/google/cb',
  passport.authenticate('google', {

    // redirect home if login fails
    failureRedirect: '/'
  }),

  // if login succeeds
  function(req, res) {

    // execute 'findOrCreate', which will either pull the
    // users record, or create a db entry for them.
    // !--- NOTE: Would like to replace the 'user' object in the 'req' 
    // !--- propery w/ the user returned from this function
    userService.findOrCreate(req.user, function(err, user) {

      // on error, send to client
      if(err) res.status(500).json(err);

      // redirect to 'setCredentials' if no username is associated,
      // otherwise redirect to homepage.
      if (!user.username) {

        // !--- NOTE: not the greatest name for this route.
        res.redirect('/user/setCredentials');
      } else {
        res.redirect('/');
      }

    });

  });

module.exports = router;
