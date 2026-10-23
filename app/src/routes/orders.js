const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../auth");
const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res, next) => {
  const { firstName, lastName, email, phone, address, items } = req.body || {};
  if (!firstName || !lastName || !email || !phone || !address) return res.status(400).json({ message: "Missing contact fields" });
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Order must contain items" });
  for (const it of items) {
    if (!it || !it.id || !it.name || !it.variant || !Number.isInteger(it.quantity) || it.quantity < 1) {
      return res.status(400).json({ message: "Invalid order item" });
    }
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const o = await client.query(
      `INSERT INTO orders (user_id,first_name,last_name,email,phone,address)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
      [req.user.id, firstName, lastName, email, phone, address]
    );
    for (const it of items) {
      await client.query(
        `INSERT INTO order_items (order_id,item_id,name,variant,quantity) VALUES ($1,$2,$3,$4,$5)`,
        [o.rows[0].id, String(it.id), it.name, it.variant, it.quantity]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ data: { id: o.rows[0].id, createdAt: o.rows[0].created_at } });
  } catch (e) {
    await client.query("ROLLBACK");
    next(e);
  } finally {
    client.release();
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.id, o.address, o.created_at,
              COALESCE(json_agg(json_build_object('id', i.item_id, 'name', i.name, 'variant', i.variant, 'quantity', i.quantity)) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
         FROM orders o LEFT JOIN order_items i ON i.order_id = o.id
        WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ data: rows.map((r) => ({ id: r.id, address: r.address, createdAt: r.created_at, items: r.items })) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
