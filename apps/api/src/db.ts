import pg from "pg";
import { logger } from "./logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => logger.error({ err }, "pg pool error"));

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      ended_at TIMESTAMPTZ,
      affected_services JSONB NOT NULL,
      summary TEXT NOT NULL,
      timeline JSONB NOT NULL DEFAULT '[]'::jsonb
    );
    CREATE INDEX IF NOT EXISTS incidents_status_idx ON incidents(status);
    CREATE INDEX IF NOT EXISTS incidents_started_at_idx ON incidents(started_at DESC);

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price_cents INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows } = await pool.query("SELECT count(*)::int AS n FROM products");
  if (rows[0].n === 0) {
    await pool.query(
      `INSERT INTO products (name, price_cents) VALUES
        ('Fire extinguisher', 4999),
        ('Smoke alarm', 1999),
        ('Carbon detector', 2999),
        ('Sprinkler head', 899),
        ('Hose reel', 12999)`,
    );
  }
}
