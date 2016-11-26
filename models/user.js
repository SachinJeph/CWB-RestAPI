var mongoose = require('mongoose'),
	emailAddressManagerPlugin = require('mongoose-email-address-manager');
var bcrypt = require('bcrypt');

var SALT_WORK_FACTOR = 10;

var userRole = 'admin user'.split(' ');
var emailOptions = {
	unique: true, // defaults to true will throw error if emails are not unique
	verificationCodePrefix: 'emvc-', // useful for web pages that deal with more then one type of access code / validation code (like mobile verification)
	verificationCodeExpiration: 2, // the amount of hours to add to the expiration date of validation code, defaults no never expire (0)
	emailValidationRegex: /^.+@.+$/ // very simple regex validator for email addresses, overwriter if you want something more powerful
}

// Create the UserSchema.
var UserSchema = new mongoose.Schema({
	name: String,
	username: {type:String, required:true, index:{unique:true}},
	password: {type:String, required:true},
	email_addresses: [{
		email_address: {type:String, unique:true},
		primary: Date,
		verification: {
			date: Date,
			code: String,
			code_expiration: Date
		}
	}],
	role: {type:String, enum:userRole, default:'user', require:true},
	meta: {
		website: String,
	},
	facebook: {
		id: String,
		email: String
	},
	google: {
		id: String,
		email: String
	},
	scope: String,
	version: {type:Number, default:1},
	created_at: Date,
	updated_at: Date
});

UserSchema.pre('save', function(next){
	var user = this;

	// get the current date
	var currentDate = new Date();

	// change the updated_at field to current date
	this.updated_at = currentDate;
	
	// if created_at doesn't exist, add to that field
	if(!this.created_at) this.created_at = currentDate;

	// only hash the password if it has been modified (or is new)
	if(!user.isModified('password')) return next();

	// generate a salt
	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
		if(err) return next(err);

		// hash the password along with our new salt
		bcrypt.hash(user.password, salt, function(err, hash){
			if(err) return next(err);

			// override the cleartext password with the hashed one
			user.password = hash;
			next();
		});
	});
});

UserSchema.methods.comparePassword = function(candidatePassword, cb){
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
		if(err) return cb(err);
		cb(null, isMatch);
	});
};

UserSchema.statics.findByUsername = function(username, cb){
	this.findOne({username:username}, cb);
};

UserSchema.plugin(emailAddressManagerPlugin, emailOptions);

// Export the model
module.exports = mongoose.model('User', UserSchema);
