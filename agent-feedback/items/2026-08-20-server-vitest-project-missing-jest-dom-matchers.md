---
type: bug
impact: high
effort: low
site: examples/app/tsconfig.json › compilerOptions.types (and examples/library/tsconfig.json › compilerOptions.types, compilerOptions.lib)
---

# Register jest-dom matchers and scope the DOM lib in the app and library starters' `server` vitest projects

`examples/app` lists `@vitest/browser/matchers` in the global tsconfig `types`, so `mtc` accepts `expect(el).toHaveTextContent(...)` in a `*.server.test.ts`, but the `server` project in `vitest.config.ts` runs in `environment: "node"` and never registers those matchers, so the assertion dies with `Error: Invalid Chai property: toHaveTextContent`. The shipped `src/tags/char-count/server.test.ts` only calls `toMatchSnapshot()`, so the trap stays invisible until someone copies an assertion out of the sibling `browser.test.ts`, where the same matcher works. `npm run lint` stays green throughout, so the type checker vouches for code that cannot run. Either register `@testing-library/jest-dom/vitest` from a setup file on the `server` project, or move the `types` entry onto the browser project so type-checking tells the truth.

`examples/library` ships the identical tsconfig `types` and the same two-project `vitest.config.ts`, so the trap is in that template too, and there it reaches past the matchers: `lib: ["dom", "ESNext"]` types the DOM globals for every file, so `document` type-checks inside a `*.server.test.ts` and then throws `ReferenceError: document is not defined` under `environment: "node"`. Two things to know before fixing it: a `server` `setupFiles` importing `@testing-library/jest-dom/vitest` makes `toHaveAttribute` pass but leaves `toBeInTheDocument` failing with `element could not be found in the document`, and that package is only a transitive dependency in both templates; and deleting `"dom"` from the root `lib` outright produces `Cannot find name 'Node'`, so the DOM lib and the matcher `types` entry belong on a browser-scoped tsconfig rather than being dropped.

Check: add `expect(screen.getByRole("textbox")).toHaveAttribute("name", "demo")` to a `*.server.test.ts` under `examples/app/src`; today `npx mtc` exits 0 and `npx vitest run --project=server` fails with `Error: Invalid Chai property: toHaveAttribute`. After the fix one of the two must flip.

Check: `cp -r examples/library /tmp/lib && cd /tmp/lib && npm install`, then append to `src/tags/counter/server.test.ts` a test that renders a story and asserts `expect(screen.getByRole("button")).toHaveAttribute("type", "submit")`; today `npx mtc` exits 0 and `CI=true npx vitest run --project=server` fails with `Error: Invalid Chai property: toHaveAttribute`. Swap that assertion for `expect(document.body).toBeTruthy()` and `mtc` still exits 0 while the run fails with `ReferenceError: document is not defined`.
