import type { FastifyInstance } from "fastify";
import { pool } from "../db.js";
import { dbQueryDuration } from "../metrics.js";
import { intensityIfActive } from "../scenarios.js";

export async function productRoutes(app: FastifyInstance) {
  app.get("/api/products", async () => {
    const end = dbQueryDuration.labels("select_products").startTimer();
    try {
      const slowdown = await intensityIfActive("db_slowdown");
      if (slowdown && slowdown > 0) {
        await new Promise((resolve) => setTimeout(resolve, slowdown));
      }
      const { rows } = await pool.query(
        `SELECT id, name, price_cents AS "priceCents"
           FROM products
          ORDER BY id`,
      );
      return { products: rows };
    } finally {
      end();
    }
  });
}
