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

  
  // expects google 'user' object layout for 'userAdding'
 

    function lookupUser(userId) {

      return (new Promise(function(res, rej) {

        User.findOne({userId: userId})
            .populate('friends')
            .exec(function(err, user) {
              if (err) return rej({message: "DB error looking up user"});
              if (!user) return rej({message: "User not found"});
              console.log("Found User")
              return res(user);
            });

      }));

    }
  
//   function lookupTwo(firstUserId, secondUserId) {
    
//     return (new Promise(function(res, rej) {
//                 console.log("\tretrieving users...", firstUserId, secondUserId);

//         lookupUser(firstUserId).then(function(userOne) {
//           console.log("\tlooking up first user")
//           lookupUser(secondUserId).then(function(userTwo) {
//             console.log("\tlooking up second user")
//             return res([userOne, userTwo]);
            
//           }, function(err) {
//             return rej(err);
//           });
//         }, function(err) {
//           return rej(err);
//         })
//       })
//     )
//   }

    function findFriendIndex(friendList, friendId) {

      for (var i = 0; i < friendList.length; i++)
        if (friendList[i].userId === friendId) return i;
      return -1;

    }

  
   exports.addRequest = function(friendId, userAdding) {

    return (
        new Promise(function(res, rej) {
          
          var userAddingId = userAdding.id;
          
          lookupUser(friendId).then(function(user) {
            console.log("\t\tChecking existing requests/firends");  
            if (user.friendRequests.hasOwnProperty(userAddingId)) return rej({message: "Request already pennnding :o"});
            if (findFriendIndex(user.friends, userAddingId) !== -1) return rej({message: "User is already ur friend ;)"});
            console.log("\t\tPushing request");
            user.friendRequests[userAddingId] = {
              id: userAddingId,
              firstName: userAdding.name.givenName,
              lastName: userAdding.name.familyName
            };
            user.markModified('friendRequests');
            console.log("\t\tSaving user ", user);
            user.save(function(err) {
              console.log("\t\tSAVED");
              if (err) return rej({message: "Error saving user"});
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
            
            if (!user.friendRequests.hasOwnProperty(userToRemove)) return rej({message: "No request from the user :/"});

            delete user.friendRequests[userToRemove];
            user.markModified('friendRequests');

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

  
  
    exports.addFriend = function(userId, friendId) {

      // pretty unhappy with this function. Tons of duplicated code.
      return (
        new Promise(function(res, rej) {
              
          lookupTwo(userId, friendId).then(function(userList) {
            
          var user = userList[0],
              friend = userList[1];
                   
          if (findFriendIndex(user.friends, friendId) !== -1) return rej({message: "User is already ur friend ;)"});
          if (findFriendIndex(friend.friends, userId) !== -1) return rej({message: "Friend already has u as a friend?"});
            
          if (user.friendRequests[friendId]) {
            delete user.friendRequests[friendId];
            user.markModified('friendRequests');
          }
            
          if (friend.friendRequests[userId]) {
            delete friend.friendRequests[userId];
            friend.markModified('friendRequests');
          }
                        
          user.friends.push(friend);
          user.markModified('friends');
            
          friend.friends.push(user);
          friend.markModified('friends');
                        
          user.save(function(err) {
            if (err) return rej({message: "Error saving user..."});
            friend.save(function(err) {
              if (err) return rej({message: "Error saving friend..."});
              return res();  
            })
          })
          }, function(err) {
            return rej(err)
          })
        })
      );

    };

  
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
