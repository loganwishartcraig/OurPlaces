var express = require('express');
var router = express.Router();
var userService = require('../services/userService');

/* GET home page. */

router.get('/getUser', verifyAuth, function(req, res) {
  userService.getInfo(req.user.id, function(err, user) {
    if (err) res.status(501).json(err);
    if (user) res.json(user);
  });
});

// router.get('/getFriendRequests', verifyAuth, function(req, res) {

//   userService.getFriendRequests(req.user.id, function(err, data) {
//     if (err) res.status(501).json(err);
//     else res.json(data);
//   });

// });

router.post('/addRequest', verifyAuth, function(req, res) {
  if (req.body.userToAdd === req.user.name.givenName) {
    res.sendStatus(400);
  } else {
    userService.addRequest(req.body.userToAdd, req.user, function(err) {
      if (err) res.status(501).json(err);
      else res.sendStatus(200);
    });
  }
});

router.post('/removeRequest', verifyAuth, function(req, res) {

  userService.removeRequest(req.body.friendId, req.user.id, function(err) {
    if (err) res.status(501).json(err);
    else res.sendStatus(200);
  });

});

router.post('/acceptRequest', verifyAuth, function(req, res) {
  console.log('adding friend', req.body);
  userService.addFriend(req.user.id, req.body.friendId, function(err) {
    if (err) res.status(501).json(err);
    else res.sendStatus(200);
  });
});

router.post('/removeFriend', verifyAuth, function(req, res) {

  userService.removeFriend(req.user.id, req.body.friendId, function(err) {
    if (err) res.status(501).json(err);
    else res.sendStatus(200);
  });

});

function verifyAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}





module.exports = router;
