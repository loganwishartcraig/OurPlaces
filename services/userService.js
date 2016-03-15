var mongoose = require('mongoose');
var User = require('../models/userModel');


function serealizeUserResult(userRecord) {

  var toReturn = {};
  toReturn.id = userRecord.userId;
  toReturn.firstName = userRecord.firstName;
  toReturn.username = userRecord.username;
  toReturn.lastName = userRecord.lastName;
  toReturn.friends = userRecord.friends;
  toReturn.ownedPlaces = userRecord.ownedPlaces;
  toReturn.friendsPlaces = userRecord.friendsPlaces;
  toReturn.friendRequests = userRecord.friendRequests;
  toReturn.requestCount = userRecord.requestCount;
  return toReturn;

}

//REFACTOR W/ GETUSER
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

  //REFACTOR W/ GETUSER
  exports.getInfo = function(userId, next) {

    User.findOne({
      userId: userId
    }).populate('friends', 'firstName lastName userId ownedPlaces').exec(function(err, user) {
      if (err) return next({
        message: "Error looking up user"
      });
      if (!user) return next({
        message: "User not found"
      });
      return next(null, serealizeUserResult(user));
    });


  };

  exports.setUsername = function(userId, username) {

    return (new Promise(function(res, rej) {

      User.findOne({
        username: username
      }).exec(function(err, user) {
        if (err) return rej({message: "Error finding user"});
        if (user) return rej({message: "Username already exists :x"});

        lookupUser(userId).then(function(user) {

          user.username = username;
          user.save(function(err) {
            if (err) return rej({message: "Error setting "});
            return res();
          });

        }, function(err) {
          if (err) return rej(err);
        });
      });

    }));


  };


  // expects google 'user' object layout for 'userAdding'

  // change {userId: userId} => 'query' object & update accordingly
  function lookupUser(userId) {

    return (new Promise(function(res, rej) {

      User.findOne({
          userId: userId
        })
        .populate('friends')
        .exec(function(err, user) {
          if (err) return rej({
            message: "DB error looking up user"
          });
          if (!user) return rej({
            message: "User not found"
          });
          console.log("Found User");
          return res(user);
        });

    }));

  }



  // can be greatly improved through generators + storing the data differently
  // ordered lists would allow for binary search.
  function findFriendIndex(friendList, friendId) {

    for (var i = 0; i < friendList.length; i++)
      if (friendList[i].userId === friendId) return i;
    return -1;

  }

  // function findPlaceIndex(placeList, placeId) {
  //   for (var i = 0; i < placeList.length; i++)
  //     if (placeList[i].id === placeId) return i;
  //   return -1;
  // }


  exports.addRequest = function(friendId, userAdding) {

    return (
      new Promise(function(res, rej) {

        console.log('looking up ', friendId);

        var userAddingId = userAdding.id;

        lookupUser(friendId).then(function(user) {
          console.log("\t\tChecking existing requests/firends");
          if (user.friendRequests.hasOwnProperty(userAddingId)) return rej({
            message: "Request already pending :o"
          });
          if (findFriendIndex(user.friends, userAddingId) !== -1) return rej({
            message: "User is already ur friend ;)"
          });
          console.log("\t\tPushing request");
          user.friendRequests[userAddingId] = {
            id: userAddingId,
            firstName: userAdding.name.givenName,
            lastName: userAdding.name.familyName
          };
          user.markModified('friendRequests');
          user.requestCount++;
          console.log("\t\tSaving user ", user);
          user.save(function(err) {
            console.log("\t\tSAVED");
            if (err) return rej({
              message: "Error saving user"
            });
            else return res();
          });

        }, function(err) {
          return rej(err);
        });

      })
    );

  };

  exports.removeRequest = function(userToRemove, userId) {

    return (
      new Promise(function(res, rej) {

        lookupUser(userId).then(function(user) {

          if (!user.friendRequests.hasOwnProperty(userToRemove)) return rej({
            message: "No request from the user :/"
          });

          delete user.friendRequests[userToRemove];
          user.markModified('friendRequests');

          user.requestCount--;

          user.save(function(err) {
            if (err) return rej({
              message: "Error saving user"
            });
            return res();
          });

        }, function(err) {
          return rej(err);
        });

      })
    );

  };



  exports.addFriend = function(userId, friendId) {

    return (
      new Promise(function(res, rej) {

        lookupUser(userId).then(function(user) {

          if (findFriendIndex(user.friends, friendId) !== -1) return rej({
            message: "User is alraedy ur friend ;)"
          });

          if (!user.friendRequests.hasOwnProperty(friendId)) return rej({
            message: "User hasn't requested ur friendship :o"
          });

          lookupUser(friendId).then(function(friend) {

            if (findFriendIndex(friend.friends, userId) !== -1) return rej({
              message: "Friend alraedy has u as a friend? :s"
            });

            delete user.friendRequests[friendId];
            user.markModified('friendRequests');
            user.requestCount--;
            user.friendCount++;

            user.friends.push(friend);
            user.markModified('friends');

            friend.friends.push(user);
            friend.markModified('friends');
            friend.friendCount++;

            friend.save(function(err) {
              if (err) return rej({
                message: "error saving friend's profile..."
              });
              user.save(function(err) {
                if (err) return rej({
                  message: "error saving user's profile..."
                });
                return res();
              });
            });

          }, function(err) {
            rej(err);
          });

        }, function(err) {
          rej(err);
        });

      })
    );
  };

  exports.removeFriend = function(userId, friendId) {


    return (new Promise(function(res, rej) {
      lookupUser(userId).then(function(user) {

        var userFriendIndex = findFriendIndex(user.friends, friendId);

        if (userFriendIndex === -1) return rej({
          message: "But, u aren't friends with them :/"
        });


        lookupUser(friendId).then(function(friend) {

          var friendFriendIndex = findFriendIndex(friend.friends, userId);

          if (friendFriendIndex === -1) return rej({
            message: "Friend doesn't have u added? :x"
          });

            user.friends.splice(userFriendIndex, 1);
            user.markModified('friends');
            user.friendCount--;

            friend.friends.splice(friendFriendIndex, 1);
            friend.markModified('friends');
            friend.friendCount--;

            friend.save(function(err) {
              if (err) return rej({
                message: "error saving friend's profile..."
              });
              user.save(function(err) {
                if (err) return rej({
                  message: "error saving user's profile..."
                });
                return res();
              });
            });          

        }, function(err) {
          rej(err);
        });
      }, function(err) {
        rej(err);
      });
    }));

  };

  exports.addPlace = function(userId, place) {

    return (
      new Promise(function(res, rej) {

        lookupUser(userId).then(function(user) {

          console.log("\tsaving ", user.ownedPlaces);
          // if (findPlaceIndex(user.ownedPlaces, placeId) !== -1) return rej({
          //   message: "Place is already saved :o"
          // });
          if (user.ownedPlaces.hasOwnProperty(place.place_id)) return rej({
            message: "Place is already saved :o"
          });
          console.log('\tplace not already there');

          user.ownedPlaces[place.place_id] = place;
          user.markModified('ownedPlaces');

          console.log('\ttrying to save');
          // A named function should replace the user.save callback
          user.save(function(err) {
            if (err) return rej({
              message: "Error saving user"
            });
            else return res();
          });

        }, function(err) {
          return rej(err);
        });

      })
    );

  };

  exports.removePlace = function(userId, place) {

    return (
      new Promise(function(res, rej) {

        lookupUser(userId).then(function(user) {

          console.log("\tremoving ", user.ownedPlaces);
          // if (findPlaceIndex(user.ownedPlaces, placeId) !== -1) return rej({
          //   message: "Place is already saved :o"
          // });
          if (!user.ownedPlaces.hasOwnProperty(place.place_id)) return rej({
            message: "Place was not already saved :o"
          });
          console.log('\tplace is there');

          delete user.ownedPlaces[place.place_id];
          user.markModified('ownedPlaces');

          console.log('\ttrying to save');
          // A named function should replace the user.save callback
          user.save(function(err) {
            if (err) return rej({
              message: "Error saving user"
            });
            else return res();
          });

        }, function(err) {
          return rej(err);
        });

      })
    );

  };

};
