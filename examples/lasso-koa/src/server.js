import Koa from "koa";
import mount from "koa-mount";
import serve from "koa-static";
import Router from "koa-router";
import { configure } from "lasso";
import homePage from "./pages/home";

// Configure lasso to control how JS/CSS/etc. is delivered to the browser
const isProduction = process.env.NODE_ENV === "production";
configure({
  plugins: [
    "lasso-marko" // Allow Marko templates to be compiled and transported to the browser
  ],
  minify: isProduction, // Only minify JS and CSS code in production
  bundlingEnabled: isProduction, // Only enable bundling in production
  fingerprintsEnabled: isProduction // Only add fingerprints to URLs in production
});

const router = new Router()
  .get("/", homePage);

new Koa()
  .use(mount("/static", serve("static")))
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(process.env.PORT || 8080, function () {
    console.log(
      "Server started! Try it out:\nhttp://localhost:" +
        this.address().port +
        "/"
    );

    if (process.send) {
      process.send("online");
    }
  });
