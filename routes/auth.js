var jwt = require('jwt-simple');
var moment = require('moment');
var User = require('../models/user');

var auth = {
	register: function(req, res){
		var fullname = req.body.fullname || '';
		var username = req.body.username || '';
		var password = req.body.password || '';

		if(fullname == '' || username == '' || password == ''){
			return res.status(401).json({"status":401, "message":"Required Field Missing"});
		}

		User.findOne({username:username}, function(err, existingUser){
			if(err){
				return res.status(500).json({"status":500, "message":"Please Try Again", "error":err});
			}
			if(existingUser){
				return res.status(409).json({"status":409, "message":"User Already Exists"});
			}

			var userData = new User();
			userData.name = fullname;
			userData.username = username;
			userData.password = password;
			userData.save(function(err, result){
				if(err){
					return res.status(500).json({"status":500, "message":"Please Try Again", "error":err});
				}
				return res.status(200).json({"status":200, "message":"Thank your Registration!", token:createJWT(result)});
			});
		});
	},
	login: function(req, res){
		var username = req.body.username || '';
		var password = req.body.password || '';

		if(username == '' || password == ''){
			return res.status(401).json({"status":401, "message":"Authentication Error"});
		}

		auth.validate(username, password, function(err, userData){
			if(err){
				return res.status(500).json({"status":500, "message":"Please Try Again", "error":err});
			}

			if(!userData){
				return res.status(401).json({"status":401, "message":"Invalid credentials"});
			}
			return res.status(200).json({"status":200, "message":"Thank you for Login!" ,token:createJWT(userData)});
		});
	},
	validate: function(username, password, cb){
		User.findOne({username:username}, function(err, user){
			if(err) cb(err);

			if(user){
				user.comparePassword(password, function(err, isMatch){
					if(err) cb(err);
					if(isMatch){
						cb(null, user);
					}else{
						cb(null, null);
					}
				});
			}else{
				cb(null, null);
			}
		});
	},
	validateUser: function(id, cb){
		User.findOne({'_id':id}, function(err, user){
			if(err) cb(err);
			cb(null, user);
		});
	},
	me: function(req, res){
		return res.status(200).json({"status":200, "data":req.user});
	},
};

function createJWT(user){
	var payload = {
		iss: user._id,
		iat: moment().unix(),
		exp: moment().add(14, 'days').unix()
	};
	return jwt.encode(payload, require('../config/secret.js')());
}

module.exports = auth;
