import { router } from "./router";

exports.handler = async function (event, context) {
  console.log(`Received new request: ${event.path}`);

  const { request } = event;
  const url = new URL(request.url);
  if (!url.includes(".")) {
    const match = router.find(url.pathname);
    if (match) {
      const { handler, params } = match;
      return handler({
        url,
        params,
      });
    }

    return {
      statusCode: 404,
      body: "Not Found",
    };
  }
};