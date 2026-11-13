import { Redis } from "@upstash/redis";

/**
 * Cliente Upstash Redis. Fica ativo quando as credenciais existem; sem elas
 * (desenvolvimento local), o projeto usa os arquivos em data/.
 *
 * A integração da Vercel pode criar as variáveis com nomes diferentes
 * (KV_REST_API_URL, UPSTASH_REDIS_REST_URL, ou com um prefixo personalizado
 * como MEUBANCO_KV_REST_API_URL). Todas essas formas são aceitas.
 */
function findEnv(names: string[]): string | undefined {
  for (const n of names) if (process.env[n]) return process.env[n];
  for (const [key, value] of Object.entries(process.env)) {
    if (value && names.some((n) => key.endsWith(`_${n}`))) return value;
  }
  return undefined;
}

function resolveCredentials(): { url: string; token: string; source: string } | null {
  const url = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
  const token = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);
  if (url && token) return { url, token, source: "rest" };

  // Só a URL TCP (rediss://default:SENHA@host.upstash.io:6379)? No Upstash,
  // a senha é o próprio token REST e o host é o mesmo.
  const tcp = findEnv(["REDIS_URL", "KV_URL"]);
  if (tcp) {
    try {
      const u = new URL(tcp);
      if (u.hostname.endsWith(".upstash.io") && u.password) {
        return { url: `https://${u.hostname}`, token: decodeURIComponent(u.password), source: "tcp-url" };
      }
    } catch {
      /* URL inválida: ignora */
    }
  }
  return null;
}

const creds = resolveCredentials();

export const redis = creds
  ? new Redis({ url: creds.url, token: creds.token, automaticDeserialization: false })
  : null;

export const redisSource = creds?.source ?? null;
