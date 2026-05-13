import type { FastifyInstance } from "fastify";
import { nanoid } from "nanoid";
import { pool } from "../db.js";
import { queues } from "../queues.js";
import { dbQueryDuration } from "../metrics.js";
import { intensityIfActive } from "../scenarios.js";
import { badRequest, notFound } from "../errors.js";

interface CreateOrderBody {
  productId?: number;
  quantity?: number;
}

async function applyDbSlowdown(): Promise<void> {
  const slowdown = await intensityIfActive("db_slowdown");
  if (slowdown && slowdown > 0) {
    await new Promise((resolve) => setTimeout(resolve, slowdown));
  }
}

export async function orderRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateOrderBody }>("/api/orders", async (req, reply) => {
    const productId = Number(req.body?.productId);
    const quantity = Number(req.body?.quantity);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw badRequest("productId must be a positive integer");
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw badRequest("quantity must be a positive integer");
    }

    const id = `ord_${nanoid(10)}`;
    const end = dbQueryDuration.labels("insert_order").startTimer();
    try {
      await applyDbSlowdown();
      await pool.query(
        "INSERT INTO orders (id, product_id, quantity) VALUES ($1, $2, $3)",
        [id, productId, quantity],
      );
    } finally {
      end();
    }

    await Promise.all([
      queues.orders.add("process_order", { orderId: id, productId, quantity }),
      queues.emails.add("order_confirmation", { orderId: id }),
    ]);

    return reply.code(201).send({ id, productId, quantity });
  });

  app.get<{ Params: { id: string } }>("/api/orders/:id", async (req) => {
    const end = dbQueryDuration.labels("select_order").startTimer();
    try {
      await applyDbSlowdown();
      const { rows } = await pool.query(
        `SELECT id, product_id AS "productId", quantity, created_at AS "createdAt"
           FROM orders
          WHERE id = $1`,
        [req.params.id],
      );
      if (rows.length === 0) throw notFound(`order ${req.params.id} not found`);
      return rows[0];
    } finally {
      end();
    }
  });
}
