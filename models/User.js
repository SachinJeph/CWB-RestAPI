var mongoose = require('mongoose');

// Create the UserSchema.
var UserSchema = new mongoose.Schema({
	email: String,
	password: String,
	token: String
});

// Export the model
module.exports = mongoose.model('User', UserSchema);
