var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var methodOverride = require('method-override');

// Create the application
var app = express();

var port = process.env.PORT || 7000;
var secret = process.env.JWT_SECRET || "12kcjkelsa3jljxlcjwoe";

// Add Middleware necessary for REST API's
app.use(express.static(__dirname + '/public'));
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride());

// CORS Support
app.use(function(req, res, next){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
	next();
});

// Models
var User = require('./models/User');

// Routes
require('./app/routesTodo.js')(app);

// Connect to mongoDB and start the server
mongoose.connect('mongodb://localhost/rest-api');
mongoose.connection.once('open', function(){
	//Load the models
	//app.models = require('./models/index');

	console.log('Listening on port ' + port + '...');
	app.listen(port);
});

app.post('/authenticate', function(req, res){
	User.findOne({email:req.body.email, password:req.body.password}, function(err, user){
		if(err){
			res.json({
				type:false,
				data: "Error occured: " + err
			});
		}else{
			if(user){
				res.json({
					type:true,
					data: user,
					token: user.token
				});
			}else{
				res.json({
					type:false,
					data: "Incorrect email/password"
				});
			}
		}
	});
});

app.post('/register', function(req, res){
	User.findOne({email:req.body.email}, function(err, user){
		if(err){
			res.json({
				type: false,
				data: "Error occured: " +err
			});
		}else{
			if(user){
				res.json({
					type: false,
					data: "User already exists!"
				});
			}else{
				var userModel = new User();
				userModel.email = req.body.email;
				userModel.password = req.body.password;
				userModel.save(function(err, user){
					user.token = jwt.sign(user, secret);
					user.save(function(err){
						res.json({
							type: true,
							data: "User Register Successfully",
						});
					});
				});
			}
		}
	});
});

app.get('/me', ensureAuthorized, function(req, res){
	User.findOne({token:req.token}, function(err, user){
		if(err){
			res.json({
				type:false,
				data: "Error occured: " + err
			});
		}else{
			res.json({
				type: true,
				data: user
			});
		}
	});
});

function ensureAuthorized(req, res, next){
	var bearerToken;
	var bearerHeader = req.headers["authorization"];

	if(typeof bearerHeader !== 'undefined'){
		var bearer = bearerHeader.split(" ");
		bearerToken = bearer[1];
		req.token = bearerToken;
		next();
	}else{
		res.send(403);
	}
}
