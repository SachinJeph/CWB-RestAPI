// Load required packages
var mongoose = require('mongoose');

// Define our token schema
var TokenSchema = new mongoose.Schema({
	userId: {type:String, required: true},
	clientId: {type:String, required: true}
});

// Export the Mongoose model
modulle.exports = mongoose.model('Token', TokenSchema);
