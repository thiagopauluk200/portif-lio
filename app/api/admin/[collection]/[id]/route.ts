import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { badRequest, notFound, readJson, storageUnavailable, unauthorized, validationError } from "@/lib/http";
import { deleteItem, isCollection, isStorageWritable, updateItem } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ collection: string; id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { collection, id } = await params;
  if (!isCollection(collection)) return notFound();
  if (!isStorageWritable()) return storageUnavailable();

  const body = await readJson(req);
  if (body === undefined) return badRequest();

  const result = await updateItem(collection, id, body);
  if (!result.ok) return result.reason === "invalid" ? validationError(result.error) : notFound();

  revalidatePath("/");
  return NextResponse.json({ item: result.item });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { collection, id } = await params;
  if (!isCollection(collection)) return notFound();
  if (!isStorageWritable()) return storageUnavailable();

  if (!(await deleteItem(collection, id))) return notFound();
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
