import { NextResponse, type NextRequest } from "next/server";

const INTERNAL = process.env.API_INTERNAL_URL ?? "http://api:4000";
const FORWARD_TIMEOUT_MS = 30_000;

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function forward(req: NextRequest, path: string[]): Promise<NextResponse> {
  const target = `${INTERNAL}/${path.join("/")}${req.nextUrl.search}`;
  const body = METHODS_WITH_BODY.has(req.method) ? await req.text() : undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FORWARD_TIMEOUT_MS);

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers: {
        "content-type": req.headers.get("content-type") ?? "application/json",
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      {
        error: {
          code: aborted ? "upstream_timeout" : "upstream_unreachable",
          message: aborted
            ? "Upstream API timed out"
            : `Upstream API unreachable at ${INTERNAL}`,
        },
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  return forward(req, path);
}
