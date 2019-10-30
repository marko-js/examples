var view = require('./index');

module.exports = function(req, res) {
    res.marko(view, {});
};