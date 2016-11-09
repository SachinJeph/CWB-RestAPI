var jwt = require('jwt-simple');
var UserModel = require('../models/user');

var auth = {
	login: function(req, res){
		var username = req.body.username || '';
		var password = req.body.password || '';

		if(username == '' || password == ''){
			res.status(401);
			res.json({"status":401, "message":"Authentication Error"});
			return;
		}

		dbUserObj = auth.validate(username, password);
		
		if(!dbUserObj){
			res.status(401);
			res.json({"status":401, "message":"Invalid credentials"});
			return;
		}

		var expires = moment().add('days', 7).valueOf(); // expires in 7 days
		var token = jwt.encode({exp:expires, iss:dbUserObj.id}, require('../config/secret')());

		res.json({
			token:token,
			expires: expires,
			user: dbUserObj.toJSON()
		});
	},
	validate:function(username, password){
		UserModel.findOne({username:username}, function(err, user){
			if(err) return null;
			
			if(user){
				user.comparePassword(password, function(err, isMatch){
					if(err) return null;
					if(isMatch) return user;
				});
			}
			return null;
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
