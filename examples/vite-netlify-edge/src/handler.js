import staticFiles from '@static-manifest';
import { router } from "./router";

export const handler = async (request) => {
  // Handle static files

  const { pathname } = new URL(request.url)

  // If your framework generates client assets in a subdirectory, you can add these too
  if (staticFiles.includes(pathname) || pathname.startsWith('assets/')) {
    return
  }

  try {
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
  } catch (err) {
    return new Response(err.message || 'Internal Server Error', {
      status: err.status || 500,
    })
  }
}
