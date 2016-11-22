// Load required packages
var oauth2orize = require('oauth2orize');
var UserModel = require('../models/user');
var AppModel = require('../models/app');
var TokenModel = require('../models/token');
var CodeModel = require('../models/code');

// Create Oauth 2.0 Server
var server = oauth2orize.createServer();

// Register serialization and deserialization functions
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTP request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.
server.serializeClient(function(appClient, callback){
	return callback(null, appClient._id);
});

server.deserializeClient(function(id, callback){
	AppModel.findOne({_id:id}, function(err, appClient){
		if(err) return callback(err);

		return callback(null, appClient);
	});
});

// Register supported grant types
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applicatons limited access to their protected resources. It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.
//

// Grant authorization codes.  The callback takes the `client` requesting
// authorization, the `redirectUri` (which is used as a verifier in the
// subsequent exchange), the authenticated `user` granting access, and
// their response, which contains approved scope, duration, etc. as parsed by
// the application.  The application issues a code, which is bound to these
// values, and will be exchanged for an access token.
server.grant(oauth2orize.grant.code(function(appClient, redirectUri, user, ares, callback){
	// Create a new authorization code
	var code = new CodeModel({
		value: uid(16),
		redirectUri: redirectUri,
		appId: appClient._id,
		userId: user._id
	});

	// Save the auth code and check for errors
	code.save(function(err){
		if(err) return callback(err);

		callback(null, code.value);
	});
}));

// Exchange authorization codes for access tokens.  The callback accepts the
// `client`, which is exchanging `code` and any `redirectUri` from the
// authorization request for verification.  If these values are validated, the
// application issues an access token on behalf of the user who authorized the
// code.

server.exchange(oauth2orize.exchange.code(function(appClient, code, redirectUri, callback){
	CodeModel.findOne({value:code}, function(err, authCode){
		if(err) return callback(err);
		if(authCode === undefined || !authCode.length) return callback(null, false);
		if(appClient._id.toString() !== authCode.appId) return callback(null, false);
		if(redirectUri !== authCode.redirectUri) return callback(null, false);

		// Delete auth code now that it has been used
		authCode.remove(function(err){
			if(err) return callback(err);

			// Create a new access token
			var token = new Token({
				value: uid(256),
				appId: authCode.appId,
				userId: authCode.userId
			});

			// Save the access token and check for errors
			token.save(function(err){
				if(err) return callback(err);

				callback(null, token);
			});
		});
	});
}));

// user authorization endpoint
//
// `authorization` middleware accepts a `validate` callback which is
// responsible for validating the client making the authorization request.  In
// doing so, is recommended that the `redirectUri` be checked against a
// registered value, although security requirements may vary accross
// implementations.  Once validated, the `callback` callback must be invoked with
// a `client` instance, as well as the `redirectUri` to which the user will be
// redirected after an authorization decision is obtained.
//
// This middleware simply initializes a new authorization transaction.  It is
// the application's responsibility to authenticate the user and render a dialog
// to obtain their approval (displaying details about the client requesting
// authorization).  We accomplish that here by routing through `ensureLoggedIn()`
// first, and rendering the `dialog` view. 
exports.authorization = [
	server.authorization(function(appClientId, redirectUri, callback){
		AppModel.findOne({appClientID:appClientId}, function(err, appClient){
			if(err) return callback(err);

			return callback(null, appClient, redirectUri);
		});
	}),
	function(req, res){
		res.render('dialog', {transactionID:req.oauth2.transactionID, user:req.user, client:req.oauth2.client});
	}
]

// user decision endpoint
//
// `decision` middleware processes a user's decision to allow or deny access
// requested by a client application.  Based on the grant type requested by the
// client, the above grant middleware configured above will be invoked to send
// a response.
exports.decision = [
	server.decision()
]

// token endpoint
//
// `token` middleware handles client requests to exchange authorization grants
// for access tokens.  Based on the grant type being exchanged, the above
// exchange middleware will be invoked to handle the request.  Clients must
// authenticate when making requests to this endpoint.
exports.token = [
	server.token(),
	server.errorHandler()
]

function uid(len){
	var buf=[],
		chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		charlen = chars.length;

	for(var i=0; i<len; ++i){
		buf.push(chars[getRandomInt(0, charlen-1)]);
	}

	return buf.join('');
};

function getRandomInt(min, max){
	return Math.floor(Math.random()*(max-min+1))+min;
};
