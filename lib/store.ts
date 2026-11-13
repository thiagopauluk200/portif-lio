/**
 * Camada de persistência com dois modos:
 *
 *  • Redis (produção / Vercel): projetos, experiências e mensagens ficam no Upstash Redis.
 *    Perfil e skills continuam vindo de data/content.json (editados via git).
 *  • Arquivos (desenvolvimento local): tudo em data/*.json, com escrita atômica.
 *
 * Todo conteúdo é validado com Zod antes de ser gravado.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ZodError } from "zod";
import seed from "@/data/content.json";
import { redis } from "./redis";
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

const KEY_COLLECTIONS = "portfolio:collections";
const KEY_MESSAGES = "portfolio:messages";

const CollectionsSchema = ContentSchema.pick({ projects: true, experiences: true });
type CollectionsData = { projects: Project[]; experiences: Experience[] };

type Collections = { projects: Project; experiences: Experience };
export type CollectionName = keyof Collections;

const inputSchemas = {
  projects: ProjectInputSchema,
  experiences: ExperienceInputSchema,
} as const;

export function isCollection(value: string): value is CollectionName {
  return value === "projects" || value === "experiences";
}

/** Na Vercel o disco é somente leitura: sem Redis não há como gravar. */
export function isStorageWritable() {
  return redis !== null || !process.env.VERCEL;
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

/** Lê content.json do disco (sempre atualizado em dev); se não houver, usa a cópia embutida no build. */
async function readFileContent(): Promise<Content> {
  try {
    return ContentSchema.parse(JSON.parse(await fs.readFile(CONTENT_FILE, "utf8")));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    return ContentSchema.parse(seed);
  }
}

async function readCollections(): Promise<CollectionsData> {
  if (redis) {
    const raw = await redis.get<string>(KEY_COLLECTIONS);
    if (raw) return CollectionsSchema.parse(JSON.parse(raw));
    const s = ContentSchema.parse(seed); // primeira execução: parte do conteúdo do repositório
    return { projects: s.projects, experiences: s.experiences };
  }
  const c = await readFileContent();
  return { projects: c.projects, experiences: c.experiences };
}

async function writeCollections(data: CollectionsData) {
  const valid = CollectionsSchema.parse(data);
  if (redis) {
    await redis.set(KEY_COLLECTIONS, JSON.stringify(valid));
    return;
  }
  const content = await readFileContent();
  await writeJsonAtomic(CONTENT_FILE, ContentSchema.parse({ ...content, ...valid }));
}

function sortExperiences(list: Experience[]) {
  return [...list].sort(
    (a, b) => (b.end ?? "9999").localeCompare(a.end ?? "9999") || b.start.localeCompare(a.start),
  );
}

/* ---------- leitura pública ---------- */
export async function getContent(): Promise<Content> {
  const [base, collections] = await Promise.all([
    redis ? Promise.resolve(ContentSchema.parse(seed)) : readFileContent(),
    readCollections(),
  ]);
  return {
    profile: base.profile,
    skills: base.skills,
    projects: collections.projects,
    experiences: sortExperiences(collections.experiences),
  };
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
    const data = await readCollections();
    const now = new Date().toISOString();
    const item = { ...parsed.data, id: randomUUID(), createdAt: now, updatedAt: now } as Collections[C];
    (data[c] as Collections[C][]).unshift(item);
    await writeCollections(data);
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
    const data = await readCollections();
    const list = data[c] as Collections[C][];
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
    await writeCollections(data);
    return { ok: true as const, item };
  });
}

export async function deleteItem(c: CollectionName, id: string): Promise<boolean> {
  return withLock(async () => {
    const data = await readCollections();
    const list = data[c] as { id: string }[];
    const next = list.filter((i) => i.id !== id);
    if (next.length === list.length) return false;
    (data as Record<CollectionName, unknown>)[c] = next;
    await writeCollections(data);
    return true;
  });
}

/* ---------- Mensagens de contato ---------- */
async function readFileMessages(): Promise<Message[]> {
  try {
    return MessageSchema.array().parse(JSON.parse(await fs.readFile(MESSAGES_FILE, "utf8")));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function listMessages(): Promise<Message[]> {
  if (redis) {
    const raw = await redis.lrange<string>(KEY_MESSAGES, 0, -1);
    return raw.flatMap((r) => {
      const parsed = MessageSchema.safeParse(JSON.parse(r));
      return parsed.success ? [parsed.data] : [];
    });
  }
  return readFileMessages();
}

export async function addMessage(data: Pick<Message, "name" | "email" | "message">) {
  const message: Message = { ...data, id: randomUUID(), createdAt: new Date().toISOString() };
  if (redis) {
    await redis.lpush(KEY_MESSAGES, JSON.stringify(message));
    await redis.ltrim(KEY_MESSAGES, 0, MAX_MESSAGES - 1);
    return message;
  }
  return withLock(async () => {
    const messages = await readFileMessages();
    messages.unshift(message);
    await writeJsonAtomic(MESSAGES_FILE, messages.slice(0, MAX_MESSAGES));
    return message;
  });
}

export async function deleteMessage(id: string) {
  if (redis) {
    const raw = await redis.lrange<string>(KEY_MESSAGES, 0, -1);
    const target = raw.find((r) => (JSON.parse(r) as { id?: string }).id === id);
    if (!target) return false;
    await redis.lrem(KEY_MESSAGES, 1, target);
    return true;
  }
  return withLock(async () => {
    const messages = await readFileMessages();
    const next = messages.filter((m) => m.id !== id);
    if (next.length === messages.length) return false;
    await writeJsonAtomic(MESSAGES_FILE, next);
    return true;
  });
}
