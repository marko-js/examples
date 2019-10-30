Marko + Redux
==================================

This sample illustrates how to use Marko with Redux. Redux is a general-purpose application state container. This sample app illustrates how easy it is to wire up a Marko UI component with a Redux store.

# Installation and running

```bash
npm install
npm start
```
# More details

The partial code snippet below shows how a a Marko UI component can be connected to a Redux store using the `store.subscribe()` method and the Marko `forceUpdate()` method:

```jsx
import store from '../store';

class {
    onMount() {
        store.subscribe(() => {
            // Force this UI component to rerender:
            this.forceUpdate();

            // The UI component will be rerendered using the new
            // state returned by `store.getState()`
            //
            // The following is another option to force an update:
            // this.input = store.getState();
        });
    }
}

<div>
    <counter(store.getState()) ... />
</div>
```

In the above example, the imported store module exports a Redux store created using the following code:

```js
var redux = require('redux');
var counter = require('./reducers');

module.exports = redux.createStore(counter);
```

# Server-side rendering

With Marko, we can also send the initial state of your Redux store from the server.

We can pass the initial state as a `global` variable, as shown in the following code:

```js
module.exports = function(req, res) {
  var value = parseInt(req.params.value);

  res.marko(view, {
    $global: {
      PRELOADED_STATE: {
        value: value,
      },
    },
  });
}
```

When we go to`localhost:8080/server-side/redux/123`, the `123` is used as the initial state of our redux store and passed to the client.

In our Marko component, we can use the initial state like so:

```jsx
import store from '../store';

class {
  onCreate(input, out) {
    // out.global is received from the $global object from route.js
    this.PRELOADED_STATE = out.global.PRELOADED_STATE;

    // create redux store on the server-side
    this.reduxStore = store.initialize(this.PRELOADED_STATE);
  }

  onMount() {
    // recreate redux store on the client-side
    this.reduxStore = store.initialize(this.PRELOADED_STATE);
    this.reduxStore.subscribe(() => {
      this.forceUpdate();
    });
  }

  dispatch(type) {
    this.reduxStore.dispatch({ type: type });
  }
}
```

In the above example, the imported store module is slightly different than the previous example. This module exports a Immediately-Invoked Function Expression (IFFE) which returns the Redux store. Using an IFFE allows us to create our Redux store with an initial state from the server, and share it with all other Marko components.
