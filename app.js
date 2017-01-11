//Import Mdules
const sequelize = require('sequelize')
const express = require ('express')
const app = express()
const pg = require ('pg')
const bodyParser = require ('body-parser')
var session = require('express-session');
var bcrypt = require('bcrypt');


//set views
app.set('view engine', 'pug')
app.set('views', __dirname + "/views")


//middleware
app.use('/resources',express.static(__dirname + '/static'))
app.use(bodyParser.urlencoded({extended:true}))
app.use(session({
	secret: 'random stuff',
	resave: true,
	saveUninitialized: false
}));

//Define database structure

let db = new sequelize('blogapp', 'sergioreyesgomezdeliano', 'mypassword', {
	server:'localhost',
	dialect: 'postgres'
})


//Create tables
let User = db.define('user', {
	name: sequelize.STRING,
	email: sequelize.STRING,
	password: sequelize.STRING
})

let Message = db.define('message', {
	title: sequelize.STRING
})

let Comment = db.define('comment', {
	messagebox: sequelize.STRING
})

//Define relations
User.hasMany(Message)
Message.belongsTo(User)

Message.hasMany(Comment);
Comment.belongsTo(Message);

User.hasMany(Comment);
Comment.belongsTo(User);



app.get('/', function (request, response) {
	Message.findAll({
	}).then(show =>{
		response.render('index', {
			message: request.query.message,
			user: request.session.user
		})
	});
});

app.get('/profile', function (request, response) {
	var user = request.session.user;
	if (user === undefined) {
		response.redirect('/?message=' + encodeURIComponent("Please log in to view your profile."));
	} else {
		Message.findAll({
			where: {
				userId: request.session.user.id
			}
		})
		.then(post =>{
			response.render('profile', {
				message: post, user
			})
		})
	}
});

app.post('/login', bodyParser.urlencoded({extended: true}), function (request, response) {
	if(request.body.email.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your email address."));
		return;
	}

	if(request.body.password.length === 0) {
		response.redirect('/?message=' + encodeURIComponent("Please fill out your password."));
		return;
	}

	User.findOne({
		where: {
			email: request.body.email
		}
	}).then(function (user) {
		var hash = user.password

		bcrypt.compare(request.body.password, hash, (err, res) => { 
		if (user !== null && res == true) {
			request.session.user = user
			response.redirect('/profile')
			console.log(hash)

			// (user !== null && request.body.password === user.password) {
			// request.session.user = user;
			// response.redirect('/profile');
			

		} else {
			response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
		}
	})
	}, function (error) {
		response.redirect('/?message=' + encodeURIComponent("Invalid email or password."));
	});
});

app.get('/logout', function (request, response) {
	request.session.destroy(function(error) {
		if(error) {
			throw error;
		}
		response.redirect('/?message=' + encodeURIComponent("Successfully logged out."));
	})
});

app.get('/register', (req,res) => {
	res.render('register')
})

app.post('/register', (req,res) => {

	bcrypt.hash(req.body.password, 5, function(err,hash){
		console.log(hash)

		User.create({
			name: req.body.name,
			email: req.body.email,
			password: hash
		})
		res.redirect('/')
	})
})


app.post('/userpost', (req, res) => {
	
	User.findOne({
		where: {
			id: req.session.user.id
		}
	}).then( (user) =>{
		user.createMessage({
			title: req.body.header
		}).then( post =>{
			res.redirect('/profile')
		})
	})
})

app.get('/board', (req,res)=>{
	var user = req.session.user

	Message.findAll({
		include: [{
			model: Comment,
			include: [User]
		}, {
			model: User
		}]
	}).then( post => {
		res.render('board', {
			user: user,
			message: post,
		})
	})
})

app.post('/comment', (req,res) => {
	User.findOne({
		where: {
			id: req.session.user.id
		} 
	}).then((user)=>{	
		user.createComment({
			messagebox: req.body.comment,
			messageId: req.body.id
		})
	}).then(post =>{
		res.redirect('board')
	})
})

db.sync({force: false}).then(db => {
	console.log('We synced bruh!')
})

app.listen(1337,() => {
	console.log('Up and Running at port 1337!')
})