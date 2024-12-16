const jwt = require("jsonwebtoken");
const pool = require("../db");
require("dotenv").config();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (jwtError) {
      console.error("JWT Verification failed:", jwtError.message);
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify token in database
    const tokenRecord = await pool.query(
      `SELECT ut.*, u.email, u.username 
       FROM user_tokens ut
       JOIN users u ON u.id = ut.user_id
       WHERE ut.token = $1`,
      [token]
    );

    if (tokenRecord.rows.length === 0) {
      return res.status(401).json({ error: "Token not found in database" });
    }

    const tokenData = tokenRecord.rows[0];

    if (!tokenData.is_valid) {
      return res.status(401).json({ error: "Token has been invalidated" });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      await pool.query(
        "UPDATE user_tokens SET is_valid = false WHERE token = $1",
        [token]
      );
      return res.status(401).json({ error: "Token has expired" });
    }

    // Add user details to request
    req.user = {
      ...req.user,
      username: tokenData.username,
      email: tokenData.email,
    };

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(500).json({ error: "Authentication server error" });
  }
};

module.exports = authenticateToken;
