import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { Queue } from "bullmq";
import { pool } from "../db.js";
import { redis } from "../redis.js";
import { dbQueryDuration } from "../metrics.js";
import { intensityIfActive } from "../scenarios.js";

const ordersQueue = new Queue("orders", { connection: redis });
const emailQueue = new Queue("emails", { connection: redis });

export async function orderRoutes(app: FastifyInstance) {
  app.post<{ Body: { productId: number; quantity: number } }>(
    "/api/orders",
    async (req, reply) => {
      const { productId, quantity } = req.body ?? ({} as { productId: number; quantity: number });
      if (!productId || !quantity || quantity <= 0) {
        return reply.code(400).send({ error: "productId and positive quantity required" });
      }
      const id = `ord_${nanoid(10)}`;
      const end = dbQueryDuration.labels("insert_order").startTimer();
      try {
        const slowdown = await intensityIfActive("db_slowdown");
        if (slowdown) await new Promise((r) => setTimeout(r, slowdown));
        await pool.query(
          "INSERT INTO orders (id, product_id, quantity) VALUES ($1, $2, $3)",
          [id, productId, quantity],
        );
      } finally {
        end();
      }
      await ordersQueue.add("process_order", { orderId: id, productId, quantity });
      await emailQueue.add("order_confirmation", { orderId: id });
      return reply.code(201).send({ id, productId, quantity });
    },
  );

  app.get<{ Params: { id: string } }>("/api/orders/:id", async (req, reply) => {
    const end = dbQueryDuration.labels("select_order").startTimer();
    try {
      const slowdown = await intensityIfActive("db_slowdown");
      if (slowdown) await new Promise((r) => setTimeout(r, slowdown));
      const { rows } = await pool.query(
        `SELECT id, product_id AS "productId", quantity, created_at AS "createdAt"
         FROM orders WHERE id = $1`,
        [req.params.id],
      );
      if (rows.length === 0) return reply.code(404).send({ error: "not found" });
      return rows[0];
    } finally {
      end();
    }
  });
}

export { ordersQueue, emailQueue };
