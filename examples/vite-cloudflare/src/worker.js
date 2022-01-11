import { getAssetFromKV, NotFoundError } from "@cloudflare/kv-asset-handler";
import { router } from "./router";

addEventListener("fetch", (event) => {
  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    return await getAssetFromKV(event);
  } catch (err) {
    if (err instanceof NotFoundError) {
      const { request } = event;
      const url = new URL(request.url);
      const match = router.find(url.pathname);

      if (match) {
        const { handler, params } = match;
        return handler({
          url,
          params,
          request,
        });
      }

      return new Response(null, { status: 404 });
    }

    return new Response(null, { status: 500 });
  }
}
