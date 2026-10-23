const express = require("express");
const { pool } = require("../db");
const router = express.Router();

// Повертає той самий JSON-формат, що й старий сервер (camelCase, числа як number)
const toApi = (r) => ({
  id: r.id,
  name: r.name,
  symbol: r.symbol,
  mass: Number(r.mass),
  protons: r.protons,
  neutrons: r.neutrons,
  electrons: r.electrons,
  atomType: r.atom_type,
  stateVariant: r.state_variant,
  image: r.image,
});

router.get("/", async (req, res, next) => {
  try {
    const { types, massMin, massMax, q } = req.query;
    const where = [];
    const params = [];
    if (types) {
      params.push(types.split(",").map((s) => s.trim()));
      where.push(`atom_type = ANY($${params.length})`);
    }
    if (massMin && !Number.isNaN(parseFloat(massMin))) {
      params.push(parseFloat(massMin));
      where.push(`mass >= $${params.length}`);
    }
    if (massMax && !Number.isNaN(parseFloat(massMax))) {
      params.push(parseFloat(massMax));
      where.push(`mass <= $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(name ILIKE $${params.length} OR symbol ILIKE $${params.length})`);
    }
    const sql = `SELECT * FROM atoms ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY mass`;
    const { rows } = await pool.query(sql, params);
    res.json({ data: rows.map(toApi) });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM atoms WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ data: toApi(rows[0]) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
