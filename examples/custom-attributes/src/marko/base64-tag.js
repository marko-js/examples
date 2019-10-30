var fs = require('fs');
var mime = require('mime');

var cache = {};

module.exports = function(input, out) {
    var imagePath = input.path;

    var dataUrl = cache[imagePath];
    if (dataUrl) {
        input.renderBody(out, dataUrl);
        return;
    }

    var asyncOut = out.beginAsync();
    fs.readFile(imagePath, function(err, data) {
        if (err) {
            asyncOut.error(err).end();
            return;
        }

        dataUrl = cache[imagePath] = 'data:' + mime.lookup(imagePath) + ';' + 'base64' + ',' + data.toString('base64');
        input.renderBody(asyncOut, dataUrl);
        asyncOut.end();
    });
};