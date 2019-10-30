var template = require('./template.marko');
var logoPath = require.resolve('./marko-logo.png');

module.exports = function(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    template.render({
        logo: logoPath
    }, res);
};