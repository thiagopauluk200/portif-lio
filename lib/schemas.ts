import { z } from "zod";

/* ---------- helpers ---------- */
const httpUrl = z
  .string()
  .trim()
  .max(500)
  .url("URL inválida")
  .refine((u) => /^https?:\/\//i.test(u), "Use um link http(s)");

/** Campo de URL opcional: aceita "" e converte para undefined. */
const optionalUrl = z
  .union([z.literal(""), httpUrl])
  .optional()
  .transform((v) => (v ? v : undefined));

const tagList = z.array(z.string().trim().min(1).max(30)).max(12).default([]);
/** Aceita só o ano ("2024") ou ano e mês ("2024-03"). */
const yearMonth = z.string().trim().regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "Use AAAA ou AAAA-MM");

/* ---------- Projetos ---------- */
export const ProjectInputSchema = z.object({
  title: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  description: z.string().trim().min(10, "Mínimo 10 caracteres").max(600),
  tags: tagList,
  repoUrl: optionalUrl,
  demoUrl: optionalUrl,
  image: optionalUrl,
  year: z.number().int().min(1990).max(2100).optional(),
  featured: z.boolean().default(false),
});

export const ProjectSchema = ProjectInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/* ---------- Experiências ---------- */
const ExperienceBase = z.object({
  role: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  organization: z.string().trim().min(2, "Mínimo 2 caracteres").max(80),
  type: z.enum(["work", "education", "certification"]),
  start: yearMonth,
  end: z
    .union([z.literal(""), yearMonth])
    .optional()
    .transform((v) => (v ? v : undefined)),
  location: z.string().trim().max(80).optional(),
  description: z.string().trim().min(10, "Mínimo 10 caracteres").max(800),
  highlights: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
  tags: tagList,
});

const endAfterStart = (e: { start: string; end?: string }) => !e.end || e.end >= e.start;

export const ExperienceInputSchema = ExperienceBase.refine(endAfterStart, {
  message: "A data de término deve ser posterior ao início",
  path: ["end"],
});

export const ExperienceSchema = ExperienceBase.extend({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/* ---------- Perfil e Skills (editados em data/content.json) ---------- */
export const ProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  headline: z.string(),
  summary: z.string(),
  location: z.string(),
  timezone: z.string().default("America/Sao_Paulo"),
  email: z.string().email(),
  available: z.boolean().default(true),
  avatar: z.string().optional(),
  resumeUrl: z.string().optional(),
  socials: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    x: z.string().optional(),
  }),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).max(4),
});

export const SkillCategorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  items: z.array(z.string()),
});

export const ContentSchema = z.object({
  profile: ProfileSchema,
  skills: z.array(SkillCategorySchema),
  projects: z.array(ProjectSchema),
  experiences: z.array(ExperienceSchema),
});

/* ---------- Configurações editáveis pelo painel ---------- */
export const SettingsSchema = z.object({
  avatar: optionalUrl,
});

/* ---------- Contato ---------- */
export const ContactInputSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(80),
  email: z.string().trim().email("E-mail inválido").max(120),
  message: z.string().trim().min(10, "Mensagem muito curta").max(2000),
  /** honeypot — humanos não preenchem */
  website: z.string().max(200).optional(),
});

export const MessageSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  message: z.string(),
  createdAt: z.string(),
});

/* ---------- Tipos ---------- */
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectInput = z.input<typeof ProjectInputSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type ExperienceInput = z.input<typeof ExperienceInputSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
export type SkillCategory = z.infer<typeof SkillCategorySchema>;
export type Content = z.infer<typeof ContentSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
