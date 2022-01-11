Marko w/ Vite + Cloudflare Workers
==================================

## Getting Started
```bash
npm install
npm run dev
```

## Production Preview
First you'll need to authenticate with `cloudflare` and install the [`wrangler cli`](https://developers.cloudflare.com/workers/cli-wrangler). If you've not already done this, follow [the cloudflare workers getting started guide through step 3](https://developers.cloudflare.com/workers/get-started/guide#3-configure-the-workers-cli).

```bash
npm run preview
```

## Routing
This simple example comes with file system based routing implemented using [Vite's glob imports](https://vitejs.dev/guide/features.html#glob-import). It follows similar conventions to [Remix](https://remix.run/docs/en/v1/guides/routing#review).

Any top level `.marko` file under the `./src/pages` directory will automatically be served according to it's path on disk.
We automatically exclude any `components` directories.

For dynamic routes you can prefix the file/folder name with `$`. Or to save creating a folder use an extension that starts with a `$`.
`index` folders and files are also stripped from the path being matched.

Here are some example file system paths, and what their route format ultimately becomes.

```bash
# Static routes
./pages/index.marko => /
./pages/story.marko => /story
./pages/story/index.marko => /story

# Dynamic routes
./pages/story/$id.marko => /story/:id
./pages/story.$id.marko => /story/:id
```

The `input` for the page component will be an object like the following:

```js
{
  url: new URL(...), // a URL instance for the current request.
  request: new Request(...), // The current Request object.
  params: { ... } // An object containing all matched params for the dynamic paths.
}
```

## Common Template for multiple routes
Sometimes you may want to have the same `.marko` component used for multiple routes in your application.
Typically this is done to make the URL a bit prettier and it may be best to simply use a query string or other mechanism instead of multiple pathnames.

However this can be done simply by creating a `.js` file at the alternative paths and re-exporting the `.marko` component from there.

```js
import Template from "./another-template-path.marko";
export { Template as default };
```
