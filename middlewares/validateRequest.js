var jwt = require('jwt-simple');
var url = require('url');
var validateUser = require('../routes/auth').validateUser;

module.exports = function(req, res, next){
	// Parse the URL, we might need this
	var parsed_url = url.parse(req.url, true);

	// When performing a cross domain request, you will recieve
	// a preflighted request first. This is to check if our the app is safe
	
	// We skip the token outh for [OPTIONS] requests
	// if(req.method == 'OPTIONS') next();

	var token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
	var key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];

	if(token || key){
		try{
			var decoded = jwt.decode(token, require('../config/secret.js')());

			if(decoded.exp <= Date.now()){
				res.status(400);
				res.json({"status":400, "message":"Access Token Expired"});
				return;
			}

			// Authorize the user to see if s/he can access our resources
			validateUser(decoded.iss, function(err, user){
				if(err || !user){
					res.status(401);
					res.json({"status":401, "message":"Invalid User"});
					return;
				}

				if((req.url.indexOf('/api/v1/')>=0 && user.role=='admin') || (req.url.indexOf('/api/v1/user')>=0 && user.role=='user')){
					next();
				}else{
					res.status(403);
					res.json({"status":403, "message":"Not Authorized"});
					return;
				}
			});
		}catch(err){
			res.status(500);
			res.json({"status":500, "message":"Oops something went wrong", "error":err})
			return;
		}
	}else{
		res.status(401);
		res.json({"status":401, "message":"Invalid Token or Key"});
		return;
	}
};
