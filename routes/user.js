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

// I think u can use generators here

router.post('/addRequest', verifyAuth, function(req, res) {
  if (req.body.friendId === req.user.name.givenName) {
    res.status(400).json({message: "U can't add urself :o"});
  } else {
    userService.addRequest(req.body.friendId, req.user, function(err) {
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

  // userService.addFriend(req.user.id, req.body.friendId).then(function(msg){ 
  //   console.log("removing")
  //   userService.addFriend(req.body.friendId, req.user.id).then(function(msg) {
  //     res.sendStatus(200);
  //   }, function(err) {
  //     res.status(501).json(err);
  //   });
  // }, function(err) {
  //     res.status(501).json(err);
  // });

  userService.addFriend(req.user.id, req.body.friendId, function(err) {
    if (err) res.status(501).json(err);
    else res.sendStatus(200);
  });
});

router.post('/removeFriend', verifyAuth, function(req, res) {

//maybe promise this thing too?
  userService.removeFriend(req.user.id, req.body.friendId).then(function(msg){ 
    userService.removeFriend(req.body.friendId, req.user.id).then(function(msg) {
      res.sendStatus(200);
    }, function(err) {
      res.status(501).json(err);
    });
  }, function(err) {
      res.status(501).json(err);
  });

});

function verifyAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}





module.exports = router;
