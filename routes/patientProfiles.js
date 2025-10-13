
// // export default router;

// import express from "express";
// import { createProfile, getProfile, updateProfile } from "../controllers/patientProfileController.js";

// const router = express.Router();

// // Create a profile
// router.post("/", createProfile);

// // Get profile by patient_id
// router.get("/:patient_id", getProfile);

// // Update profile by patient_id
// router.put("/:patient_id", updateProfile);

// export default router;



import express from "express";
import {
  createProfile,
  updateProfile,
  getProfile,
} from "../controllers/patientProfileController.js";

const router = express.Router();

// Create profile
router.post("/", createProfile);

// Update profile
router.put("/:patient_id", updateProfile);

// Get profile
router.get("/:patient_id", getProfile);

export default router;

