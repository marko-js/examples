import { Router } from "express";
import indexPage from "./pages/index";
import usersService from "./services/users";

export default Router()
  .get("/", indexPage)
  .get("/services/users", usersService);
