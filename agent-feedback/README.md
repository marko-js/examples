# Agent Feedback

Actionable observations that were out of scope for the task that surfaced them. In scope: fix it. Out of scope: file it here. Never expand a task's diff to fix an item recorded here.

One item per file in `items/`, named `YYYY-MM-DD-<slug>.md`.

## When to file

Anything a future contributor should act on:

- `bug`: a suspected defect left unpursued
- `cleanup`: duplication, dead code, inconsistency, refactor opportunity
- `perf`: speed, memory, payload or bundle size, build time
- `dx`: friction in builds, tests, tooling, or repo workflows
- `unclear`: code or docs that were confusing, and what would have clarified them

## Rules

1. **Verify first.** A guess is not feedback. Every item ends with a check that reproduces the claim.
2. **Dedupe first.** `grep -ril '<path or symbol>' agent-feedback/items`. If a file covers it, edit that file only when you add new information.
3. **Check the code site.** An intent comment there means the behavior is deliberate. Do not file it.
4. **Self-contained.** Paths, symbols, reasoning. Never reference conversation context or "earlier analysis".
5. **Cite by stable symbol**, never line number.
6. **State the defect and the check.** Never describe what works. Never narrate a landed fix.
7. **Direction is preventive for `unclear` and `dx`.** Name what would have stopped the trip: a comment, a doc line, a lint rule, a compile error, a debug-only warning. The goal is that the next agent does not hit it.
8. **Resolve by deleting the file in the same PR as the fix.** A partial fix rewrites the file to what remains.
9. **Won't-fix is a maintainer's call, never an agent's.** Add a comment (two lines max) at the code site stating the behavior and why it is deliberate, then delete the file. The comment is what stops re-filing. Never consult git history to learn whether something was resolved; if it is not in `items/` and not commented at the site, it is unresolved.

## Item format

`items/YYYY-MM-DD-<slug>.md`:

```md
---
type: bug | cleanup | perf | dx | unclear
impact: high | med | low
effort: high | med | low
site: <path/to/file.ts> › <nearestStableSymbol>
---

# <one-line imperative title>

<2-6 sentences: the problem, why it matters, a concrete direction. Cut evidence a fixer can re-derive from the site.>

Check: <command, input, or observation that reproduces the claim>
```

`impact`: what breaks or is lost if ignored. `effort`: expected size of the fix. Both are the filer's estimate; triage re-judges.

## Repo notes

A collection of standalone example projects under `examples/<name>/`, each with its own manifest and lockfile. There is no root package, no shared build, and no CI. `npm init marko` downloads one of these directories and installs it, so each example must stand on its own.

**Reproduce a claim.** Work inside the one example directory: install its dependencies, then run the script the example's `README.md` names (usually `dev`, `build`, or `test`). State which example in the item; a claim about `examples/basic` says nothing about `examples/vite-express`.

**Guard tests.** Most examples have no test suite. The practical guard is that the example still installs and builds from a clean checkout, so the check line for an item here is normally the install plus build command for that directory.

**Pre-ship.** Build the example you touched from a clean `node_modules`. If a change applies to several examples, say which ones you verified and which you did not.

**Gotchas.** Examples pinned to Marko 5 are named with a `-marko-5` suffix; the unsuffixed ones target Marko 6. Do not port a Marko 5 example to 6 as a side effect of an unrelated fix. Examples deliberately duplicate boilerplate so each is self-contained: duplication across example directories is not a cleanup item.
