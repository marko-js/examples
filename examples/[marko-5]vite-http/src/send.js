import zlib from "zlib";
import vary from "vary";
import accepts from "accepts";

const lookup = {
  br: zlib.createBrotliCompress,
  gzip: zlib.createGzip,
  deflate: zlib.createDeflate
}
const supported = Object.keys(lookup);

// Helper to automatically compress a stream if the client supports it
// and pipe it to a server response.
export function send(res, stream, opts) {
  const encoding = accepts(res.req).encodings(supported);
  const create = lookup[encoding];

  vary(res, "Accept-Encoding");

  if (create) {
    const compress = create(opts?.[encoding]);
    stream.flush = compress.flush.bind(compress); // Expose a flush to the Marko stream
    res.setHeader("Content-Encoding", encoding);
    stream.pipe(compress).pipe(res);
  } else {
    stream.pipe(res);
  }
}
