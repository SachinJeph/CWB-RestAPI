var _ = require('lodash');
var User = require('../user');
var OAuthClient = require('./oauth_client');
var OAuthAccessToken = require('./oauth_accesstoken');
var OAuthAuthorizationCode = require('./oauth_authcode');
var OAuthRefreshToken = require('./oauth_refreshtoken');

function getAccessToken(bearerToken){
	console.log("getAccessToken", bearerToken);

	//User, OAuthClient
	return OAuthAccessToken.findOne({access_token: bearerToken}).populate('User').populate('OAuthClient').then(function(accessToken){
		console.log('at', accessToken);
		if(!accessToken) return false;

		var token = accessToken;
		token.user = token.User;
		token.client = token.OAuthClient;
		token.scope = token.scope
		return token;
	}).catch(function(err){
		console.log("getAccessToken - Err: ");
	});
};

function getClient(clientId, clientSecret, cb){
	console.log("getClient",clientId, clientSecret);
	const options = {client_id: clientId};
	if(clientSecret) options.client_secret = clientSecret;

	OAuthClient.findOne(options).then(function(client){
		if(!client) return cb(new Error("client not found"));

		var clientWithGrants = client.toObject();
		clientWithGrants.grants = ['authorization_code', 'password', 'refresh_token', 'client_credentials'];
		//clientWithGrants.grants = ['password'];
		// Todo: need to create another table for redirect URIs
		clientWithGrants.redirectUris = [clientWithGrants.redirect_uri];
		delete clientWithGrants.redirect_uri;
		//clientWithGrants.refreshTokenLifetime = integer optional
		//clientWithGrants.accessTokenLifetime  = integer optional
		cb(null, clientWithGrants);
	}).catch(function(err){
		console.log("getClient - Err: ", err);
		cb(err);
	});
};

function getUser(username, password, cb){
	console.log("getUser", username, password);

	User.findOne({username: username}).then(function(user){
		console.log("user Data",user);
		user.comparePassword(password, function(err, isMatch){
			if(err){
			 console.log("getUserCompare - Err: ", err);
				return cb(err);
			}

			console.log(isMatch);
			cb(null, isMatch ? user : false);
		});
	}).catch(function(err){
		console.log("getUser - Err: ", err);
		return cb(err);
	});
};

function revokeAuthorizationCode(code) {
  console.log("revokeAuthorizationCode",code)
  return OAuthAuthorizationCode.findOne({
    where: {
      authorization_code: code.code
    }
  }).then(function (rCode) {
    //if(rCode) rCode.destroy();
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
    var expiredCode = code
    expiredCode.expiresAt = new Date('2015-05-28T06:59:53.000Z')
    return expiredCode
  }).catch(function (err) {
    console.log("getUser - Err: ", err)
  });
}

function revokeToken(token) {
  console.log("revokeToken",token)
  return OAuthRefreshToken.findOne({
    where: {
      refresh_token: token.refreshToken
    }
  }).then(function (rT) {
    if (rT) rT.destroy();
    /***
     * As per the discussion we need set older date
     * revokeToken will expected return a boolean in future version
     * https://github.com/oauthjs/node-oauth2-server/pull/274
     * https://github.com/oauthjs/node-oauth2-server/issues/290
     */
    var expiredToken = token
    expiredToken.refreshTokenExpiresAt = new Date('2015-05-28T06:59:53.000Z')
    return expiredToken
  }).catch(function (err) {
    console.log("revokeToken - Err: ", err)
  });
}


function saveToken(token, client, user){
	console.log("saveToken", token, client, user);

	return Promise.all([
		OAuthAccessToken.create({
			access_token: token.accessToken,
			expires: token.accessTokenExpiresAt,
			OAuthClient: client._id,
			User: user._id,
			scope: token.scope
		}), token.refreshToken ? OAuthRefreshToken.create({ // no refresh token for client_credentials
			refresh_token: token.refreshToken,
			expires: token.refreshTokenExpiresAt,
			OAuthClient: client._id,
			User: user._id,
			scope: token.scope
		}) : [],
	]).then(function(resultsArray){
		//return _.assign({access_token:token.accessToken, token_type:'bearer', expires:token.expires, refresh_token:token.refreshToken}, token);
		return _.assign({  // expected to return client and user, but not returning
			client: client,
			user: user,
			access_token: token.accessToken, // proxy
			refresh_token: token.refreshToken, // proxy
			token_type: 'bearer',
			expires_in: token.accessTokenExpiresAt
		}, token);
	}).catch(function(err){
		console.log("revokeToken - Err: ", err);
	});
};

function getAuthorizationCode(code) {
  console.log("getAuthorizationCode",code)
  return OAuthAuthorizationCode
    .findOne({authorization_code: code})
    .populate('User')
    .populate('OAuthClient')
    .then(function (authCodeModel) {
      if (!authCodeModel) return false;
      var client = authCodeModel.OAuthClient
      var user = authCodeModel.User
      return reCode = {
        code: code,
        client: client,
        expiresAt: authCodeModel.expires,
        redirectUri: client.redirect_uri,
        user: user,
        scope: authCodeModel.scope,
      };
    }).catch(function (err) {
      console.log("getAuthorizationCode - Err: ", err)
    });
}

function saveAuthorizationCode(code, client, user) {
  console.log("saveAuthorizationCode",code, client, user)
  return OAuthAuthorizationCode
    .create({
      expires: code.expiresAt,
      OAuthClient: client._id,
      authorization_code: code.authorizationCode,
      User: user._id,
      scope: code.scope
    })
    .then(function () {
      code.code = code.authorizationCode
      return code
    }).catch(function (err) {
      console.log("saveAuthorizationCode - Err: ", err)
    });
}

function getUserFromClient(client) {
  console.log("getUserFromClient", client)
  var options = {client_id: client.client_id};
  if (client.client_secret) options.client_secret = client.client_secret;

  return OAuthClient
    .findOne(options)
    .populate('User')
    .then(function (client) {
      console.log(client)
      if (!client) return false;
      if (!client.User) return false;
      return client.User;
    }).catch(function (err) {
      console.log("getUserFromClient - Err: ", err)
    });
}

function getRefreshToken(refreshToken) {
  console.log("getRefreshToken", refreshToken)
  if (!refreshToken || refreshToken === 'undefined') return false
//[OAuthClient, User]
  return OAuthRefreshToken
    .findOne({refresh_token: refreshToken})
    .populate('User')
    .populate('OAuthClient')
    .then(function (savedRT) {
      console.log("srt",savedRT)
      var tokenTemp = {
        user: savedRT ? savedRT.User : {},
        client: savedRT ? savedRT.OAuthClient : {},
        refreshTokenExpiresAt: savedRT ? new Date(savedRT.expires) : null,
        refreshToken: refreshToken,
        refresh_token: refreshToken,
        scope: savedRT.scope
      };
      return tokenTemp;

    }).catch(function (err) {
      console.log("getRefreshToken - Err: ", err)
    });
}

function validateScope(token, scope){
	console.log("validateScope", token, scope);
	//return token.scope === scope;
	return true;
};

module.exports = {
  //generateOAuthAccessToken, optional - used for jwt
  //generateAuthorizationCode, optional
  //generateOAuthRefreshToken, - optional
  getAccessToken: getAccessToken,
  getAuthorizationCode: getAuthorizationCode, //getOAuthAuthorizationCode renamed to,
  getClient: getClient,
  getRefreshToken: getRefreshToken,
  getUser: getUser,
  getUserFromClient: getUserFromClient,
  //grantTypeAllowed, Removed in oauth2-server 3.0
  revokeAuthorizationCode: revokeAuthorizationCode,
  revokeToken: revokeToken,
  saveToken: saveToken,//saveOAuthAccessToken, renamed to
  saveAuthorizationCode: saveAuthorizationCode, //renamed saveOAuthAuthorizationCode,
  validateScope: validateScope,
}
