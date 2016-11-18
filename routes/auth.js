var jwt = require('jwt-simple');
var moment = require('moment');
var UserModel = require('../models/user');

var auth = {
	register: function(req, res){
		var fullname = req.body.fullname || '';
		var username = req.body.username || '';
		var password = req.body.password || '';

		if(fullname == '' || username == '' || password == ''){
			res.status(401);
			return res.json({"status":401, "message":"Required Field Missing"});
		}

		UserModel.findOne({username:username}, function(err, user){
			if(err){
				res.status("401");
				return res.json({"status":401, "message":"Please Try Again", "Error":err});
			}
			console.log(user);
			if(user){
				res.status("401");
				return res.json({"status":401, "message":"User Already Exists"});
			}

			var userData = new UserModel();
			userData.name = fullname;
			userData.username = username;
			userData.password = password;
			userData.role = 'user';
			userData.save(function(err){
				if(err){
					res.status("401");
					return res.json({"status":401, "message":"Please Try Again", "Error":err});
				}else{
					res.status("200");
					return res.json({"status":200, "message":"Thank your Registration!"});
				}
			});
		});
	},
	login: function(req, res){
		var username = req.body.username || '';
		var password = req.body.password || '';

		if(username == '' || password == ''){
			res.status(401);
			return res.json({"status":401, "message":"Authentication Error"});
		}

		auth.validate(username, password, function(err, userData){
			if(err || !userData){
				res.status(401);
				return res.json({"status":401, "message":"Invalid credentials"});
			}

        	        var expires = moment().add(7, 'days').valueOf(); // expires in 7 days
        	        var token = jwt.encode({exp:expires, iss:userData._id}, require('../config/secret.js')());
			return res.json({
				token:token,
				expires: expires,
				user: userData
			});
		});
	},
	validate: function(username, password, cb){
		UserModel.findOne({username:username}, function(err, user){
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
		UserModel.findOne({'_id':id}, function(err, user){
			if(err) cb(err);
			cb(null, user);
		});
	},
	me: function(req, res){
		auth.validateUser(req.user._id, function(err, user){
			if(err){
				res.status(401);
                                return res.json({"status":401, "message":"Please Try Again", "Error":err});
			}

			res.status(200);
			return res.json({"status":200, "data":user});
		});
	},

	newLogin: function(req, res){
		UserModel.findOne({username:req.body.email}, function(err, user){
			if(!user){
				return res.status(401).send({message: 'Invalid email and/or password'});
			}

			user.comparePassword(req.body.password, function(err, isMatch){
				if(!isMatch){
					return res.status(401).send({message: 'Invalid email and/or password'});
				}
				res.send({token:createJWT(user)});
			});
		});
	},
};

function createJWT(user){
	var payload = {
		sub: user._id,
		iat: moment().unix(),
		exp: moment().add(14, 'days').unix()
	};
	return jwt.encode(payload, require('../config/secret.js')());
}

module.exports = auth;
