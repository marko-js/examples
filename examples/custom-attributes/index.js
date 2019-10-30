require('marko/node-require').install();

var express = require('express');
var app = express();

app.get('/', require('./src/pages/home'));

var port = 8080;

app.listen(port, function() {
    console.log('Listening on port ' + port + '!');
    console.log('Try loading http://localhost:' + port + '/');
});