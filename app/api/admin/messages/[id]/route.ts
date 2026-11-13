import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { notFound, unauthorized } from "@/lib/http";
import { deleteMessage } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { id } = await params;
  if (!(await deleteMessage(id))) return notFound();
  return NextResponse.json({ ok: true });
}
