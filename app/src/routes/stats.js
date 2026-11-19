const express = require("express");
const { getStats, resetStats } = require("../cache");
const router = express.Router();

router.get("/", async (_req, res) => res.json(await getStats()));
router.post("/reset", async (_req, res) => {
  await resetStats();
  res.json({ status: "reset" });
});

module.exports = router;