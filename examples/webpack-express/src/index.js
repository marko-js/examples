import express from "express";
import compression from "compression";
import indexPage from "./pages/index";
import usersService from "./services/users";

const port = process.env.PORT || 3000;

express()
  .use(compression()) // Enable gzip compression for all HTTP responses
  .use("/static", express.static("dist/client")) // Serve assets generated from webpack.
  .get("/", indexPage)
  .get("/services/users", usersService)
  .listen(port, err => {
    if (err) {
      throw err;
    }

    if (port !== "0") {
      console.log(`Listening on port ${port}`);
    }
  });
