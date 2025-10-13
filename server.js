


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { pool } from "./db.js";
import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoute.js";
import profileRoutes from "./routes/ProfileRoutes.js";
import usersRoute from './routes/usersRoutes.js'

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "https://uf-client.onrender.com", credentials: true }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api", uploadRoutes);
app.use("/profile", profileRoutes);
app.use("/api/users", usersRoute);

// ---------------- GET Single Post Route ----------------
app.get("/api/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT posts.id AS post_id, posts.content, posts.image_url, posts.created_at,
              users.id AS user_id, users.name, users.avatar
       FROM posts
       JOIN users ON posts.user_id = users.id
       WHERE posts.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// ---------------- Socket.IO ----------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "https://uf-client.onrender.com", methods: ["GET", "POST"] },
});

// ---------------- Helper: Fetch Posts ----------------
async function fetchPosts() {
  const res = await pool.query(`
    SELECT posts.id AS post_id, posts.content, posts.image_url, posts.created_at,
           users.id AS user_id, users.name, users.avatar
    FROM posts
    JOIN users ON posts.user_id = users.id
    ORDER BY posts.created_at DESC
  `);
  return res.rows;
}

// ---------------- Helper: Fetch Comments ----------------
async function fetchComments(postId) {
  const res = await pool.query(
    `
    SELECT c.id AS comment_id, c.content, c.created_at,
           u.id AS user_id, u.name, u.avatar
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = $1
    ORDER BY c.created_at ASC
  `,
    [postId]
  );
  console.log("📝 Found comments:", res.rows.length);
  return res.rows;
}



// ---------------- Socket.IO connection ----------------
io.on("connection", async (socket) => {
  console.log("✅ User connected:", socket.id);

  // ==================== 📝 POSTS ====================
  
  // 🔥 CRITICAL: Send all posts immediately on connection
  const initialPosts = await fetchPosts();
  console.log("📤 Sending initial posts:", initialPosts.length);
  socket.emit("load_posts", initialPosts);

  // Fetch posts on request (for refresh)
  socket.on("fetch_posts", async () => {
    console.log("🔄 Fetching posts on request");
    const posts = await fetchPosts();
    socket.emit("load_posts", posts);
  });

  // Create new post
  socket.on("new_post", async ({ user, content, imageUrl }) => {
    await pool.query(
      "INSERT INTO posts (user_id, content, image_url) VALUES ($1, $2, $3)",
      [user.id, content, imageUrl || null]
    );
    const updatedPosts = await fetchPosts();
    io.emit("load_posts", updatedPosts);
  });









// Add these handlers inside your io.on("connection", ...) block in server.js

// ==================== 🔁 REPOSTS ====================

// Fetch reposts for a specific post
socket.on("fetch_reposts", async (post_id) => {
  try {
    const repostsRes = await pool.query(
      "SELECT user_id FROM reposts WHERE post_id = $1",
      [post_id]
    );
    const repostedBy = repostsRes.rows.map((r) => r.user_id);
    io.emit("load_reposts", {
      postId: post_id,
      reposts: repostedBy.length,
      repostedBy,
    });
  } catch (err) {
    console.error("❌ Error fetching reposts:", err);
  }
});

// Toggle repost
socket.on("toggle_repost", async ({ post_id, user_id }) => {
  try {
    // Check if user already reposted
    const check = await pool.query(
      "SELECT * FROM reposts WHERE post_id = $1 AND user_id = $2",
      [post_id, user_id]
    );

    if (check.rows.length > 0) {
      // Un-repost
      await pool.query(
        "DELETE FROM reposts WHERE post_id = $1 AND user_id = $2",
        [post_id, user_id]
      );
      console.log("✅ Removed repost");
    } else {
      // Repost
      await pool.query(
        "INSERT INTO reposts (post_id, user_id, created_at) VALUES ($1, $2, NOW())",
        [post_id, user_id]
      );
      console.log("✅ Added repost");
    }

    // Send updated repost count
    const repostsRes = await pool.query(
      "SELECT user_id FROM reposts WHERE post_id = $1",
      [post_id]
    );
    const repostedBy = repostsRes.rows.map((r) => r.user_id);
    io.emit("load_reposts", {
      postId: post_id,
      reposts: repostedBy.length,
      repostedBy,
    });
  } catch (err) {
    console.error("❌ Error toggling repost:", err);
    socket.emit("error_message", "Failed to toggle repost");
  }
});

// Fetch user's reposts (for profile page)
socket.on("fetch_user_reposts", async (userId) => {
  console.log("🔁 Fetching reposts for user:", userId);
  try {
    const result = await pool.query(
      `SELECT p.id as post_id, p.content, p.image_url, p.created_at, p.user_id,
              u.name, u.avatar, r.created_at as reposted_at
       FROM posts p
       JOIN reposts r ON p.id = r.post_id
       JOIN users u ON p.user_id = u.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    console.log("✅ Found reposts:", result.rows.length);
    socket.emit("load_user_reposts", result.rows);
  } catch (error) {
    console.error("❌ Error fetching user reposts:", error);
    socket.emit("load_user_reposts", []);
  }
});



















  // Delete a post
  socket.on("delete_post", async ({ post_id, user_id }) => {
    try {
      const res = await pool.query(
        "SELECT * FROM posts WHERE id = $1 AND user_id = $2",
        [post_id, user_id]
      );
      if (res.rowCount === 0) {
        socket.emit("error_message", "Unauthorized to delete this post");
        return;
      }

      await pool.query("DELETE FROM posts WHERE id = $1", [post_id]);
      const updatedPosts = await fetchPosts();
      io.emit("load_posts", updatedPosts);
    } catch (err) {
      console.error("Delete error:", err);
      socket.emit("error_message", "Failed to delete post");
    }
  });

  // ==================== 💬 COMMENTS ====================

  // Fetch comments for a specific post
  socket.on("fetch_comments", async (postId) => {
    try {
      const comments = await fetchComments(postId);
      console.log("📤 Emitting comments back to client:", { postId, commentsCount: comments.length });
      socket.emit("load_comments", { postId: postId, comments });
    } catch (err) {
      console.error("❌ Error fetching comments:", err);
      socket.emit("error_message", "Failed to load comments");
    }
  });

  // Add a new comment
  socket.on("add_comment", async ({ post_id, user_id, content }) => {
    console.log("💬 Adding comment:", { post_id, user_id, content });
    
    try {
      await pool.query(
        "INSERT INTO comments (post_id, user_id, content) VALUES ($1, $2, $3)",
        [post_id, user_id, content]
      );
      console.log("✅ Comment added successfully");
      
      const comments = await fetchComments(post_id);
      console.log("📤 Broadcasting updated comments:", comments.length);
      
      io.emit("load_comments", { postId: post_id, comments });
    } catch (err) {
      console.error("❌ Error adding comment:", err);
      socket.emit("error_message", "Failed to add comment");
    }
  });

  // ==================== ❤️ LIKES ====================

  // Fetch likes
  socket.on("fetch_likes", async (post_id) => {
    const likesRes = await pool.query(
      "SELECT user_id FROM likes WHERE post_id = $1",
      [post_id]
    );
    const likedBy = likesRes.rows.map((r) => r.user_id);
    io.emit("load_likes", {
      postId: post_id,
      likes: likedBy.length,
      likedBy,
    });
  });

  // Like/unlike toggle
  socket.on("update_like", async ({ post_id, user_id }) => {
    const check = await pool.query(
      "SELECT * FROM likes WHERE post_id=$1 AND user_id=$2",
      [post_id, user_id]
    );

    if (check.rows.length > 0) {
      await pool.query("DELETE FROM likes WHERE post_id=$1 AND user_id=$2", [
        post_id,
        user_id,
      ]);
    } else {
      await pool.query(
        "INSERT INTO likes (post_id, user_id, created_at) VALUES ($1,$2,NOW())",
        [post_id, user_id]
      );
    }

    const likesRes = await pool.query(
      "SELECT user_id FROM likes WHERE post_id=$1",
      [post_id]
    );
    const likedBy = likesRes.rows.map((r) => r.user_id);
    io.emit("load_likes", {
      postId: post_id,
      likes: likedBy.length,
      likedBy,
    });
  });

  // ==================== 👤 PROFILE ====================

  // Fetch user profile
  socket.on("fetch_profile", async ({ userId, currentUserId }) => {
    console.log("👤 Fetching profile for:", userId, "Current user:", currentUserId);
    try {
      const userQuery = await pool.query(
        `SELECT id, name, email, avatar, bio, created_at 
         FROM users WHERE id = $1`,
        [userId]
      );

      if (userQuery.rows.length === 0) {
        console.log("❌ User not found:", userId);
        return socket.emit("load_profile", { error: "User not found" });
      }

      console.log("✅ User found:", userQuery.rows[0].name);

      // Get posts count
      const postsCount = await pool.query(
        "SELECT COUNT(*) FROM posts WHERE user_id = $1",
        [userId]
      );

      // Get followers count
      const followersCount = await pool.query(
        "SELECT COUNT(*) FROM follows WHERE following_id = $1",
        [userId]
      );

      // Get following count
      const followingCount = await pool.query(
        "SELECT COUNT(*) FROM follows WHERE follower_id = $1",
        [userId]
      );

      // Check if current user is following this profile
      let isFollowing = false;
      if (currentUserId) {
        const followCheck = await pool.query(
          "SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2",
          [currentUserId, userId]
        );
        isFollowing = followCheck.rows.length > 0;
      }

      socket.emit("load_profile", {
        user: userQuery.rows[0],
        stats: {
          postsCount: parseInt(postsCount.rows[0].count),
          followersCount: parseInt(followersCount.rows[0].count),
          followingCount: parseInt(followingCount.rows[0].count),
        },
        isFollowing,
      });
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      socket.emit("load_profile", { error: "Failed to load profile" });
    }
  });

  // Fetch user posts
  socket.on("fetch_user_posts", async (userId) => {
    console.log("📝 Fetching posts for user:", userId);
    try {
      const result = await pool.query(
        `SELECT p.id as post_id, p.content, p.image_url, p.created_at, p.user_id,
                u.name, u.avatar 
         FROM posts p
         JOIN users u ON p.user_id = u.id
         WHERE p.user_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      );
      console.log("✅ Found posts:", result.rows.length);
      socket.emit("load_user_posts", result.rows);
    } catch (error) {
      console.error("❌ Error fetching user posts:", error);
      socket.emit("load_user_posts", []);
    }
  });

  // Fetch user liked posts
  socket.on("fetch_user_likes", async (userId) => {
    console.log("❤️ Fetching liked posts for user:", userId);
    try {
      const result = await pool.query(
        `SELECT p.id as post_id, p.content, p.image_url, p.created_at, p.user_id,
                u.name, u.avatar 
         FROM posts p
         JOIN likes l ON p.id = l.post_id
         JOIN users u ON p.user_id = u.id
         WHERE l.user_id = $1
         ORDER BY l.created_at DESC`,
        [userId]
      );
      console.log("✅ Found liked posts:", result.rows.length);
      socket.emit("load_user_likes", result.rows);
    } catch (error) {
      console.error("❌ Error fetching user likes:", error);
      socket.emit("load_user_likes", []);
    }
  });

  // Fetch user comments
  socket.on("fetch_user_comments", async (userId) => {
    console.log("💬 Fetching comments for user:", userId);
    try {
      const result = await pool.query(
        `SELECT c.id, c.content, c.created_at, p.id as post_id 
         FROM comments c
         JOIN posts p ON c.post_id = p.id
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
      );
      console.log("✅ Found comments:", result.rows.length);
      socket.emit("load_user_comments", result.rows);
    } catch (error) {
      console.error("❌ Error fetching user comments:", error);
      socket.emit("load_user_comments", []);
    }
  });

  // Fetch followers
  socket.on("fetch_followers", async (userId) => {
    console.log("👥 Fetching followers for user:", userId);
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.avatar, u.bio
         FROM follows f
         JOIN users u ON f.follower_id = u.id
         WHERE f.following_id = $1
         ORDER BY f.created_at DESC`,
        [userId]
      );
      console.log("✅ Found followers:", result.rows.length);
      socket.emit("load_followers", result.rows);
    } catch (error) {
      console.error("❌ Error fetching followers:", error);
      socket.emit("load_followers", []);
    }
  });

  // Fetch following
  socket.on("fetch_following", async (userId) => {
    console.log("👥 Fetching following for user:", userId);
    try {
      const result = await pool.query(
        `SELECT u.id, u.name, u.avatar, u.bio
         FROM follows f
         JOIN users u ON f.following_id = u.id
         WHERE f.follower_id = $1
         ORDER BY f.created_at DESC`,
        [userId]
      );
      console.log("✅ Found following:", result.rows.length);
      socket.emit("load_following", result.rows);
    } catch (error) {
      console.error("❌ Error fetching following:", error);
      socket.emit("load_following", []);
    }
  });

  // Toggle follow/unfollow
  socket.on("toggle_follow", async ({ follower_id, following_id }) => {
    console.log("🔄 Toggle follow:", { follower_id, following_id });
    try {
      // Check if already following
      const existingFollow = await pool.query(
        "SELECT * FROM follows WHERE follower_id = $1 AND following_id = $2",
        [follower_id, following_id]
      );

      if (existingFollow.rows.length > 0) {
        // Unfollow
        await pool.query(
          "DELETE FROM follows WHERE follower_id = $1 AND following_id = $2",
          [follower_id, following_id]
        );
        console.log("✅ Unfollowed");
        socket.emit("follow_updated", { action: "unfollowed", following_id });
      } else {
        // Follow
        await pool.query(
          "INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)",
          [follower_id, following_id]
        );
        console.log("✅ Followed");
        socket.emit("follow_updated", { action: "followed", following_id });
      }

      // Broadcast update to refresh counts
      io.emit("refresh_profile", following_id);
    } catch (error) {
      console.error("❌ Error toggling follow:", error);
    }
  });

  // ======================================================

  socket.on("disconnect", () => console.log("❌ User disconnected:", socket.id));
});

// ---------------- Start Server ----------------
server.listen(5000, () => console.log("🚀 Server running on port 5000"));