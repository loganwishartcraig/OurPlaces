var express = require('express');
var router = express.Router();
var userService = require('../services/userService');

/* GET home page. */

router.get('/setCredentials', verifyAuth, function(req, res) {

  res.render('setCredentials');

});

router.post('/setCredentials', verifyAuth, function(req, res, next) {

  if (req.body.username === 'SEARCH_SVC') {
    res.status(400).json({message: "Ur trying to use a reserved username :s"});
    return next();
  }
  
  userService.setUsername(req.user.id, req.body.username).then(function(msg) {
    res.redirect('/home');
  }, function(err) {
    res.status(500).json(err);
  });

});

router.get('/getUser', verifyAuth, function(req, res) {
  userService.getInfo(req.user.id, function(err, user) {
    if (err) res.status(501).json(err);
    if (user) res.json(user);
  });
});

// I think u can use generators here

router.post('/addRequest', verifyAuth, function(req, res) {
  console.log("\tADD REQUEST TO: ", req.body.friendUsername);
  console.log("\tFROM USER: ", req.user.id);
  console.log("\t");

  userService.addRequest(req.body.friendUsername, req.user).then(function(msg) {
    res.sendStatus(200);
  }, function(err) {
    res.status(501).json(err);
  });

});

router.post('/removeRequest', verifyAuth, function(req, res) {

  userService.removeRequest(req.body.friendId, req.user.id).then(function(msg) {
    res.sendStatus(200);
  }, function(err) {
    res.status(501).json(err);
  });

});

router.post('/acceptRequest', verifyAuth, function(req, res) {

  console.log("\tAdding Friend...", req.body.friendId, ' to ', req.user.id);

  userService.addFriend(req.user.id, req.body.friendId).then(function(friend) {

    console.log("\tEverything OK");
    res.sendStatus(200);

  }, function(err) {

    console.error("\tERROR: Error adding friend 1 :/");

    res.status(501).json(err);
  });

  //   userService.addFriend(req.user.id, req.body.friendId, function(err) {
  //     if (err) res.status(501).json(err);
  //     else res.sendStatus(200);
  //   });
});

router.post('/removeFriend', verifyAuth, function(req, res) {

  //maybe promise this thing too?
  userService.removeFriend(req.user.id, req.body.friendId).then(function(msg) {
      res.sendStatus(200);
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


router.post('/addPlace', verifyAuth, function(req, res) {
  userService.addPlace(req.user.id, JSON.parse(req.body.place)).then(function(newOwnedPlaces) {
    console.log('\tplace SAVED!');
    res.json({message: 'Savvveeed place.', ownedPlaces: newOwnedPlaces});
  }, function(err) {
    console.log('\tplace FAILED!');
    res.status(501).json(err);
  });
});



router.post('/removePlace', verifyAuth, function(req, res) {
  userService.removePlace(req.user.id, JSON.parse(req.body.place)).then(function(newOwnedPlaces) {
    console.log('\tplace REMOVED!');
    res.json({message: 'removed place.', ownedPlaces: newOwnedPlaces});
  }, function(err) {
    console.log('\tplace FAILED!');
    res.status(501).json(err);
  });
});


module.exports = router;
