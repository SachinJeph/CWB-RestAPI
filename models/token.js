// Load required packages
var mongoose = require('mongoose');

// Define our token schema
var TokenSchema = new mongoose.Schema({
	token: {type:String, required:true},
	userId: {type:String, required: true},
	appId: {type:String, required: true}
});

// Export the Mongoose model
modulle.exports = mongoose.model('Token', TokenSchema);
