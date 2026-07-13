# Marko App Starter

A [Marko](https://markojs.com) app powered by [@marko/run](https://github.com/marko-js/run), preconfigured with TypeScript, testing, and Storybook — ready to build on.

## Installation

```sh
npm init marko -- --template app
```

## Overview

- `src/routes` — file-based pages, layouts, and handlers ([routing docs](https://github.com/marko-js/run/#file-based-routing))
- `src/tags` — auto-discovered components, co-located with their tests and stories

## Scripts

- `npm run dev` — start the dev server
- `npm run build` then `npm start` — build and run the production server
- `npm test` — run tests with Vitest
- `npm run storybook` — develop components in Storybook
- `npm run lint` / `npm run format` — type-check, lint, and format
