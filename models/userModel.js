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
  friendRequests: {type: Schema.Types.Mixed, default: {}},
  requestCount: {type: Number, default: 0},
  ownedPlaces: {type: Schema.Types.Mixed, default: {}},
  friendsPlaces: {type: Schema.Types.Mixed, default: {}},
  dateCreated: {type: Date, default: Date.now}
}));