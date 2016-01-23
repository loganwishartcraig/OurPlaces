var mongoose = require('mongoose');
var User = require('../models/userModel');


function serealizeUserResult(userRecord) {

  var toReturn = {};
  toReturn.id = userRecord.id;
  toReturn.firstName = userRecord.firstName;
  toReturn.lastName = userRecord.lastName;
  toReturn.friends = userRecord.friends;
  toReturn.ownedPlaced = userRecord.ownedPlaced;
  toReturn.friendsPlaces = userRecord.friendsPlaces;
  return toReturn;

}


exports.findOrCreate = function(userToAdd, next) {

  console.log("finding user");

  User.findOne({
    userId: userToAdd.id
  }, function(err, user) {
    console.log(user, userToAdd.id);
    if (err) return next({message: "Error looking up user"});
    if (user) return next(null, user);

    console.log("making user");

    // relies on the layout of the google oAuth syntax
    // should abstract out
    var newUser = new User({
      userId: userToAdd.id,
      firstName: userToAdd.name.givenName,
      lastName: userToAdd.name.familyName
    });

    console.log("saving user", newUser);

    newUser.save(function(err, user) {
      if (err) return next({message: "Error saving user"});
      console.log("no error saving", user.id);
      if (user) return next(false, user.userId);
    });

  });

  exports.getInfo = function(userId, next) {

    User.findOne({
      userId: userId
    }, function(err, user) {
      if (err) return next({message: "Error looking up user"});
      if (!user) return next({
        message: "User not found"
      });
      return next(null, serealizeUserResult(user));
    });


  };

  exports.addRequest = function(userToAdd, userAdding, next) {

    console.log('adding friend request');
    User.findOne({
      firstName: userToAdd
    }, function(err, user) {
      if (err) return next({
        message: "Error looking up user"
      });
      if (!user) return next({
        message: "User not found"
      });
      if (user.friendRequests.hasOwnProperty(userAdding.id)) return next({
        message: "Freind request already pending :/"
      });

      user.friendRequests[userAdding.id] = {
        firstName: userAdding.name.givenName,
        lastName: userAdding.name.familyName
      };

      user.markModified('friendRequests');
      console.log('saving request');

      user.save(function(err, record) {
        if (err) return next({message: "Error saving user"});
        console.log("user saved", record);
        return next(null);
      });

    });

  };

  exports.removeRequest = function(userToRemove, userId, next) {

    console.log('finding user');
    User.findOne({
      userId: userId
    }, function(err, user) {
      console.log('user lookup complete');
      if (err) return next({message: "Error looking up user"});
      if (!user) return next({message: "User not found"});
      if (!user.friendRequests.hasOwnProperty(userToRemove)) return next({message: 
        "Friend request not found"});

      delete user.friendRequests[userToRemove];
      user.markModified('friendRequests');
      
      console.log('saving user', user);
      user.save(function(err) {
        User.findOne(user, function(err, person) {
          console.log(err, person);
        });
        if (err) return next({message: "Error saving user"});
        console.log('user saved');
        return next(null);
      });

    });




  };


  exports.getFriendRequests = function(userId, next) {


    console.log('getting requests');
    User.findOne({
      userId: userId
    }, function(err, user) {
      if (err) return next({
        message: err
      });
      if (!user) return next({
        message: "User not found"
      });
      console.log('found user');
      return next(null, user.friendRequests);
    });

  };

};
