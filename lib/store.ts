/**
 * Camada de persistência — arquivos JSON no servidor.
 *
 * - Somente importada por código de servidor (route handlers / server components).
 * - Escritas serializadas por uma fila (evita condições de corrida no mesmo processo).
 * - Escrita atômica (arquivo temporário + rename) para nunca corromper o JSON.
 * - Todo conteúdo é validado com Zod antes de ser gravado.
 *
 * Para trocar por Supabase/MongoDB, basta reimplementar as funções exportadas
 * mantendo as mesmas assinaturas.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ZodError } from "zod";
import {
  ContentSchema,
  ExperienceInputSchema,
  MessageSchema,
  ProjectInputSchema,
  type Content,
  type Experience,
  type Message,
  type Project,
} from "./schemas";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const MAX_MESSAGES = 500;

type Collections = { projects: Project; experiences: Experience };
export type CollectionName = keyof Collections;

const inputSchemas = {
  projects: ProjectInputSchema,
  experiences: ExperienceInputSchema,
} as const;

export function isCollection(value: string): value is CollectionName {
  return value === "projects" || value === "experiences";
}

/* ---------- infraestrutura ---------- */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

async function writeJsonAtomic(file: string, data: unknown) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  await fs.rename(tmp, file);
}

async function readContent(): Promise<Content> {
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  return ContentSchema.parse(JSON.parse(raw));
}

async function writeContent(content: Content) {
  await writeJsonAtomic(CONTENT_FILE, ContentSchema.parse(content));
}

function sortExperiences(list: Experience[]) {
  return [...list].sort((a, b) => (b.end ?? "9999").localeCompare(a.end ?? "9999") || b.start.localeCompare(a.start));
}

/* ---------- leitura pública ---------- */
export async function getContent(): Promise<Content> {
  const content = await readContent();
  return { ...content, experiences: sortExperiences(content.experiences) };
}

/* ---------- CRUD genérico (projetos / experiências) ---------- */
type MutationResult<T> =
  | { ok: true; item: T }
  | { ok: false; reason: "invalid"; error: ZodError }
  | { ok: false; reason: "not_found" };

export async function listItems<C extends CollectionName>(c: C): Promise<Collections[C][]> {
  const content = await getContent();
  return content[c] as Collections[C][];
}

export async function createItem<C extends CollectionName>(c: C, input: unknown): Promise<MutationResult<Collections[C]>> {
  const parsed = inputSchemas[c].safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid", error: parsed.error };

  return withLock(async () => {
    const content = await readContent();
    const now = new Date().toISOString();
    const item = { ...parsed.data, id: randomUUID(), createdAt: now, updatedAt: now } as Collections[C];
    (content[c] as Collections[C][]).unshift(item);
    await writeContent(content);
    return { ok: true as const, item };
  });
}

export async function updateItem<C extends CollectionName>(
  c: C,
  id: string,
  input: unknown,
): Promise<MutationResult<Collections[C]>> {
  const parsed = inputSchemas[c].safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid", error: parsed.error };

  return withLock(async () => {
    const content = await readContent();
    const list = content[c] as Collections[C][];
    const index = list.findIndex((i) => i.id === id);
    if (index === -1) return { ok: false as const, reason: "not_found" as const };

    const current = list[index];
    const item = {
      ...parsed.data,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    } as Collections[C];
    list[index] = item;
    await writeContent(content);
    return { ok: true as const, item };
  });
}

export async function deleteItem(c: CollectionName, id: string): Promise<boolean> {
  return withLock(async () => {
    const content = await readContent();
    const list = content[c] as { id: string }[];
    const next = list.filter((i) => i.id !== id);
    if (next.length === list.length) return false;
    (content as Record<CollectionName, unknown>)[c] = next;
    await writeContent(content);
    return true;
  });
}

/* ---------- Mensagens de contato ---------- */
async function readMessages(): Promise<Message[]> {
  try {
    const raw = await fs.readFile(MESSAGES_FILE, "utf8");
    return MessageSchema.array().parse(JSON.parse(raw));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function listMessages() {
  return readMessages();
}

export async function addMessage(data: Pick<Message, "name" | "email" | "message">) {
  return withLock(async () => {
    const messages = await readMessages();
    const message: Message = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
    messages.unshift(message);
    await writeJsonAtomic(MESSAGES_FILE, messages.slice(0, MAX_MESSAGES));
    return message;
  });
}

export async function deleteMessage(id: string) {
  return withLock(async () => {
    const messages = await readMessages();
    const next = messages.filter((m) => m.id !== id);
    if (next.length === messages.length) return false;
    await writeJsonAtomic(MESSAGES_FILE, next);
    return true;
  });
}
