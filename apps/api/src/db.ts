import pg from "pg";
import { config } from "./config.js";
import { logger } from "./logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: config.pgPoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // Per-session safety nets: a runaway query won't pin a connection forever.
  statement_timeout: config.pgStatementTimeoutMs,
  idle_in_transaction_session_timeout: config.pgIdleTxTimeoutMs,
});

pool.on("error", (err) => {
  // Idle client errors are non-fatal: pg removes the client and the pool
  // recovers. Log loudly so we can spot transient DB issues.
  logger.error({ err: err.message }, "postgres pool error");
});

const SCHEMA = `
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
`;

const SEED_PRODUCTS = `
  INSERT INTO products (name, price_cents) VALUES
    ('Fire extinguisher', 4999),
    ('Smoke alarm', 1999),
    ('Carbon detector', 2999),
    ('Sprinkler head', 899),
    ('Hose reel', 12999)
`;

export async function migrate(): Promise<void> {
  await pool.query(SCHEMA);
  const { rows } = await pool.query<{ n: number }>(
    "SELECT count(*)::int AS n FROM products",
  );
  if (rows[0].n === 0) {
    await pool.query(SEED_PRODUCTS);
    logger.info("seeded products table");
  }
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
