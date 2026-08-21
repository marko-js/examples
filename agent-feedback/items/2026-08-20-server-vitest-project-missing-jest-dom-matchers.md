---
type: bug
impact: high
effort: low
site: examples/app/tsconfig.json › compilerOptions.types
---

# Register jest-dom matchers in the app starter's `server` vitest project

`examples/app` lists `@vitest/browser/matchers` in the global tsconfig `types`, so `mtc` accepts `expect(el).toHaveTextContent(...)` in a `*.server.test.ts`, but the `server` project in `vitest.config.ts` runs in `environment: "node"` and never registers those matchers, so the assertion dies with `Error: Invalid Chai property: toHaveTextContent`. The shipped `src/tags/char-count/server.test.ts` only calls `toMatchSnapshot()`, so the trap stays invisible until someone copies an assertion out of the sibling `browser.test.ts`, where the same matcher works. `npm run lint` stays green throughout, so the type checker vouches for code that cannot run. Either register `@testing-library/jest-dom/vitest` from a setup file on the `server` project, or move the `types` entry onto the browser project so type-checking tells the truth.

Check: add `expect(screen.getByRole("textbox")).toHaveAttribute("name", "demo")` to a `*.server.test.ts` under `examples/app/src`; today `npx mtc` exits 0 and `npx vitest run --project=server` fails with `Error: Invalid Chai property: toHaveAttribute`. After the fix one of the two must flip.
