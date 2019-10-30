var redux = require('redux');
var counter = require('./reducers');

/*
 * We use an Immediately-Invoked Function Expression (IIFE) to hold our
 * redux store. This allows us to create a store client-side using the
 * preloaded state from the server.
 */
module.exports = (function() {
  var store;

  function initialize(preloadedState) {
    store = redux.createStore(counter, preloadedState);
    return store;
  }

  function getStore() {
    return store;
  }

  return {
    initialize: initialize,
    getStore: getStore,
  };
})();
