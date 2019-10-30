require('marko/node-require').install();
require('marko/express'); //enable res.marko

var express = require('express');

var indexTemplate = require('./src/pages/index.marko');
var app = express();
var port = 8080;

var isProduction = process.env.NODE_ENV === 'production';

// Configure lasso to control how JS/CSS/etc. is delivered to the browser
require('lasso').configure({
    plugins: [
        'lasso-marko' // Allow Marko templates to be compiled and transported to the browser
    ],
    outputDir: __dirname + '/static', // Place all generated JS/CSS/etc. files into the "static" dir
    bundlingEnabled: isProduction, // Only enable bundling in production
    minify: isProduction, // Only minify JS and CSS code in production
    fingerprintsEnabled: isProduction, // Only add fingerprints to URLs in production
});


app.use(require('lasso/middleware').serveStatic());

app.get('/', function(req, res) {
    res.marko(indexTemplate, {
            name: 'Frank',
            count: 30,
            colors: ['red', 'green', 'blue']
        });
});

app.listen(port, function() {
    console.log('Server started! Try it out:\nhttp://localhost:' + port + '/');

    if (process.send) {
        process.send('online');
    }
});
