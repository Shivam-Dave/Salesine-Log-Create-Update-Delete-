const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const authenticateToken = require("./middleware/auth");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "User with this email or username already exists",
      });
    }

    // Password complexity check (optional but recommended)
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);

    // Handle unique constraint violation
    if (err.code === "23505") {
      return res
        .status(409)
        .json({ error: "Username or email already in use" });
    }

    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
});

// Login endpoint with token generation
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.rows[0].id,
        email: user.rows[0].email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY }
    );

    // Calculate token expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

    // Store token in database
    await pool.query(
      "INSERT INTO user_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)",
      [user.rows[0].id, token, expiresAt]
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task create endpoint
app.post("/api/task/create", authenticateToken, async (req, res) => {
  try {
    const { task } = req.body;

    const newTask = await pool.query(
      "INSERT INTO tasks (task, created_by, created_at) VALUES ($1, $2, NOW()) RETURNING *",
      [task, req.user.username] // Use username instead of email
    );

    res.status(201).json(newTask.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task list endpoint
app.get("/api/task/list", authenticateToken, async (req, res) => {
  try {
    const tasks = await pool.query(
      "SELECT * FROM tasks WHERE deleted_at IS NULL"
    );

    res.json(tasks.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task update endpoint
app.put("/api/task/update", authenticateToken, async (req, res) => {
  try {
    const { taskId, newTask } = req.body;

    const task = await pool.query(
      "SELECT * FROM tasks WHERE task_id = $1 AND deleted_at IS NULL", // Changed 'id' to 'task_id'
      [taskId]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updatedTask = await pool.query(
      "UPDATE tasks SET task = $1, updated_by = $2, updated_at = NOW() WHERE task_id = $3 AND deleted_at IS NULL RETURNING *", // Changed 'id' to 'task_id'
      [newTask, req.user.username, taskId] // Use username instead of email
    );

    res.status(200).json(updatedTask.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Task delete endpoint
app.delete("/api/task/delete", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.body;

    const task = await pool.query(
      "SELECT * FROM tasks WHERE task_id = $1 AND deleted_at IS NULL", // Changed 'id' to 'task_id'
      [taskId]
    );

    if (task.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    await pool.query(
      "UPDATE tasks SET deleted_by = $1, deleted_at = NOW() WHERE task_id = $2 AND deleted_at IS NULL", // Changed 'id' to 'task_id'
      [req.user.username, taskId] // Use username instead of email
    );

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout endpoint
app.post("/api/logout", authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    await pool.query(
      "UPDATE user_tokens SET is_valid = false WHERE token = $1",
      [token]
    );

    res.json({ message: "Logout successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
// User data endpoint
app.get("/api/user", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await pool.query(
      "SELECT id, username, email FROM users WHERE id = $1",
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error("User data fetch error:", err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});
