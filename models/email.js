// Load required packages
var mongoose = require('mongoose');
require('mongoose-double')(mongoose);

var SchemaTypes = mongoose.Schema.Types;

var emailStatus = 'pending sent'.split(' ');

// Define our application schema
var EmailSchema = new mongoose.Schema({
	name: {type:String},
	from: {type:String},
	to: {type:String},
	subject: {type:String},
	content: {type:String},
	status: {type:String, enum:emailStatus, default:'pending', require:true},
	appId: {type:SchemaTypes.ObjectId, ref:'App'},
	version: {type:Number, default:1},
	created_at: Date,
	updated_at: Date
});

EmailSchema.pre('save', function(next){
	// get the current date
	var currentDate = new Date();

	// change the update_at field to current date
	this.updated_at = currentDate;

	// if created_at doesn't exist, add to that field
	if(!this.created_at) this.created_at = currentDate;

	next();
});

// Export the model
module.exports = mongoose.model('Email', EmailSchema);
