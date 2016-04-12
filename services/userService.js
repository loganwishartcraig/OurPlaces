
var mongoose = require('mongoose');
var User = require('../models/userModel');

var binaryOps = require('../util/binaryOperations.js');
var binary = new binaryOps();


/* SHOULD BE IN ITS OWN FILE */
/* NEEDS ATTENTION */

function requestCompare(data, term) {
  var id = parseInt(data.id, 10);
  term = parseInt(term.id, 10);
  if (id === term) return 0;
  else if (id > term) return 1;
  else return -1;
}

function userIdCompare(data, term) {
  var id = parseInt(data.userId, 10);
  term = parseInt(term.userId, 10);
  if (id === term) return 0;
  else if (id > term) return 1;
  else return -1;
}

function placeCompare(data, term) {
  var id = data.place_id;
  term = term.place_id;
  if (id === term) return 0;
  else if (id > term) return 1;
  else return -1;
}

/*******/



// returns user if user found so can't use lookupuser
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
    // should abstract out?
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

};



exports.getInfo = function(userId, next) {

  // custom friend field population so can't use 'lookupUser'  
  // could still use promises though
  User.findOne({
    userId: userId
  }).populate('friends', 'firstName lastName userId ownedPlaces username placeCount').exec(function(err, user) {
    if (err) return next({
      message: "Error looking up user"
    });
    if (!user) return next({
      message: "User not found"
    });

    var friendPlaceList = buildFriendPlaceList(user.friends);
    console.log(friendPlaceList);
    user.friendsPlaces = friendPlaceList;
    
    return next(null, serealizeUserResult(user));
  });


};

exports.setUsername = function(userId, username) {

  return (new Promise(function(res, rej) {

    User.findOne({
      username: username
    }).exec(function(err, user) {
      if (err) return rej({ message: "Error finding user" });
      if (user) return rej({ message: "Username already exists :x" });

      lookupUser({ userId: userId }).then(function(user) {

        user.username = username;
        user.save(function(err) {
          if (err) return rej({ message: "Error setting " });
          return res();
        });

      }, function(err) {
        if (err) return rej(err);
      });
    });

  }));


};



function lookupUser(query) {

  return (new Promise(function(res, rej) {

    User.findOne(query)
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




exports.addRequest = function(friendUsername, userAdding) {

  return (
    new Promise(function(res, rej) {
            
      console.log('looking up ', friendUsername);

      var userAddingId = userAdding.id;

      lookupUser({ username: friendUsername }).then(function(user) {

        // need to ensure you can't add a request to someone whom you have an active request from.
        
        console.log("\t\tChecking existing requests/firends");
        if (user.userId === userAddingId) return rej({ message: "u can't add urself :/" });
        if (binary.exists(user.friendRequests, {userId: userAddingId}, userIdCompare)) return rej({
          message: "Request already pending :o"
        });
        if (binary.exists(user.friends, {userId: userAddingId}, userIdCompare)) return rej({
          message: "User is already ur friend ;)"
        });
        console.log("\t\tPushing request");
        
        var request = {
          userId: userAddingId,
          firstName: userAdding.name.givenName,
          lastName: userAdding.name.familyName,
          username: userAdding.username,
          dateRequested: Date.now()
        };

        user.friendRequests = binary.insert(user.friendRequests, request, userIdCompare);
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

      lookupUser({ userId: userId }).then(function(user) {
        console.log(userToRemove);

        var friendRequestIndex = binary.indexOf(user.friendRequests, {userId: userToRemove}, userIdCompare);
        
        if (friendRequestIndex === undefined) return rej({
          message: "No request from the user :/"
        });


        user.friendRequests.splice(friendRequestIndex, 1);
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

      lookupUser({ userId: userId }).then(function(user) {

        var userReqIndex = binary.indexOf(user.friendRequests, {userId: friendId}, userIdCompare);

        if (userReqIndex === undefined) return rej({
          message: "User hasn't requested ur friendship :o"
        });

        if (binary.exists(user.friends, {userId: friendId}, userIdCompare)) return rej({
          message: "User is alraedy ur friend ;)"
        });

        lookupUser({ userId: friendId }).then(function(friend) {

          if (binary.exists(friend.friends, {userId: userId}, userIdCompare)) return rej({
            message: "Friend alraedy has u as a friend? :s"
          });

          user.friendRequests.splice(userReqIndex, 1);
          user.markModified('friendRequests');
          user.requestCount--;

          user.friends = binary.insert(user.friends, friend, userIdCompare);
          user.markModified('friends');
          user.friendCount++;


          friend.friends = binary.insert(friend.friends, user, userIdCompare);
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
              return res({
                          userId: friend.userId,
                          firstName: friend.firstName,
                          lastName: friend.lastName,
                          savedPlaces: friend.savedPlaces,
                          username: friend.username,
                          placeCount: friend.placeCount
                        });
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
    lookupUser({ userId: userId }).then(function(user) {
      console.log(friendId);

      var userFriendIndex = binary.indexOf(user.friends, {userId: friendId}, userIdCompare);

      console.log('userFriendIndex: ' + userFriendIndex);

      if (userFriendIndex === undefined) return rej({
        message: "But, u aren't friends with them :/"
      });


      lookupUser({ userId: friendId }).then(function(friend) {

        var friendFriendIndex = binary.indexOf(friend.friends, {userId: userId}, userIdCompare);

        if (friendFriendIndex === undefined) return rej({
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

      lookupUser({ userId: userId }).then(function(user) {

        console.log("\tsaving ", user.ownedPlaces);

        if (binary.exists(user.ownedPlaces, {place_id: place.place_id}, placeCompare)) return rej({
          message: "Place is already saved :o"
        });

        console.log('\tplace not already there');

        user.ownedPlaces = binary.insert(user.ownedPlaces, place, placeCompare);
        // user.ownedPlaces[place.place_id] = place;
        user.markModified('ownedPlaces');

        user.placeCount++;

        console.log('\ttrying to save');
        // A named function should replace the user.save callback
        user.save(function(err, user) {
          if (err) return rej({
            message: "Error saving user"
          });
          else return res(user.ownedPlaces);
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

      lookupUser({ userId: userId }).then(function(user) {

        console.log("\tremoving ", user.ownedPlaces);

        var placeIndex = binary.indexOf(user.ownedPlaces, {place_id: place.place_id}, placeCompare);

        if (placeIndex < 0) return rej({
          message: "Place was not already saved :o"
        });
        console.log('\tplace is there');

        user.ownedPlaces.splice(placeIndex, 1);
        user.markModified('ownedPlaces');

        user.placeCount--;

        console.log('\ttrying to save');
        // A named function should replace the user.save callback
        user.save(function(err, user) {
          if (err) return rej({
            message: "Error saving user"
          });
          else return res(user.ownedPlaces);
        });

      }, function(err) {
        return rej(err);
      });

    })
  );

};



function serealizeUserResult(userRecord) {

  return ({
    id: userRecord.userId,
    firstName: userRecord.firstName,
    username: userRecord.username,
    lastName: userRecord.lastName,
    friends: userRecord.friends,
    ownedPlaces: userRecord.ownedPlaces,
    friendsPlaces: userRecord.friendsPlaces,
    placeCount: userRecord.placeCount,
    friendCount: userRecord.friendCount,
    friendRequests: userRecord.friendRequests,
    requestCount: userRecord.requestCount
  });

}


// Makes me really sad. Takes quadratic time to pull the list
// every time a page is refreshed.
// I'm really unsure how to improve this.
function buildFriendPlaceList(friendList) {
  
  console.log('buidling friend place list');
  var placeList = [];
  friendList.forEach(function(friend) {
    
    console.log('going through ', friend.username, ' places');
    
    friend.ownedPlaces.forEach(function(place) {

      var placeIndex = binary.indexOf(placeList, {place_id: place.place_id}, placeCompare);
     
      console.log('place ', place.place_id, ' has index ', placeIndex, 'in placeList ', placeList);

      
      if (placeIndex >= 0) {
        
        placeList[placeIndex].savedBy.push(friend.username);
        console.log(placeList);
        
      } else {
        
        place.savedBy = [friend.username];
        placeList = binary.insert(placeList, place, placeCompare);
        console.log(placeList);
      }
      
    });
  
  });
    return placeList;

}