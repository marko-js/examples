var view = require('./index');

module.exports = function(req, res) {
    /*
     * We can create the initial state of the redux store on the server.
     * In this example, the initial state of our store is retrieved from
     * the request parameters.
     */
    var value = parseInt(req.params.value);

    res.marko(view, {
      $global: {
        PRELOADED_STATE: {
          value: value,
        },
      },
    });
};
