var mongoose = require('mongoose');

// create todo schema
var todoSchema = new mongoose.Schema({
	text: {type:String},
	done: Boolean
});

// export the module
module.exports = mongoose.model('Todo', todoSchema);
