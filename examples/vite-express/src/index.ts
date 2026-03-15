import { Router } from "express";
import indexPage from "./routes/index/index";

export const router = Router().get("/", indexPage);
