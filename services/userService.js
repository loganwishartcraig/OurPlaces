// provides an interface to the user database

// initial dependencies
var mongoose = require('mongoose');
var User = require('../models/userModel');

var binaryOps = require('../util/binaryOperations.js');
var binary = new binaryOps();



/***************************************************************/
/* NEEDS ATTENTION */
/* SHOULD BE IN ITS OWN FILE */
// !-- NOTE: Could have consolidated request/userId

// helper function used to compare friend requests
// to determine/enforce order. Expects two objects that have
// numerical 'id' properties
function requestCompare(data, term) {
  var id = parseInt(data.id, 10);
  term = parseInt(term.id, 10);
  if (id === term) return 0;
  else if (id > term) return 1;
  else return -1;
}

// helper function used to compare users
// to determine/enforce order. Expects two objects that have
// numerical 'userId' properties
function userIdCompare(data, term) {
  var id = parseInt(data.userId, 10);
  term = parseInt(term.userId, 10);
  if (id === term) return 0;
  else if (id > term) return 1;
  else return -1;
}

// helper function used to compare GM place objects
// to determine/enforce order. Expects two objects that have
// 'place_id' properties
function placeCompare(data, term) {
  var id = data.place_id;
  term = term.place_id;
  if (id === term) return 0;
  else if (id > term) return 1;
  else return -1;
}
/***************************************************************/


// helper function that looks up a user using
// a 'query' object. Will return a promise
// that will resolve with the user.
function lookupUser(query) {

  return (new Promise(function(res, rej) {

    User.findOne(query)
    
      // !-- NOTE: returns full friend db entry, could include
      // !-- some option to limit this
      .populate('friends')
      .exec(function(err, user) {
        if (err) return rej({
          message: "DB error looking up user"
        });
      
        // if user not found, reject.
        // !-- NOTE: Should this maybe be optional?
        // !-- Could add a parameter to skip this check?
        if (!user) return rej({
          message: "User not found"
        });
      
        console.log("Found User");
        return res(user);
      });

  }));

}


// helper function used to strip out fields 
// other areas of the app should not have access to.
// !-- NOTE: Seems somewhat unecessary for the current app, 
// !-- but is probably not a bad idea
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


// helper function used to build a list of places
// saved by you friends. Goes through every friend
// and all their places and builds a 'placelist'.
// Also add's the 'savedBy' property + updates
// if > 1 user has saved a given place.
// !-- NOTE: I'm really unsure how to improve this, but it feels
// !-- really inefficient.
function buildFriendPlaceList(friendList) {
  
  var placeList = [];
  
  friendList.forEach(function(friend) {
    
    friend.ownedPlaces.forEach(function(place) {

      // find index of place in 'placeList'
      var placeIndex = binary.indexOf(placeList, {place_id: place.place_id}, placeCompare);
     
      // if place has already been added, add friend to 'savedBy'      
      if (placeIndex >= 0) {
        
        placeList[placeIndex].savedBy.push(friend.username);
        
      // if not, push place to placeList after marking who saved it.
      } else {
        
        place.savedBy = [friend.username];
        placeList = binary.insert(placeList, place, placeCompare);

      }
      
    });
  
  });

    return placeList;

}


// looks up a db entry based on user Id (provided by Google OAuth)
// and returns a user's entry if found or creates
// and returns a new entry if one does not exist.
// expects a google oauth user object, and a callback.
// !-- NOTE: relies on the layout of the google oAuth user object.
// !-- how to make it more flexible? This should be a promise as well.
exports.findOrCreate = function(userToAdd, next) {


  // lookup user based on 'id' property
  User.findOne({
    userId: userToAdd.id
  }, function(err, user) {
    
    if (err) return next({
      message: "Error looking up user"
    });

    if (user) return next(null, user);
    
    // create the new user
    // !-- NOTE: Perhaps this should be it's own function?
    var newUser = new User({
      userId: userToAdd.id,
      firstName: userToAdd.name.givenName,
      lastName: userToAdd.name.familyName
    });

    // save the user. 
    // If error, return it, otherwise return the user
    newUser.save(function(err, user) {
      if (err) return next({
        message: "Error saving user"
      });
      if (user) return next(false, user);
    });

  });

};


// function used to pull user info for a given userId.
// returns serialized user information via callback
// !-- NOTE: This could also be a promise.
exports.getInfo = function(userId, next) {


  // lookup user via ID, and populate appropriate friend fields
  User.findOne({
    userId: userId
  }).populate('friends', 'firstName lastName userId ownedPlaces username placeCount').exec(function(err, user) {
    
 
    if (err) return next({
      message: "Error looking up user"
    });
    
    if (!user) return next({
      message: "User not found"
    });

    // builds a list of your friends saved places & saves to 'friendsPlaces' attr.
    user.friendsPlaces = buildFriendPlaceList(user.friends);
    
    // return the serealized user profile
    return next(null, serealizeUserResult(user));
  });


};


// function used to set a users username.
// looks up user by userId and will update the record
// with the username provided.
// !-- NOTE: Should rejection of invaliad 'username' values be done here
// !-- or in the associated route? Here?
exports.setUsername = function(userId, username) {

  return (new Promise(function(res, rej) {

    
    // first check to see if user with 'username' exists
    User.findOne({
      username: username
    }).exec(function(err, user) {
      
      // if error or user exists, return error
      if (err) return rej({ message: "Error finding user" });
      if (user) return rej({ message: "Username already exists :x" });

      // otherwise lookup user record and update username.
      lookupUser({ userId: userId }).then(function(user) {

        user.username = username;
        
        // save the record and return nothing
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


// function to push a friend request to a users
// profile. Expects a username to look up the friend,
// and a user object to populate the request information.
// !-- NOTE: Because the google user object doesn't have the local
// !-- 'username' field, you can't store that without looking up the user 
// !-- who's adding in the DB. This should be fixed. Would also let you 
// !-- error check for adding yourself earlier. 
// !-- BUG: You can add a request to someone who you have an active request from
// !-- and it wont be removed if you add them/they add you.
exports.addRequest = function(friendUsername, userAdding) {

  return (
    new Promise(function(res, rej) {
            
      var userAddingId = userAdding.id;

      lookupUser({ username: friendUsername }).then(function(user) {

        // Checks if you're trying to add yourself
        if (user.userId === userAddingId) return rej({ message: "u can't add urself :/" });
        
        // Checks if you have already sent them a request
        if (binary.exists(user.friendRequests, {userId: userAddingId}, userIdCompare)) return rej({
          message: "Request already pending :o"
        });

        // Checks if your're already friends
        if (binary.exists(user.friends, {userId: userAddingId}, userIdCompare)) return rej({
          message: "User is already ur friend ;)"
        });
        
        // Build the request
        // !-- NOTE: could/should be it's own function?
        var request = {
          userId: userAddingId,
          firstName: userAdding.name.givenName,
          lastName: userAdding.name.familyName,
          username: userAdding.username,
          dateRequested: Date.now()
        };

        // push the request using binary.insert
        user.friendRequests = binary.insert(user.friendRequests, request, userIdCompare);
        user.markModified('friendRequests');
        
        // incr request count by 1
        user.requestCount++;
        
        // save the record and return nothing
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


// a function used to remove a friend request from
// a users profile. Uses user ID to lookup the user account
// and a friends user ID to remove the request.
exports.removeRequest = function(userToRemove, userId) {

  return (
    new Promise(function(res, rej) {

      lookupUser({ userId: userId }).then(function(user) {

        // get index of current friend request, returns -1 if not found.
        var friendRequestIndex = binary.indexOf(user.friendRequests, {userId: userToRemove}, userIdCompare);
        
        if (friendRequestIndex === -1) return rej({
          message: "No request from the user :/"
        });

        // remove the request
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


// function to add a two users to each others friend list.
// takes two user Id's, looks the user up both users then
// updates their friend lists.
exports.addFriend = function(userId, friendId) {

  return (
    new Promise(function(res, rej) {

      lookupUser({ userId: userId }).then(function(user) {

        // find index of friend request
        var userReqIndex = binary.indexOf(user.friendRequests, {userId: friendId}, userIdCompare);

        if (userReqIndex === -1) return rej({
          message: "User hasn't requested ur friendship :o"
        });

        if (binary.exists(user.friends, {userId: friendId}, userIdCompare)) return rej({
          message: "User is alraedy ur friend ;)"
        });

        lookupUser({ userId: friendId }).then(function(friend) {

          if (binary.exists(friend.friends, {userId: userId}, userIdCompare)) return rej({
            message: "Friend alraedy has u as a friend? :s"
          });

          // remove request from friend
          user.friendRequests.splice(userReqIndex, 1);
          user.markModified('friendRequests');
          user.requestCount--;

          // add friend to users friend list
          user.friends = binary.insert(user.friends, friend, userIdCompare);
          user.markModified('friends');
          user.friendCount++;

          // add user to friends friend list
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

              // return serialized friend information.
              // used to populate friend item in view.
              // !-- NOTE: Should this be a function?
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


// function to remove a friend. Takes to user Ids
// and removes both users from the others friends list.
exports.removeFriend = function(userId, friendId) {

  return (new Promise(function(res, rej) {
    lookupUser({ userId: userId }).then(function(user) {
      console.log(friendId);

      // find friend index
      var userFriendIndex = binary.indexOf(user.friends, {userId: friendId}, userIdCompare);

      if (userFriendIndex === -1) return rej({
        message: "But, u aren't friends with them :/"
      });


      lookupUser({ userId: friendId }).then(function(friend) {

        var friendFriendIndex = binary.indexOf(friend.friends, {userId: userId}, userIdCompare);

        if (friendFriendIndex === -1) return rej({
          message: "Friend doesn't have u added? :x"
        });

        // remove friend from users list
        user.friends.splice(userFriendIndex, 1);
        user.markModified('friends');
        user.friendCount--;

        // remove user from friends list
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



// function to save a Google Maps place to your account.
// Looks up user based on ID and saves the full GM place object.
// !-- NOTE: should this maybe be in a seperate file/handled with a seperate route?
// !-- Legality? Can I actually save local copies of google maps places?
exports.addPlace = function(userId, place) {

  return (
    new Promise(function(res, rej) {

      lookupUser({ userId: userId }).then(function(user) {

        if (binary.exists(user.ownedPlaces, {place_id: place.place_id}, placeCompare)) return rej({
          message: "Place is already saved :o"
        });

        // add place and update place count
        user.ownedPlaces = binary.insert(user.ownedPlaces, place, placeCompare);
        user.markModified('ownedPlaces');
        user.placeCount++;

        // return an updated list of owned places.
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


// function used to remove a place from an account.
// very similar to addPlace.
// !-- NOTE: currently accepts a full place object,
// !-- shoudl this be updated to only accept place Id
// !-- since no other place attributes are used?
exports.removePlace = function(userId, place) {

  return (
    new Promise(function(res, rej) {

      lookupUser({ userId: userId }).then(function(user) {

        // find place index
        var placeIndex = binary.indexOf(user.ownedPlaces, {place_id: place.place_id}, placeCompare);

        if (placeIndex === -1) return rej({
          message: "Place was not already saved :o"
        });

        // remove place from list + update
        user.ownedPlaces.splice(placeIndex, 1);
        user.markModified('ownedPlaces');
        user.placeCount--;

        // return an update list of owned places
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


