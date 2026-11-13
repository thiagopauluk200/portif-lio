import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { badRequest, notFound, readJson, storageUnavailable, unauthorized, validationError } from "@/lib/http";
import { createItem, isCollection, isStorageWritable, listItems } from "@/lib/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ collection: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { collection } = await params;
  if (!isCollection(collection)) return notFound();
  return NextResponse.json({ items: await listItems(collection) });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await requireAdmin(req))) return unauthorized();
  const { collection } = await params;
  if (!isCollection(collection)) return notFound();
  if (!isStorageWritable()) return storageUnavailable();

  const body = await readJson(req);
  if (body === undefined) return badRequest();

  const result = await createItem(collection, body);
  if (!result.ok) return result.reason === "invalid" ? validationError(result.error) : notFound();

  revalidatePath("/");
  return NextResponse.json({ item: result.item }, { status: 201 });
}
