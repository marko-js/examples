var redux = require('redux');
var counter = require('./reducers');

module.exports = redux.createStore(counter);