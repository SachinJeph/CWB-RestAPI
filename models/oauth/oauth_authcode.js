var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OAuthAuthorizationCodeSchema = new Schema({
	authorization_ode: {type:String, required:true, unique:true},
	expires: Date,
	redirect_uri: String,
	scope: String,
	User: {type:Schema.Types.ObjectId, ref:'User'},
	OAuthClient: {type:Schema.Types.ObjectId, ref:'OAuthClient'},
});

module.exports = mongoose.model('OAuthAuthorizationCode', OAuthAuthorizationCodeSchema);
