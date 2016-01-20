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

  User.findOne({userId: userToAdd.id}, function(err, user) {  
    console.log(user, userToAdd.id);
    if (err) return next({message: err});
    if (user) return next(null, user);
   
    console.log("making user");
    
    // relies on the layout of the google oAuth syntax
    // should abstract out
    var newUser = new User({
        userId: userToAdd.id,
        firstName: userToAdd.name.givenName,
        lastName: userToAdd.name.familyName
      });
    
    console.log("saving user");
    
    newUser.save(function(err, user) {
        if (err) return next({
          message: err.message
        });
        console.log("no error saving", user.id);
        if (user) return next(false, user.userId);
      });

  });

exports.getInfo = function(userId, next) {

  User.findOne({userId: userId}, function(err, user) {
    if (user === undefined) return next({message: "User not found"});
    return next(null, serealizeUserResult(user));
  });

  
};


};