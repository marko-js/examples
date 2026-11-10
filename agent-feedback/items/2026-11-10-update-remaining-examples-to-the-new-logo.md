---
type: cleanup
impact: low
effort: low
site: examples/*-marko-5 › sample-header, app-layout
---

# Update the remaining examples to the new Marko logo and favicon

`examples/basic`, `examples/app`, `examples/vite-express`, and the todomvc, color-picker and tic-tac-toe examples use the new logomark (`examples/basic/src/routes/logo.svg`, the same artwork as the website's `public/assets/logomark.svg`) and the new `favicon.png`. The other Marko 5 examples still ship the old artwork, so a project created from them shows the old branding:

- Old logo: `basic-marko-5/src/routes/logo.svg`, `vite-cloudflare-marko-5/src/pages/logo.svg`, `vite-fastify-marko-5/src/pages/index/logo.svg`, `vite-http-marko-5/src/logo.svg`, `rollup-express-marko-5` and `vite-express-marko-5` `src/components/sample-header/marko.png`, `webpack-express-marko-5` and `webpack-fastify-marko-5` `src/components/sample-header/logo.png`.
- Old favicon: `basic-marko-5/src/routes/favicon.png` and the `app-layout/favicon.png` of every other `-marko-5` example.

Copy in `examples/basic/src/routes/logo.svg` and `favicon.png`, and adjust each header's size (the new mark is 347×191), then build and view each example.

Check: `md5sum examples/*/src/routes/favicon.png examples/*/src/*/app-layout/favicon.png` lists two hashes, the new one only for `app`, `basic` and `vite-express`; `cmp examples/basic/src/routes/logo.svg examples/vite-http-marko-5/src/logo.svg` reports a difference.
