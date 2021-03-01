var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PostSchema = new Schema({
    post_type: { type: Schema.Types.ObjectId, required: true, ref: 'PostType' },
    created: { type: Date, required: true, default: Date.now },
    coordinates: { type: {
      x: { type: Number, required: true },
      y: { type: Number, required: true }
    }, required: true },
    address: { type: String, max: 250, trim: true, required: true },
    text: { type: String, required: true, max: 2000, trim: true },
    attached: [{ type: String, default: undefined }],
    author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    reply_count: { type: Number, required: true, default: 0 },
    likes_count: { type: Number, required: true, default: 0 }
  }, { typePojoToMixed: false });

// Virtual for post's URL
PostSchema
.virtual('url')
.get(function () {
  return '/posts/' + this._id;
});

module.exports = mongoose.model('Post', PostSchema);
