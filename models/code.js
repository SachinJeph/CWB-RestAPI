// Load required packages
var mongoose = require('mongoose');

var CodeSchema = new mongoose.Schema({
	value: {type:String, required:true},
	redirectUrl: {type:String, required:true},
	appId: {type:String, required:true},
	userId: {type:String, required:true}
});

// Export the model
module.exports = mongoose.model('Code', CodeSchema);
