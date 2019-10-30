require('marko/node-require').install();
require('marko/express'); //enable res.marko
require('lasso').configure('lasso-config.json')
var express = require('express');
var serveStatic = require('serve-static');
var indexTemplate = require('./src/components/app-root/app-root.marko');
var app = express();
var port = 8080;

app.use('/static', serveStatic(__dirname + '/static'));
app.get('/', function (req, res) {
    res.marko(indexTemplate, {
    });
});
app.listen(port, function () {
    console.log('Server started! Try it out:\nhttp://localhost:' + port + '/');
    if (process.send) {
        process.send('online');
    }
});
