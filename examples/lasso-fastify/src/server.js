import path from "path";
import fastify from "fastify";
import fastifyStatic from "fastify-static";
import fastifyMarko from "@marko/fastify";
import { configure } from "lasso";
import homePage from "./pages/home";

// Configure lasso to control how JS/CSS/etc. is delivered to the browser
const outputDir = path.resolve("static");
const isProduction = process.env.NODE_ENV === "production";
configure({
  plugins: [
    "lasso-marko" // Allow Marko templates to be compiled and transported to the browser
  ],
  outputDir, // Place all generated JS/CSS/etc. files into the "static" dir
  minify: isProduction, // Only minify JS and CSS code in production
  bundlingEnabled: isProduction, // Only enable bundling in production
  fingerprintsEnabled: isProduction // Only add fingerprints to URLs in production
});

fastify()
  .register(fastifyStatic, {
    root: outputDir,
    prefix: "/static"
  })
  .register(fastifyMarko)
  .get("/", homePage)
  .listen({ port: 3000 }, (err, address) => {
    if (err) {
      throw err;
    }

    console.log(`Server listening on ${address}`);
  });
