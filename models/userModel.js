var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = mongoose.model('User', new Schema({
  userId: String,
  // email: String,
  firstName: String,
  lastName: String,
  friends: {type: Array, default: []},
  friendRequests: {type: Object, default: {}},
  ownedPlaces: {type: Array, default: []},
  friendsPlaces: {type: Array, default: []},
  dateCreated: {type: Date, default: Date.now}
}));