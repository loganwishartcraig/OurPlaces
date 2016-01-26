var mongoose = require('mongoose');
var User = require('../models/userModel');


function serealizeUserResult(userRecord) {

  var toReturn = {};
  toReturn.id = userRecord.id;
  toReturn.firstName = userRecord.firstName;
  toReturn.lastName = userRecord.lastName;
  toReturn.friends = userRecord.friends;
  toReturn.ownedPlaces = userRecord.ownedPlaces;
  toReturn.friendsPlaces = userRecord.friendsPlaces;
  toReturn.friendRequests = userRecord.friendRequests;
  return toReturn;

}


exports.findOrCreate = function(userToAdd, next) {

  console.log("finding user");

  User.findOne({
    userId: userToAdd.id
  }, function(err, user) {
    console.log(user, userToAdd.id);
    if (err) return next({
      message: "Error looking up user"
    });
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
      if (err) return next({
        message: "Error saving user"
      });
      console.log("no error saving", user.id);
      if (user) return next(false, user.userId);
    });

  });

  exports.getInfo = function(userId, next) {

    User.findOne({
      userId: userId
    }).populate('friends', 'firstName lastName userId').exec(function(err, user) {
      if (err) return next({
        message: "Error looking up user"
      });
      if (!user) return next({
        message: "User not found"
      });
      return next(null, serealizeUserResult(user));
    });


  };

  exports.addRequest = function(userToAdd, userAdding, next) {


    User.findOne({firstName: userToAdd})
        .populate('friends', 'userId')
        .exec(function(err, user) {
          if (err) return next({
            message: "Error looking up user"
          });
          if (!user) return next({
            message: "User not found"
          });
          if (user.friendRequests.hasOwnProperty(userAdding.id)) return next({
            message: "Freind request already pending :/"
          });

          for (var i = 0; i < user.friends.length; i++)
            if (user.friends[i].userId === userAdding.id) return next({message: "User is already ur friend :)"});

          user.friendRequests[userAdding.id] = {
            id: userAdding.id,
            firstName: userAdding.name.givenName,
            lastName: userAdding.name.familyName
          };

          user.markModified('friendRequests');
          console.log('saving request');

          user.save(function(err, record) {
            if (err) return next({
              message: "Error saving user"
            });
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
      if (err) return next({
        message: "Error looking up user"
      });
      if (!user) return next({
        message: "User not found"
      });
      if (!user.friendRequests.hasOwnProperty(userToRemove)) return next({
        message: "Friend request not found"
      });

      delete user.friendRequests[userToRemove];
      user.markModified('friendRequests');

      console.log('saving user', user);
      user.save(function(err) {
        User.findOne(user, function(err, person) {
          console.log(err, person);
        });
        if (err) return next({
          message: "Error saving user"
        });
        console.log('user saved');
        return next(null);
      });

    });




  };

  exports.addFriend = function(userId, friendId, next) {

    User.findOne({userId: userId})
        .populate('friends')
        .exec(function(err, user) {
          if (err) return next({message: err});
          if (!user) return next({message: "User not found"});
          if (!user.friendRequests.hasOwnProperty(friendId)) 
            return next({message: "User hasn't requested"});

          for (var i = 0; i < user.friends.length; i++)
            if (user.friends[i].userId === friendId) return next({message: "User is already ur friend :)"});

          User.findOne({userId: friendId})
              .populate('friends')
              .exec(function(err, friend) {
                if (err) return next({message: err});
                if (!friend) return next({message: "Friend not found"});

                for (var i = 0; i < friend.friends.length; i++)
                  if (friend.friends[i].userId === userId) return next({message: "Friend already has u added?"});

                delete user.friendRequests[friendId];
                user.markModified('friendRequests');

                user.friends.push(friend);
                user.markModified('friends');

                friend.friends.push(user);
                friend.markModified('friends');

                friend.save(function(err) {
                  if (err) return next({message: "error saving friend"});
                  user.save(function(err) {
                    if (err) return next({message: "error saving user"});
                    return next(null);
                  });
                });

              });

        });

    };



    function lookupUser(userId) {

      return (new Promise(function(res, rej) {

        User.findOne({userId: userId})
            .populate('friends', 'userId firstName lastName')
            .exec(function(err, user) {
              if (err) return rej({message: "DB error looking up user"});
              if (!user) return rej({message: "User not found"});
              return res(user);
            });

      }));

    }

    function findFriendIndex(friendList, friendId) {

      for (var i = 0; i < friendList.length; i++)
        if (friendList[i].userId === friendId) return i;
      return -1;

    }

    exports.removeFriend = function(userId, friendId) {
      return (
        new Promise(function(res, rej) {

          lookupUser(userId).then(function(user) {

            var toRemove = findFriendIndex(user.friends, friendId);
    
            if (toRemove === -1) return rej({message: "User isn't a friend"});

            user.friends.splice(toRemove, 1);
            user.markModified('friends');

            user.save(function(err) {
              if (err) return rej({message: "Error saving user"});
              else return res();
            });

          }, function(err) {
            return rej(err);
          });

        })
      );
    };


};
