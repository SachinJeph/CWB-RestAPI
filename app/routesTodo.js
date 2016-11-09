// Models
var Todo = require('./models/todo');

// Get all todos
function getTodos(res){
	Todo.find(function(err, todos){
		if(err) res.send(err); // return if there any error
		res.json(todos); // return all todos in JSON format
	});
}

// API Routes
module.exports = function(app){
	// get all todos
	app.get('/api/todos', function(req, res){
		getTodos(res);
	});

	// create todo and send back all todos after creation
	app.post('/api/todos', function(req, res){
		var todoData = new Todo({
			text: req.body.text,
			done: false
		});
		todoData.save(function(err, todoData){
			if(err) res.send(err);
			// get and return all todos after adding another todo
			getTodos(res);
		});
	});

	// delete a todo
	app.delete('/api/todos/:todo_id', function(req, res){
		Todo.remove({
			_id: req.params.todo_id
		}, function(err, todo){
			if(err) res.send(err);
			// get and return all todos after delete
			getTodos(res);
		});
	});
};
