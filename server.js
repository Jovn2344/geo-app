import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Postgres connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // required on Render
});

app.use(express.json());
app.use(express.static(__dirname)); // serves index.html, admin.html, etc.

// POST: Save location
app.post("/api/locations", async (req, res) => {
  const { lat, lon, accuracy, at, ua } = req.body || {};
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || null;

  try {
    await pool.query(
      "INSERT INTO locations (lat, lon, accuracy, at, ua, ip) VALUES ($1,$2,$3,$4,$5,$6)",
      [lat, lon, accuracy, at || new Date().toISOString(), ua, ip]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("Insert error:", err);
    res.status(500).json({ ok: false });
  }
});

// GET: Fetch logs
app.get("/api/locations", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM locations ORDER BY at DESC");
    res.json(rows);
  } catch (err) {
    console.error("Fetch error:", err);
    res.status(500).json({ ok: false });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
