const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db");
const { sign, requireAuth } = require("../auth");
const router = express.Router();

const publicUser = (r) => ({ id: r.id, firstName: r.first_name, lastName: r.last_name, email: r.email });

function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}
const bad = (res, message, code = 400) => res.status(code).json({ success: false, message });

router.post("/register", async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body || {};
    if (!firstName || !lastName || !email || !password || !confirmPassword) return bad(res, "All fields are required");
    if (firstName.length < 2 || firstName.length > 50) return bad(res, "First name must be 2-50 characters");
    if (lastName.length < 2 || lastName.length > 50) return bad(res, "Last name must be 2-50 characters");
    if (password.length < 6) return bad(res, "Password must be at least 6 characters");
    if (password !== confirmPassword) return bad(res, "Passwords do not match");
    if (!validEmail(email)) return bad(res, "Invalid email format");

    const hash = await bcrypt.hash(password, 10);
    try {
      const { rows } = await pool.query(
        `INSERT INTO users (first_name,last_name,email,password_hash) VALUES ($1,$2,$3,$4) RETURNING *`,
        [firstName, lastName, email.trim(), hash]
      );
      res.status(201).json({ success: true, user: publicUser(rows[0]), token: sign(rows[0]) });
    } catch (e) {
      if (e.code === "23505") return bad(res, "Account with this email already exists", 409);
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return bad(res, "Email and password are required");
    if (!validEmail(email)) return bad(res, "Invalid email format");

    const { rows } = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email.trim()]);
    const user = rows[0];
    if (!user) return bad(res, "Account with this email does not exist", 401);
    if (!(await bcrypt.compare(password, user.password_hash))) return bad(res, "Invalid password", 401);

    res.json({ success: true, user: publicUser(user), token: sign(user) });
  } catch (e) {
    next(e);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows[0]) return res.status(401).json({ message: "User no longer exists" });
    res.json({ data: publicUser(rows[0]) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
