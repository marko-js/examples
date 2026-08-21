---
type: dx
impact: med
effort: low
site: examples/app/.gitignore
---

# Ignore vitest browser failure screenshots and attachments in the app starter

A failing test in the starter's `browser` project writes a PNG into the source tree at `src/tags/<tag>/__screenshots__/<name>.browser.test.ts/<test-name>-1.png`, and a second copy under `.vitest-attachments/` at the project root. Neither path is in `.gitignore`, and `.prettierignore` lists `__snapshots__` but not `__screenshots__`, so a red test leaves binaries staged for commit that survive until deleted by hand. Add `__screenshots__` and `.vitest-attachments` to `.gitignore`.

Check: make `examples/app/src/tags/char-count/browser.test.ts` assert the wrong count and run `CI=true npx vitest run --project=browser`; today `git check-ignore src/tags/char-count/__screenshots__ .vitest-attachments` exits 1 and both show up as untracked. After the fix it exits 0.
