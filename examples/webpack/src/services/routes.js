var usersService = require('./users');

module.exports = function(app) {
    app.get('/services/users', function(req, res) {
        var pageIndex = req.query.pageIndex;
        if (typeof pageIndex === 'string') {
            pageIndex = parseInt(pageIndex, 10);
        } else {
            pageIndex = 0;
        }

        usersService.getUsers({ pageIndex: pageIndex })
            .then(function(data) {
                res.json(data);
            })
            .catch(function(err) {
                console.log(err);
                res.status(500).send('Unable to load users');
            });
    });
};