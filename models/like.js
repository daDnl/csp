var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var LikeSchema = new Schema({
    post: { type: Schema.Types.ObjectId, required: true, ref: 'Post' },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  });

module.exports = mongoose.model('Like', LikeSchema);
