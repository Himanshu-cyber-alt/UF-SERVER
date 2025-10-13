import express from "express";
import { pool } from "../db.js"; // your Postgres pool

const router = express.Router();

// GET all users
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, avatar, provider FROM users ORDER BY name ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
