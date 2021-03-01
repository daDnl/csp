var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var PostTypeSchema = new Schema({
    type: { type: String, required: true },
    icon: { type: String, required: true},
  });

module.exports = mongoose.model('PostType', PostTypeSchema);
