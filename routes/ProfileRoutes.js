import express from "express";
import { pool } from "../db.js";

const router = express.Router();

// ---------------- GET user profile ----------------
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT id, name, avatar FROM users WHERE id = $1",
      [userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- GET user posts ----------------
router.get("/:userId/posts", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT posts.id AS post_id, posts.content, posts.image_url, posts.created_at,
              users.id AS user_id, users.name, users.avatar
       FROM posts
       JOIN users ON posts.user_id = users.id
       WHERE user_id = $1
       ORDER BY posts.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- GET liked posts ----------------
router.get("/:userId/likes", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT posts.id AS post_id, posts.content, posts.image_url, posts.created_at,
              users.id AS user_id, users.name, users.avatar
       FROM likes
       JOIN posts ON likes.post_id = posts.id
       JOIN users ON posts.user_id = users.id
       WHERE likes.user_id = $1
       ORDER BY likes.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- GET followers ----------------
router.get("/:userId/followers", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- GET following ----------------
router.get("/:userId/following", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

