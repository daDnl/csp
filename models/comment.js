var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    post: { type: Schema.Types.ObjectId, required: true, ref: 'Post' },
    author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    created: { type: Date, required: true, default: Date.now },
    text: { type: String, required: true, max: 2000, trim: true },
    attached: { type: Array, default: undefined },
    reply_count: { type: Number, required: true, default: 0 },
    parent: { type: Schema.Types.ObjectId, ref: 'Comment' }
  });

module.exports = mongoose.model('Comment', CommentSchema);
