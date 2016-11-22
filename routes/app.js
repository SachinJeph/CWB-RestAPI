var AppModel = require('../models/app');
var uuid = require('node-uuid');
var shortid = require('shortid');

var apps = {
	getAll: function(req, res){
		conditions = {};
		if(req.user.role == 'user'){
			conditions['ownerId'] = req.user._id;
		};
		AppModel.find(conditions, function(err, appsResult){
			if(err){
                                return res.status(500).json({"status":500, "message":"Please Try Again", "error":err});
                        }

			if(!appsResult.length){
				return res.status(401).json({"status":401, "message":"no application found"});
			}

			return res.status(200).json({"status":200, "data":appsResult});
		});
	},
	getOne: function(req, res){
		conditions = {_id:req.params.id};
		if(req.user.role == 'user'){
			conditions['ownerId'] = req.user._id;
		}

		AppModel.find(conditions, function(err, appResult){
			if(err){
				return res.status(500).json({"status":500, "message":"Please Try Again", "error":err});
			}

			if(!appResult.length){
				return res.status(401).json({"status":401, "message":"application not found"});
			}

			return res.status(200).json({"status":200, "data":appResult});
		});
	},
	create: function(req, res){
		var appname = req.body.appname || '';

		if(appname == ''){
			return res.status(401).json({"status":401, "message":"Required Field Missing"});
		}

		var appData = new AppModel();
		appData.title = appname;
		appData.appSecrectKey = shortid.generate();
		appData.appClientId = uuid.v4();
		appData.ownerId = req.user._id;

		appData.save(function(err, result){
			if(err){
				return res.status(500).json({"status":500, "message":"Please Try Again", "error":err});
			}
			return res.status(200).json({"status":200, "message":"Your Application successfully created"});
		});
	},
	update: function(req, res){
		var updateUser = req.body;
		var id = req.params.id;
		data[id] = updateuser;
		res.json(updateuser);
	},
	delete: function(req, res){
		var id = req.params.id;
		data.splice(id, 1);
		res.json(true);
	}
};

var data = [{
	name: 'User 1',
	id: '1'
},{
	name: 'User 2',
	id: '2'
},{
	name: 'User 3',
	id: '3'
}];

module.exports = apps;
