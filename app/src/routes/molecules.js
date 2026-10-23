const express = require("express");
const { pool } = require("../db");
const router = express.Router();

const toApi = (r) => ({
  id: r.id,
  name: r.name,
  formula: r.formula,
  molarMass: Number(r.molar_mass),
  phase: r.phase,
  variant: r.variant,
  image: r.image,
});

router.get("/", async (req, res, next) => {
  try {
    const { phases, molarMin, molarMax, q } = req.query;
    const where = [];
    const params = [];
    if (phases) {
      params.push(phases.split(",").map((s) => s.trim()));
      where.push(`phase = ANY($${params.length})`);
    }
    if (molarMin && !Number.isNaN(parseFloat(molarMin))) {
      params.push(parseFloat(molarMin));
      where.push(`molar_mass >= $${params.length}`);
    }
    if (molarMax && !Number.isNaN(parseFloat(molarMax))) {
      params.push(parseFloat(molarMax));
      where.push(`molar_mass <= $${params.length}`);
    }
    if (q) {
      params.push(`%${q}%`);
      where.push(`(name ILIKE $${params.length} OR formula ILIKE $${params.length})`);
    }
    const sql = `SELECT * FROM molecules ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY molar_mass`;
    const { rows } = await pool.query(sql, params);
    res.json({ data: rows.map(toApi) });
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM molecules WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Not found" });
    res.json({ data: toApi(rows[0]) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
