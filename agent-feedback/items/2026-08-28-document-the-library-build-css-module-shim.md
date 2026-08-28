---
type: dx
impact: med
effort: low
site: examples/library/README.md
---

# Document the library build's `.css.js` stylesheet shim and the `sideEffects` entry it needs

`npm run build` emits, per tag, `dist/tags/<tag>/styles.module.dist.css` plus a `styles.module.css.js` shim (`import "./styles.module.dist.css"; export default {...}`), while the emitted `dist/tags/<tag>/index.marko` still reads `import styles from "./styles.module.css"` and resolves onto that shim only by extension probing. Neither `README.md` nor anything else in the template names that layout, and `postcss-auto-modules` is the only clue. The template ships no `sideEffects` field, so it is safe as generated, but a library author who adds the conventional `"sideEffects": false` or `["**/*.marko", "**/*.css"]` marks the shim pure, the bundler drops it together with the only import of that tag's stylesheet, and every tag whose class map is referenced only from server-rendered markup loses all its styling in every consumer, with build exit 0 and no warning. Document what the build emits, and state that a `sideEffects` list here must include `**/*.css.js`. The upstream guard belongs to @marko/vite, whose `marko-vite:post` transform forces no-treeshake for ids matching `/\.module\.[^.]+(?:\?|$)/`, a pattern that matches `styles.module.css` but not `styles.module.css.js`.

Check: `cd examples/library && npm install && npm run build && head -1 dist/tags/counter/index.marko && ls dist/tags/counter` shows `import style from "./styles.module.css";` beside only `styles.module.css.d.ts`, `styles.module.css.js` and `styles.module.dist.css`. In a vite app consuming a package built from this template, add `"sideEffects": ["**/*.marko", "**/*.css"]` (or `false`) to the library's `package.json` and `npm run build`: for a tag whose class map is used only in static `class=styles.x` positions, its hashed class names disappear from the emitted CSS (`cat dist/assets/*.css | grep -c _tabs_` prints 0 against 5 with the field removed), build exit 0, no warning. Appending `"**/*.css.js"` restores them.
