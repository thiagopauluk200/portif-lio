import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { badRequest, readJson, storageUnavailable, unauthorized, validationError } from "@/lib/http";
import { getSettings, isStorageWritable, updateSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin(req))) return unauthorized();
  if (!isStorageWritable()) return storageUnavailable();
  const body = await readJson(req);
  if (body === undefined) return badRequest();
  const result = await updateSettings(body);
  if (!result.ok) return validationError(result.error);
  revalidatePath("/");
  return NextResponse.json({ settings: result.settings });
}
