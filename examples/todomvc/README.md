# TodoMVC

A [TodoMVC](https://todomvc.com) app built with Marko and [@marko/run](https://github.com/marko-js/run).

```
npm init marko -- --template todomvc
cd marko-app
npm install
npm run dev
```

The app lives in [`src/tags`](./src/tags):

- `<todomvc-app>` owns the list of todos in a `<let>` and derives the counts with `<const>`. The active filter follows the location hash (`#/active`), kept in sync by a `<script>` that listens for `hashchange` and stops listening through `$signal`.
- `<todomvc-main>` receives the todos with two-way binding (`todos:=todos`) and passes each change back up by calling `todosChange` with a new array.
- `<todomvc-todo-item>` keeps its editing state to itself, and focuses the edit field with a `<script>` once editing starts.
- The styles come from the [`todomvc-app-css`](https://www.npmjs.com/package/todomvc-app-css) package, imported in `<todomvc-app>`.
