import express from "express";
import compressionMiddleware from "compression";
import markoMiddleware from "@marko/express";
import indexPage from "./pages/index";
import usersService from "./services/users";

const port = parseInt(process.env.PORT || 3000, 10);

express()
  .use(compressionMiddleware()) // Enable gzip compression for all HTTP responses.
  .use("/assets", express.static("dist/assets")) // Serve assets generated from webpack.
  .use(markoMiddleware()) // Enables res.marko.
  .get("/", indexPage)
  .get("/services/users", usersService)
  .listen(port, err => {
    if (err) {
      throw err;
    }

    if (port) {
      console.log(`Listening on port ${port}`);
    }
  });
