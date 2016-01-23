var express = require('express');
var router = express.Router();
var userService = require('../services/userService');

/* GET home page. */

router.get('/getUser', verifyAuth, function(req, res) {
  userService.getInfo(req.user.id, function(err, user) {
    if (err) res.json(err);
    if (user) res.json(user);
  });
});

router.get('/userByName', verifyAuth, function(req, res) {

  // userService.findUserByName(req.body.userToFind, function(err, user) {

  // });

  res.sendStatus(200);
});

router.get('/getFriendRequests', verifyAuth, function(req, res) {

  userService.getFriendRequests(req.user.id, function(err, data) {

    console.log('sending ', data);
    if (err) res.json(err);
    else res.json(data);

  });

});

router.post('/addRequest', verifyAuth, function(req, res) {
  userService.addRequest(req.body.userToAdd, req.user, function(err) {

    if (err) res.json(err);
    else res.sendStatus(200);

  });
});

router.post('/removeRequest', verifyAuth, function(req, res) {

  userService.removeRequest(req.body.friendId, req.user.id, function(err) {
    if (err) res.json(err);
    else res.sendStatus(200);
  });
  
});

router.post('/addFriend', verifyAuth, function(req, res) {
  console.log('adding friend', req.body);
  res.sendStatus(200);  
});

function verifyAuth(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/');
}

module.exports = router;
