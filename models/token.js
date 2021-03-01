var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TokenSchema = new Schema({
    hash: { type: String, required: true },
    created: { type: Date, required: true, default: Date.now, expires: 21600}
  });

module.exports = mongoose.model('Token', TokenSchema);
