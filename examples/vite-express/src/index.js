import { Router } from "express";
import indexPage from "./pages/index";
import usersService from "./services/users";

export const router = Router()
  .get("/", indexPage)
  .get("/services/users", usersService);
