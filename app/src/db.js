const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

// Параметри підключення — лише зі змінних середовища (жодних секретів у коді).
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "app",
  password: process.env.DB_PASSWORD || "app",
  database: process.env.DB_NAME || "atoms",
  // Azure Database for PostgreSQL вимагає TLS
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: 10,
});

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, "../db/schema.sql"), "utf8");
  await pool.query(schema);

  const { rows } = await pool.query("SELECT COUNT(*)::int AS n FROM atoms");
  if (rows[0].n > 0) return;

  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "../db/seed.json"), "utf8"));
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const a of seed.atoms) {
      await client.query(
        `INSERT INTO atoms (id,name,symbol,mass,protons,neutrons,electrons,atom_type,state_variant,image)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
        [a.id, a.name, a.symbol, a.mass, a.protons, a.neutrons, a.electrons, a.atomType, a.stateVariant, a.image || ""]
      );
    }
    for (const m of seed.molecules) {
      await client.query(
        `INSERT INTO molecules (id,name,formula,molar_mass,phase,variant,image)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
        [m.id, m.name, m.formula, m.molarMass, m.phase, m.variant, m.image || ""]
      );
    }
    await client.query("COMMIT");
    console.log("Seeded database from seed.json");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, init };
