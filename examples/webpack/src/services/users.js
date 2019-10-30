var mockUsersData = require('./mock-users-data.json');

const pageSize = 10;

exports.getUsers = function(options) {
    var pageIndex = options.pageIndex || 0;
    var start = pageIndex * pageSize;

    var users = [];

    for (var i=start; i<start+pageSize; i++) {
        users.push(mockUsersData[i % mockUsersData.length]);
    }

    var results = {
        pageIndex: pageIndex,
        totalMatches: mockUsersData.length,
        users: users
    };

    return new Promise((resolve, reject) => {
        setTimeout(function() {
            resolve(results);
        }, 1000);
    });
};