'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var authTypes = ['github', 'twitter', 'facebook', 'google'];
var CommentSchema = require('./comment').schema;
var UserProductSchema = require('./user_product').schema;


var UserSchema = new Schema({
  name: String,
  email: { type: String, lowercase: true },
  imageUrl: {type: String, default: 'assets/images/user_default.jpg'},
  products: [UserProductSchema],
  wishes: [UserProductSchema],
  following: [Schema.Types.ObjectId],
  followers: [Schema.Types.ObjectId],
  role: {
    type: String,
    default: 'user'
  },
  hashedPassword: String,
  provider: String,
  salt: String,
  facebook: {},
  twitter: {},
  google: {},
  github: {}
});

/**
 * Virtuals
 */
UserSchema
  .virtual('password')
  .set(function(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  })
  .get(function() {
    return this._password;
  });

  // User profile url
UserSchema
  .virtual('profileUrl')
  .get(function() {
    return '/users/' + this._id;
  });

// Non-sensitive info we'll be putting in the token
UserSchema
  .virtual('token')
  .get(function() {
    return {
      '_id': this._id,
      'role': this.role
    };
  });

/**
 * Validations
 */

// Validate empty email
UserSchema
  .path('email')
  .validate(function(email) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return email.length;
  }, 'Email cannot be blank');

// Validate empty password
UserSchema
  .path('hashedPassword')
  .validate(function(hashedPassword) {
    if (authTypes.indexOf(this.provider) !== -1) return true;
    return hashedPassword.length;
  }, 'Password cannot be blank');

// Validate email is not taken
UserSchema
  .path('email')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({email: value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
}, 'The specified email address is already in use.');

var validatePresenceOf = function(value) {
  return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
  .pre('save', function(next) {
    if (!this.isNew) return next();

    if (!validatePresenceOf(this.hashedPassword) && authTypes.indexOf(this.provider) === -1)
      next(new Error('Invalid password'));
    else
      next();
  });

/**
* Statics
*/
UserSchema.statics = {
  getAll: function(cb) {
    return this.find()
               .populate('products.comments.author', '-salt -hashedPassword')
               .exec(cb);
  },
  getOne: function(userId, cb) {
    return this.model('User').findById(userId)
               .populate('products.comments.author', '-salt -hashedPassword')
               .exec(cb);

  }
};

/**
 * Methods
 */
UserSchema.methods = {

  getSelf: function(cb) {
    return this.model('User').findById(this._id)
               .populate('products.comments.author', '-salt -hashedPassword')
               .exec(cb);

  },
  /**
   * Authenticate - check if the passwords are the same
   *
   * @param {String} plainText
   * @return {Boolean}
   * @api public
   */
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  },

  /**
   * Make salt
   *
   * @return {String}
   * @api public
   */
  makeSalt: function() {
    return crypto.randomBytes(16).toString('base64');
  },

  /**
   * Encrypt password
   *
   * @param {String} password
   * @return {String}
   * @api public
   */
  encryptPassword: function(password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
};

UserSchema.set('toObject', {
    virtuals: true
});

UserSchema.set('toJSON', {
    virtuals: true
});

module.exports = mongoose.model('User', UserSchema);
