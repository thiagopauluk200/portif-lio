# Portfólio + Painel Admin

Portfólio pessoal em **Next.js 15 (App Router)**, **Tailwind CSS v4** e **Framer Motion**, com painel administrativo protegido por **chave secreta em variável de ambiente**.

## Como rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Gere uma chave secreta forte
npm run gen:key

# 3. Crie o arquivo .env.local (copie do exemplo) e cole a chave
cp .env.example .env.local
#    ADMIN_SECRET_KEY=<cole aqui a chave gerada>

# 4. Rode
npm run dev
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/admin (pede a chave definida em `ADMIN_SECRET_KEY`)

Para produção: `npm run build && npm start`.

### Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `ADMIN_SECRET_KEY` | sim | Chave do admin. **Mínimo 32 caracteres**; se for menor, o painel fica desativado. |
| `CONTACT_WEBHOOK_URL` | não | Webhook do Discord ou Slack que recebe um aviso a cada nova mensagem de contato. |

> `.env.local` está no `.gitignore`. Nenhuma credencial existe no código.
> Para trocar a chave, altere a variável e reinicie: **todas as sessões abertas deixam de valer na hora**.

## Personalização

- **Perfil, skills e estatísticas** → `data/content.json`, campos `profile` e `skills`.
  - No `headline`, palavras entre `*asteriscos*` aparecem em serifa itálica com a cor de destaque.
  - Ícones de skill disponíveis: `layout, server, database, cloud, terminal, palette, users, brain, zap, shield, smartphone, box, workflow, code`.
- **Projetos e experiências** → pelo painel `/admin`.
- **Cores e fontes** → `app/globals.css`, bloco `@theme`.

## Estrutura de pastas

```
├── app/
│   ├── page.tsx                  # Portfólio público (estático + revalidação sob demanda)
│   ├── layout.tsx                # Fontes, metadados (SEO gerado a partir do perfil)
│   ├── globals.css               # Tema Tailwind v4 (cores, fontes, animações)
│   ├── admin/
│   │   ├── page.tsx              # Dashboard (verifica a sessão de novo no servidor)
│   │   └── login/page.tsx        # Entrada da chave
│   └── api/
│       ├── contact/route.ts      # Formulário de contato (validação, honeypot, rate limit)
│       └── admin/
│           ├── auth/route.ts             # POST: chave → cookie de sessão · DELETE: logout
│           ├── [collection]/route.ts     # GET lista · POST cria   (projects | experiences)
│           ├── [collection]/[id]/route.ts# PUT edita · DELETE remove
│           └── messages/…                # Lista e remove mensagens de contato
├── components/
│   ├── site/                     # Navbar, Hero, Skills, Projects, Experience, Contact, Footer
│   ├── admin/                    # Dashboard, formulários, cliente da API
│   └── ui/                       # Reveal, SpotlightCard, SectionHeading, ícones…
├── lib/
│   ├── auth.ts                   # Sessão HMAC, comparação em tempo constante, anti-CSRF
│   ├── store.ts                  # Persistência JSON (escrita atômica e serializada)
│   ├── schemas.ts                # Validação Zod (fonte única dos tipos)
│   └── rate-limit.ts
├── data/
│   ├── content.json              # Conteúdo do site (versionado)
│   └── messages.json             # Mensagens de contato (criado na hora, fora do git)
└── middleware.ts                 # Bloqueia /admin/* e /api/admin/* sem sessão válida
```

## Modelo de segurança

1. **Uma única credencial:** `ADMIN_SECRET_KEY`, que só existe no ambiente do servidor. Não há usuários, senhas nem hashes guardados.
2. **Troca da chave por sessão:** a chave é enviada uma vez (`POST /api/admin/auth`) e trocada por um cookie `httpOnly`, `SameSite=Strict`, `Secure` (em produção), assinado com HMAC-SHA256 e válido por 8 horas. O JavaScript da página nunca tem acesso à chave nem ao cookie.
3. **Duas barreiras:** o `middleware.ts` bloqueia as rotas do admin, e cada route handler e página do admin valida a sessão de novo.
4. **Contra força bruta:** no máximo 5 tentativas a cada 15 minutos por IP, mais 600 ms de atraso a cada erro. A comparação é feita em tempo constante, sobre o HMAC da chave, para não vazar tempo nem tamanho.
5. **Contra CSRF:** além do `SameSite=Strict`, requisições que alteram dados exigem `Origin` igual ao host.
6. **Validação:** todo dado recebido passa pelo Zod, o corpo da requisição é limitado a 64 KB e só são aceitas URLs `http(s)` (bloqueia `javascript:`).
7. **Cabeçalhos:** `X-Frame-Options`, `nosniff`, HSTS e `Referrer-Policy` em todas as rotas. O admin ainda leva `noindex` e `no-store`.

**Por que a chave não vai na URL (`/admin?token=…`)?** Tokens em URL ficam no histórico do navegador, nos logs do servidor e de proxies, e no cabeçalho `Referer`. O cookie de sessão evita tudo isso.

**Automação / CLI:** as rotas de API também aceitam `Authorization: Bearer <ADMIN_SECRET_KEY>`:

```bash
curl -H "Authorization: Bearer $ADMIN_SECRET_KEY" http://localhost:3000/api/admin/projects
```

## Persistência

| Ambiente | Projetos, trajetória e mensagens | Perfil e skills |
|---|---|---|
| Local () | arquivos em  |  |
| Vercel | **Upstash Redis** (gratuito) |  (atualiza a cada ) |

O modo é escolhido automaticamente: se existirem  e  (criadas pela integração Upstash da Vercel), usa Redis. O rate limit também passa a ser compartilhado entre instâncias.

No primeiro acesso em produção, os projetos e experiências do  servem de ponto de partida. Depois disso, quem manda é o painel .

## Deploy na Vercel

1. vercel.com → **Add New → Project** → importe o repositório.
2. **Settings → Environment Variables** →  (gere uma nova com ).
3. **Storage → Create Database → Upstash (Redis)** → plano Free → conecte ao projeto.
4. **Deployments → Redeploy** para aplicar as variáveis.
