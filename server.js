const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const uri =
	'mongodb+srv://dbUser:6unN2a7qWUwKTFpF@resume-data.6jeoc.mongodb.net/resume-builder?retryWrites=true&w=majority';

const app = express();
//const gclient = require('./gClient.js');
const port = process.env.PORT || 3000

MongoClient.connect(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then((client) => {
	const db = client.db('resume-data');

	app.use((req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
		res.header(
			'Access-Control-Allow-Headers',
			'Origin, X-Requested-With, Content-Type, Accept, Authorization'
		);
		next();
	});

	app.use(express.json());

	// get user info from database
	app.get('/', (req, res) => {
		db.collection('users')
			.findOne(req.query)
			.then((response) => {
				console.log(response);
				res.status(200).send('success');
			})
			.catch((err) => {
				console.log(err);
				res.sendStatus(404);
			});
	});

	// add new user into database
	app.post('/', (req, res) => {
		//console.log(req.body.name);
		db.collection('users').insertOne(req.body);
		res.status(200).send('success');
	});

	// Archit new:

	// update existing info
	app.put('/', (req, res) => {
		db.collection('users').updateOne(
			{ name: req.body.email },
			{ $set: req.body.data }
		);
		res.status(200).send('success');
	});

	app.post('/copy', (req, res) => {
		res.status(200).send('success');
		/*let template_id = '1AeMo9OIXlWWTmKmh2vp2Q_4JXUtMsF1rjFjpDuY6C9w';
		gclient.copy(template_id, req.body.name).then((res) => {
			console.log(res);
		}).catch((err) => {
			console.log(err);
		});*/
	});

	app.listen(port, () => {
		console.log(`Resume Builder listening on https://comp426-resume-builder.herokuapp.com`);
	});
});
