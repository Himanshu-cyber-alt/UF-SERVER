

import express from "express";
import {
  registerDoctor,
  loginDoctor,
  logoutDoctor,
  getAllDoctors,   // 👈 import
} from "../controllers/doctorController.js";

const router = express.Router();

router.post("/register", registerDoctor);
router.post("/login", loginDoctor);
router.post("/logout", logoutDoctor);
router.get("/", getAllDoctors);   // 👈 add GET /api/doctors

export default router;
