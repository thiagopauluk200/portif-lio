import { Redis } from "@upstash/redis";

/**
 * Cliente Upstash Redis. Fica ativo quando as variáveis existem — a integração
 * da Vercel (Storage → Upstash) cria KV_REST_API_URL / KV_REST_API_TOKEN sozinha.
 * Sem elas (desenvolvimento local), o projeto usa os arquivos em data/.
 */
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token, automaticDeserialization: false }) : null;
