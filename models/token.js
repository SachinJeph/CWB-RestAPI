// Load required packages
var mongoose = require('mongoose');
require('mongoose-double')(mongoose);

var SchemaTypes = mongoose.Schema.Types;

// Define our token schema
var TokenSchema = new mongoose.Schema({
	value: {type:String, required:true},
	appId: {type:SchemaTypes.ObjectId, ref:'App', required: true},
	userId: {type:SchemaTypes.ObjectId, ref:'User', required: true}
});

// Export the Mongoose model
module.exports = mongoose.model('Token', TokenSchema);
