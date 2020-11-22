const { google } = require('googleapis');
const token = require('./token.json');
const credentials = require('./credentials.json');
//import axios from 'axios';

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

async function update(DOCUMENT_ID) {
	const auth = await authorize();
	const docs = google.docs({
		version: 'v1',
		auth,
	});
	await docs.documents.batchUpdate(
		{
			auth,
			documentId: DOCUMENT_ID,
			requestBody: {
				requests: [
					{
						replaceAllText: {
							containsText: {
								text: 'George',
								matchCase: true,
							},
							replaceText: 'banana',
						},
					},
				],
			},
		},
		(err, { data }) => {
			if (err) return console.log('The API returned an error: ' + err);
			console.log(data);
		}
	);
}

async function copy(DOCUMENT_ID, filename) {
	var copyTitle = `${filename}_resume`;
	let request = {
		name: copyTitle,
	};
	const auth = await authorize();
	const drive = google.drive({ version: 'v3', auth });
	drive.files.copy(
		{
			fileId: DOCUMENT_ID,
			resource: request,
		},
		(err, driveResponse) => {
			let documentCopyId = driveResponse.data.id;
			return driveResponse;
		}
	);
}

module.exports = { update, copy };
