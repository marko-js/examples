require('whatwg-fetch');

exports.getUsers = function(options) {
    return fetch('/services/users?pageIndex=' + (options.pageIndex || 0))
        .then(function(response) {
            return response.json();
        });
};