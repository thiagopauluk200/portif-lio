import { NextResponse, type NextRequest } from "next/server";
import { ContactInputSchema } from "@/lib/schemas";
import { badRequest, readJson, storageUnavailable, tooManyRequests, validationError } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { addMessage, isStorageWritable } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isStorageWritable()) return storageUnavailable();
  const limit = await rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60_000);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await readJson(req);
  if (body === undefined) return badRequest();

  const parsed = ContactInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { website, ...data } = parsed.data;
  // Honeypot preenchido = bot. Responde sucesso sem gravar nada.
  if (website) return NextResponse.json({ ok: true });

  await addMessage(data);

  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (webhook) {
    const text = `📬 Nova mensagem de ${data.name} <${data.email}>\n\n${data.message}`;
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text.slice(0, 1900), text }), // Discord usa `content`, Slack usa `text`
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
