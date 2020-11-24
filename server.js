
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const uri =
	'mongodb+srv://dbUser:6unN2a7qWUwKTFpF@resume-data.6jeoc.mongodb.net/resume-builder?retryWrites=true&w=majority';
const { google } = require('googleapis');
const token = require('./token.json');
const credentials = require('./credentials.json');

const app = express();
const port = process.env.PORT || 8080;
//import axios from 'axios';

MongoClient.connect(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}).then((client) => api(client));

function authorize() {
	const { client_secret, client_id, redirect_uris } = credentials.installed;
	const oAuth2Client = new google.auth.OAuth2(
		client_id,
		client_secret,
		redirect_uris[0]
	);
	oAuth2Client.setCredentials(token);
	return oAuth2Client;
}

async function api(client) {
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
				res.send(response);
			})
			.catch((err) => {
				console.log('GET error', err);
				res.sendStatus(404);
			});
	});

	// add new user into database
	app.post('/', (req, res) => {
		//console.log(req.body.name);
		db.collection('users')
			.insertOne(req.body)
			.then(res.status(200).send('success'))
			.catch((err) => {
				console.log(err);
				res.status(500).send('Database Error');
			});
	});
	
	// delete user by email
	app.delete('/', (req, res) => {
		db.collection('users')
			.deleteOne({ email: req.data.email })
			.then(res.status(200).send('success'))
			.catch((err) => {
				console.log(err);
				res.status(500).send('Database Error');
			});
	});

	// update existing info
	app.put('/', (req, res) => {
		db.collection('users')
			.updateOne({ email: req.body.email }, { $set: req.body.data })
			.then(res.status(200).send('success'))
			.catch((err) => {
				console.log(err);
			});
	});

	app.post('/copy', async (req, res) => {
		let folderId = '1tI63lP4wLCHtjh8lZXYOIHsxXINljATn';
		let templateId = '1AeMo9OIXlWWTmKmh2vp2Q_4JXUtMsF1rjFjpDuY6C9w';
		const auth = await authorize();
		const drive = google.drive({ version: 'v3', auth });

		let copyTitle = `${req.body.name}_resume`;
		let request = {
			name: copyTitle,
			parents: [folderId],
		};

		drive.files.copy(
			{
				fileId: templateId,
				resource: request,
			},
			(err, driveResponse) => {
				if (err) {
					res.send(err);
					return;
				}
				let documentCopyId = driveResponse.data.id;
				res.send(driveResponse.data.id);
			}
		);
	});

	app.put('/update', async (req, res) => {
		const auth = await authorize();
		const docs = google.docs({
			version: 'v1',
			auth,
		});
		let reqData = [];
		let DOCUMENT_ID = req.body.id;
		for (element in req.body.data) {
			reqData.push({
				replaceAllText: {
					containsText: {
						text: `{{${element}}}`,
						matchCase: true,
					},
					replaceText: `${req.body.data[element]}`,
				},
			});
		}
		docs.documents.batchUpdate(
			{
				auth,
				documentId: DOCUMENT_ID,
				requestBody: {
					requests: reqData,
				},
			},
			(err, driveResponse) => {
				if (err) {
					console.log(err);
					res.status(500).send('BatchUpdate error');
					return;
				}
				res.status(200).send(driveResponse);
				return;
			}
		);
	});

	app.listen(port, () => {
		console.log(`Resume Builder server listening at http://localhost:${port}`);
	});
}
