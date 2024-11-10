import { Router } from "express";
import { AuthServices } from "./auth_services.js";

const router = Router();
const authServices = new AuthServices();

router.post("/register", authServices.register);
router.post("/login", authServices.login);
router.get("/logout", authServices.logout);

export default router;
