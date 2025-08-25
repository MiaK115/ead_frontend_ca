var http = require('http');
var url = require('url');
const { parse } = require('querystring');
var fs = require('fs');

// Load config and expose like your code expects
const config = require('./config/config.json');
global.gConfig = config;

// Common HTML bits
var header = '<!doctype html><html><head>';
var body = '</head><body><div id="container">' +
	'<div id="logo">' + global.gConfig.app_name + '</div>' +
	'<div id="space"></div>' +
	'<div id="form">' +
	'<form id="form" action="/" method="post"><center>' +
	'<label class="control-label">Name:</label>' +
	'<input class="input" type="text" name="name"/><br />' +
	'<label class="control-label">Ingredients:</label>' +
	'<input class="input" type="text" name="ingredients" /><br />' +
	'<label class="control-label">Prep Time:</label>' +
	'<input class="input" type="number" name="prepTimeInMinutes" /><br />';
var submitButton = '<button class="button button1">Submit</button></div></form>';
var endBody = '</div></body></html>';

http.createServer(function (req, res) {
	console.log(req.url);

	// quick healthcheck that doesn't hit backends
	if (req.url === '/healthz') {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		return res.end('ok');
	}
	// optional: ignore favicon noise
	if (req.url === '/favicon.ico') {
		res.writeHead(204);
		return res.end();
	}

	res.writeHead(200, { 'Content-Type': 'text/html' });

	var fileContents = fs.readFileSync('./public/default.css', { encoding: 'utf8' });
	res.write(header);
	res.write('<style>' + fileContents + '</style>');
	res.write(body);
	res.write(submitButton);

	var timeout = 0;

	// If POST, try saving new recipe first
	if (req.method === 'POST') {
		timeout = 2000;

		var myJSONObject = {};
		var qs = require('querystring');

		let body = '';
		req.on('data', chunk => { body += chunk.toString(); });
		req.on('end', () => {
			const post = qs.parse(body);
			myJSONObject.name = post.name;
			myJSONObject.ingredients = (post.ingredients || '').split(',');
			myJSONObject.prepTimeInMinutes = post.prepTimeInMinutes;

			const options = {
				hostname: global.gConfig.webservice_host,
				port: global.gConfig.webservice_port,
				path: '/recipe',
				method: 'POST'
			};

			const req2 = http.request(options, (resp) => {
				let data = '';
				resp.on('data', (chunk) => { data += chunk; });
				resp.on('end', () => {
					console.log('Data Saved!');
				});
			});

			// attach error handler immediately (connection errors, DNS, etc.)
			req2.on('error', (e) => {
				console.error('POST to backend failed:', e.message);
			});

			req2.setHeader('content-type', 'application/json');
			req2.write(JSON.stringify(myJSONObject));
			req2.end();
		});
	}

	// Always render the list afterward (POST or GET)
	if (req.method === 'POST') {
		res.write('<div id="space"></div>');
		res.write('<div id="logo">New recipe saved successfully! </div>');
		res.write('<div id="space"></div>');
	}

	// Brief delay to let POST finish before reading
	setTimeout(function () {
		const options = {
			hostname: global.gConfig.webservice_host,
			port: global.gConfig.webservice_port,
			path: '/recipes',
			method: 'GET'
		};

		const reqGet = http.request(options, (resp) => {
			let data = '';
			resp.on('data', (chunk) => { data += chunk; });
			resp.on('end', () => {
				res.write('<div id="space"></div>');
				res.write('<div id="logo">Your Previous Recipes</div>');
				res.write('<div id="space"></div>');
				res.write('<div id="results">Name | Ingredients | PrepTime');
				res.write('<div id="space"></div>');

				let myArr = [];
				try { myArr = JSON.parse(data); } catch (e) { myArr = []; }

				let i = 0;
				while (i < myArr.length) {
					res.write(myArr[i].name + ' | ' + myArr[i].ingredients + ' | ');
					res.write(myArr[i].prepTimeInMinutes + '<br/>');
					i++;
				}
				res.write('</div><div id="space"></div>');
				res.end(endBody);
			});
		});

		// IMPORTANT: don't crash if backend isn't reachable
		reqGet.on('error', (e) => {
			console.error('GET /recipes failed:', e.message);
			res.write('<div id="space"></div>');
			res.write('<div id="logo">Your Previous Recipes</div>');
			res.write('<div id="space"></div>');
			res.write('<div id="results">Backend unavailable right now. Try again later.</div>');
			res.end(endBody);
		});

		reqGet.end();
	}, timeout);

}).listen(global.gConfig.exposedPort);
