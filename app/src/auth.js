const jwt = require("jsonwebtoken");

const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? null : "dev-only-secret");
if (!secret) {
  console.error("JWT_SECRET is required in production");
  process.exit(1);
}

const sign = (user) => jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: "7d" });

// Middleware: без валідного Bearer-токена повертає 401
function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { sign, requireAuth };
