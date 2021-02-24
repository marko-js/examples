import { matchesUA } from "browserslist-useragent";

// This middleware tells Marko which client assets (modern or legacy) to use.

export default (request, reply, next) => {
  // reply.locals is equivalent to passing `$global` (https://markojs.com/docs/rendering/#global-data)
  // `buildName` is needed to tell @marko/webpack which build assets to use. (https://github.com/marko-js/webpack/#multiple-client-side-compilers)
  // It maps directly to `options.name` in the `webpack.config.js`.
  reply.locals.buildName = `browser:${
    matchesUA(request.headers["user-agent"], {
      env: "modern",
      allowHigherVersions: true
    })
      ? "modern"
      : "legacy"
  }`;

  next();
};
