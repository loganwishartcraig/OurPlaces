// routes used for user related services

// initial dependencies
var express = require('express');
var router = express.Router();
var userService = require('../services/userService');


// setCredentials route. Only organically redirected to if
// the user doesn't have a username (on first login).
// !-- NOTE: Not the greatest name. Also potentially should
// !-- prevent users from revisiting this page after they've set
// !-- their username. Due to the req.user object not having the 'username'
// !-- property, a db call would need to be made. Could maybe replace this
// !-- with an 'edit account details' view.
router.get('/setCredentials', verifyAuth, function(req, res) {

  // render 'setCredentials' view
  res.render('setCredentials');

});


// route posted to from the 'setCredentials' view.
// Used to set the username for a users profile.
// req.user.id is used for db lookup, 
// req.user.username is for setting username
router.post('/setCredentials', verifyAuth, function(req, res, next) {

  // reject empty username submissions 
  // otherwise, update user profile with username
  if (!req.body.username) {

    res.status(400).json({
      message: "Gotta put sumthin man"
    });

  } else {

    // on success of 'setUsername' send OK.
    // script on 'setCredentials' redirects user to '/home'
    // otherwise, forward error message.
    // !-- NOTE: What if client doesn't have JS enabled?
    // !-- The view contains an HTML form controlled by JS/
    // !-- Would res.status(200).redirect('/home') work?
    // !-- What else might?
    userService.setUsername(req.user.id, req.body.username).then(function(msg) {
      res.sendStatus(200);
    }, function(err) {
      res.status(500).json(err);
    });

  }

});


// logout route. Will log the user out and redirect home.
// uses passports 'logout' method
router.post('/logout', verifyAuth, function(req, res) {

  req.logout();
  res.redirect('/');

});


// getUser route, provides client access to the users db
// entry. Looks up user with req.user.id and returns a serialized
// object that containes user information.
router.get('/getUser', verifyAuth, function(req, res) {
  userService.getInfo(req.user.id, function(err, user) {
    if (err) res.status(501).json(err);
    if (user) res.json(user);
  });
});


// addRequest route, lets the user push a friend request
// to another user. Uses username to look up friend, and
// passports 'user' object to populate the friend request
// !-- NOTE: due to the user object being set by Googles OAuth
// !-- response, it doesn't have a normal db user records attributes.
// !-- Would like to have 'username'.
router.post('/addRequest', verifyAuth, function(req, res) {

  // console.log("\tADD REQUEST TO: \t\t", req.body.friendUsername);
  // console.log("\tFROM USER: \t\t", req.user.id);

  // send OK if save is successful,
  // otherwise send the error
  userService.addRequest(req.body.friendUsername, req.user).then(function(msg) {
    res.sendStatus(200);
  }, function(err) {
    res.status(501).json(err);
  });

});


// removeRequest route, lets the user remove a friend request.
// Uses the user Id to look up the account, and the friend Id to
// remove the request. 
// !-- NOTE: Seems to have loads of overlap with 'acceptRequest'?
router.post('/removeRequest', verifyAuth, function(req, res) {

  // console.log("\tTREMOVING REQUEST ON: \t\t", req.body.friendId);
  // console.log("\tFROM USER: \t\t", req.user.id);

  // send OK if save is successful,
  // otherwise send the error
  userService.removeRequest(req.body.friendId, req.user.id).then(function(msg) {
    res.sendStatus(200);
  }, function(err) {
    res.status(501).json(err);
  });

});


// acceptRequest route, lets the user accept a friend request.
// Uses the user Id to look up the account, and the friend Id to
// accept the request.
router.post('/acceptRequest', verifyAuth, function(req, res) {

  // console.log("\tACCEPT REQUEST FROM: \t\t", req.body.friendId);
  // console.log("\tAS USER: \t\t", req.user.id);

  // send friend object if save is successful,
  // otherwise send the error
  userService.addFriend(req.user.id, req.body.friendId).then(function(friend) {
    res.status(200).json(friend);
  }, function(err) {
    res.status(501).json(err);
  });

});



// removeFriend route, lets the user remove a friend.
// Uses the user Id to look up the account, and the friend Id to
// remove the friend.
// !-- NOTE: Similar to 'removeRequest'?
router.post('/removeFriend', verifyAuth, function(req, res) {

  // console.log("\tREMOVE FRIEND FROM: \t\t", req.user.id);
  // console.log("\tAS USER: \t\t", req.user.id);

  // send OK if save is successful,
  // otherwise send the error
  userService.removeFriend(req.user.id, req.body.friendId).then(function(msg) {
    res.sendStatus(200);
  }, function(err) {
    res.status(501).json(err);
  });

});


// addPlace route, lets the user save a place.
// Uses the user Id to look up a user and a modified Google Maps
// place object to save the place.
router.post('/addPlace', verifyAuth, function(req, res) {

  // console.log("\tADD PLACE: \t\t", req.body.place);
  // console.log("\tTO USER: \t\t", req.user.id);

  // send a new list of saved ('owned') places if OK,
  // otherwise send the error
  // !-- NOTE: should 'userService.addPlace' return the message/ownedPlaces object?
  userService.addPlace(req.user.id, JSON.parse(req.body.place)).then(function(newOwnedPlaces) {
    res.json({
      message: 'Savvveeed place.',
      ownedPlaces: newOwnedPlaces
    });
  }, function(err) {
    res.status(501).json(err);
  });
});


// removePlace route, lets the user remove a saved place.
// Uses the user Id to look up the user and Google Maps place
// object to match against the to remove
router.post('/removePlace', verifyAuth, function(req, res) {

  // console.log("\tREMOVE PLACE: \t\t", req.body.place);
  // console.log("\tFROM USER: \t\t", req.user.id);

  // send a new list of saved ('owned') places if OK,
  // otherwise send the error
  // !-- NOTE: should 'userService.removePlace' return the message/ownedPlaces object?
  userService.removePlace(req.user.id, JSON.parse(req.body.place)).then(function(newOwnedPlaces) {
    console.log('\tplace REMOVED!');
    res.json({
      message: 'removed place.',
      ownedPlaces: newOwnedPlaces
    });
  }, function(err) {
    console.log('\tplace FAILED!');
    res.status(501).json(err);
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
