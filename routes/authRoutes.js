import express from "express";
import { googleRegisterController, emailRegisterController , loginController } from "../controllers/authController.js";

const router = express.Router();

router.post("/google-register", googleRegisterController);
router.post("/email-register", emailRegisterController);
router.post("/login",loginController);

export default router;
