import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { unauthorized } from "@/lib/http";
import { listMessages } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();
  return NextResponse.json({ items: await listMessages() });
}
