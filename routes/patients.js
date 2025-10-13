import express from "express";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const JWT_SECRET = "supersecretkey";

// ✅ Register patient
router.post("/register", async (req, res) => {
  const { mobile_number } = req.body;

  console.log(mobile_number)

  if (!mobile_number) {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const existing = await pool.query(
      "SELECT * FROM patients WHERE mobile_number = $1",
      [mobile_number]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "User already registered" });
    }

    const result = await pool.query(
      "INSERT INTO patients (mobile_number) VALUES ($1) RETURNING *",
      [mobile_number]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Login patient
// ✅ Login patient
// router.post("/login", async (req, res) => {
//   const { mobile_number } = req.body;

//   console.log(mobile_number)
//   // ✅ Validate input
//   if (!mobile_number || mobile_number.trim() === "") {
//     return res.status(400).json({ error: "Mobile number is required" });
//   }

//   try {
//     const result = await pool.query(
//       "SELECT * FROM patients WHERE mobile_number = $1",
//       [mobile_number]
//     );

//     if (result.rows.length === 0) {
//       // not registered
//        return res.status(404).json({ exists: false, success: false, error: "User not found" });
  
//     }

//     // registered → login success
//     return res.json({
//       exists: true,
//       success: true,
//       patient: result.rows[0], // optional
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ error: "Server error" });
//   }
// });




router.post("/login", async (req, res) => {
  const { mobile_number } = req.body;

  if (!mobile_number || mobile_number.trim() === "") {
    return res.status(400).json({ error: "Mobile number is required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM patients WHERE mobile_number = $1",
      [mobile_number]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ exists: false, success: false, error: "User not found" });
    }

    const patient = result.rows[0];

    // ✅ Create a token
    const token = jwt.sign(
      { id: patient.id, mobile_number: patient.mobile_number },
      JWT_SECRET,
      { expiresIn: "1h" } // token valid for 1 hour
    );

    return res.json({
      exists: true,
      success: true,
      token, // send token to frontend
      patient,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router; // ✅ default export


