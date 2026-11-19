const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { pool, init } = require("./db");
const cache = require("./cache");
const openapi = require("./openapi");

const app = express();
app.use(cors());
app.use(express.json());

let shuttingDown = false;

app.get("/health", async (_req, res) => {
  if (shuttingDown) return res.status(503).json({ status: "shutting_down" });
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch (e) {
    res.status(503).json({ status: "db_unavailable" });
  }
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
app.use("/atoms", require("./routes/atoms"));
app.use("/molecules", require("./routes/molecules"));
app.use("/auth", require("./routes/auth"));
app.use("/orders", require("./routes/orders"));
app.use("/stats", require("./routes/stats"));

const publicDir = path.join(__dirname, "../public");
if (fs.existsSync(path.join(publicDir, "index.html"))) {
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

async function start() {
  for (let i = 1; i <= 30; i++) {
    try {
      await init();
      break;
    } catch (e) {
      console.error(`DB init failed (${i}/30): ${e.message}`);
      if (i === 30) process.exit(1);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  const server = app.listen(PORT, "0.0.0.0", () => console.log(`API listening on :${PORT}`));

  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received, draining connections`);
    const force = setTimeout(() => process.exit(1), 25000);
    force.unref();
    server.close(async () => {
      await pool.end().catch(() => {});
      await cache.close();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();
