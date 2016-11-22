var express = require('express');
var router = express.Router();

var auth = require('./auth.js');
var user = require('./users.js');
var app = require('./app.js');

var middlewareAuth = require('../middlewares/validateRequest');

/** Routes that can be accessed by any one **/
router.post('/auth/login', auth.login);
router.post('/auth/register', auth.register);

/** Routes that can be access only by authenticated users **/
router.get('/me', middlewareAuth,  auth.me);

/** get all application register to the particular user **/
router.get('/api/v1/apps', app.getAll);
router.get('/api/v1/app/:id', app.getOne);
router.post('/api/v1/app', app.create);


/** Admin Routes need to be verify here **/
router.all('/api/v1/admin/*', function(req, res, next){
	if(req.user.role != 'admin'){
		return res.status(403).json({"status":403, "message":"Not Authorized"});
	}
	next();
});

/** Routes that can be access only by authenticated & authorized users **/
router.get('/api/v1/admin/users', user.getAll);
router.get('/api/v1/admin/user/:id', user.getOne);
router.post('/api/v1/admin/user/', user.create);
router.put('/api/v1/admin/user/:id', user.update);
router.delete('/api/v1/admin/user/:id', user.delete);

module.exports = router;
