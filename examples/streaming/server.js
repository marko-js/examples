require('marko/node-require').install();

var express = require('express');

var indexTemplate = require('./src/pages/index.marko');
var app = express();
var port = 8080;

app.get('/', function (req, res) {
    indexTemplate.render({}, res);
});

app.use(express.static('public'));

app.listen(port, function () {
    console.log('Server started! Try it out:\nhttp://localhost:' + port + '/');

    if (process.send) {
        process.send('online');
    }
});
