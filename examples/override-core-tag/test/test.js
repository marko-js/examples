require('marko/node-require');

var template = require('./template.marko');

template.render()
    .then(function(renderResult) {
        console.log(renderResult.getOutput());
    })
    .catch(function(err) {
        console.error(err);
        process.exit(1);
    });