var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var UserSchema = new Schema({
    fname: { type: String, required: true, max: 80, trim: true },
    sname: { type: String, max: 80, trim: true},
    email: { type: String, unique: true, min: 5, max: 256, trim: true },
    password: { type: String, required: true, min: 5, max: 50, trim: true },
    bio: { type: String, max: 500, trim: true },
    photo: { type: String },
    registrated: { type: Date, required: true, default: Date.now },
    priv: { type: String, required: true, enum: ['common', 'moderator', 'admin'], default: 'common' },
    is_confirmed: { type: Boolean, required: true, default: false },
    token: { type: {
      token_type: { type: String, enum: ['email_confirm', 'pass_reset', 'email_change'] },
      ref: { type: Schema.Types.ObjectId, ref: 'Token' }
    }
    }
  }, { typePojoToMixed: false });

// Virtual for user's full name
UserSchema
.virtual('fullname')
.get(function () {
  return this.fname + ' ' + this.sname;
});

// Virtual for user's URL
UserSchema
.virtual('url')
.get(function () {
  return '/users/' + this._id;
});

module.exports = mongoose.model('User', UserSchema);
