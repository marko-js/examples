import Router from "url-router";

const entries = import.meta.globEager("./pages/*(!(components/*)*/)*.marko");
const routes = {};

for (const entry in entries) {
  routes[
    // Below we map file system paths to routes for all of the Marko files found.
    entry
      .replace(/^\.\/pages/, "") // remove ./pages prefix
      .replace(/\.[^\.]+$/, "") // remove extension
      .replace(/[/.]\$/g, "/:") // replace /$param and .$param with /:param
      .replace(/(?:\/index)+(\/|$)/g, "/") // replace /index with /
  ] = async (ctx) => {
    const body = (await entries[entry].default.render(ctx)).toString();
    return {
      statusCode: 200,
      headers: { "content-type": "text/html;charset=UTF-8" },
      body
    };
  };
}

export const router = new Router(routes);
