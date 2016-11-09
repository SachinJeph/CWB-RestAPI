var jwt = require('jwt-simple');
var moment = require('moment');
var UserModel = require('../models/user');

var auth = {
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
	validateUser: function(id){
		UserModel.findOne({'_id':id}, function(err, user){
			if(err) return null;
			return user;
		});
	},
};

module.exports = auth;
