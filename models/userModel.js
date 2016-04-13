// model used for users

// initial dependencies
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// master schema for the user profile.
// Some fields are populated by the information provided by the google OAuth token
module.exports = mongoose.model('User', new Schema({
  userId: String,
  email: String,
  username: String,
  firstName: String,
  lastName: String,
  friends: [{type: Schema.ObjectId, ref: 'User'}],
  friendCount: {type: Number, default: 0},
  friendRequests: {type: Array, default: []},
  requestCount: {type: Number, default: 0},
  ownedPlaces: {type: Array, default: []},
  placeCount: {type: Number, default: 0},
  friendsPlaces: {type: Array, default: []},
  dateCreated: {type: Date, default: Date.now}
}));