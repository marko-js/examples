---
type: dx
impact: med
effort: low
site: examples/app/vitest.config.ts › projects
---

# Document the app starter's `*.server.test.ts` / `*.browser.test.ts` naming rule

Both projects in the starter's `vitest.config.ts` narrow `include` to `src/**/{,*.}server.test.ts` and `src/**/{,*.}browser.test.ts`, so a file named with vitest's own default convention — `foo.test.ts` — matches no project and is skipped without a word. The run still reports `Test Files 1 passed` and exits 0, so a test written that way looks green while never executing, which is a quiet way to ship a regression. `README.md` documents `npm test` but never mentions the naming rule. Name the convention in the README, and consider a third project whose `include` catches stray `*.test.ts` and fails.

Check: add `src/tags/char-count/probe.test.ts` containing `test("x", () => { expect(1).toBe(2); })` to `examples/app` and run `npx vitest run --project=server` — today it prints `Test Files  1 passed (1)` and exits 0; the stray file should either run or be reported.
