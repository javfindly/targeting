var express = require('express');
var bodyParser = require('body-parser')
var app = express();
var router = require('./conf/UrlMapper.js').router;

app.use(express.static('web'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/',router);

var server = app.listen(3000, function() {
	console.log('Listening on port %d', server.address().port);
});