var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
  friendsPlaces: {type: Array, default: []},
  dateCreated: {type: Date, default: Date.now}
}));