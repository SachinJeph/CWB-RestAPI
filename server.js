var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var jwt = require('jwt-simple');
var mongoose = require('mongoose');
var methodOverride = require('method-override');

// Create the application
var app = express();

var port = process.env.PORT || 7000;

// Add Middleware necessary for REST API's
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.json({type: 'application/vnd.api+json'}));
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// CORS Support
app.use(function(req, res, next){
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');

	if(req.method == 'OPTINOS') res.status(200).end();
	next();
});

app.all('/app/v1/*', function(req, res, next){
	res.header("Access-Control-Allow-Origin", "*"); // restrict it to required domain
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header("Access-Control-Allow-Headers", 'Content-type,Accept,X-Access-Token,X-Key'); // Set custom headers for CORS
	
	if(req.method == 'OPTIONS') res.status(200).end();
	next();
});

// Auth Middleware
// Only the requresst that start with /api/v1/* will be checked for the token.
// Any URL's That do not follow the below pattern should be avoided unless you are sure that authentication is not needed
app.all('/api/v1/*', [require('./middlewares/validateRequest')]);

app.use('/', require('./routes'));

app.use(function(req, res, next){
	res.status(404).send('Page Not Found');
});

// Connect to mongoDB and start the server
mongoose.connect('mongodb://localhost/rest-api-dev');
mongoose.connection.once('open', function(){
	//Load the models
	//app.models = require('./models/index');

	console.log('Listening on port ' + port + '...');
	app.listen(port);
});
