# Deploy & infraestrutura (Supabase + Vercel)

## Provedores
- **Supabase** (projeto `TABLOID-MAKER`, ref `jhpktdyfwqrfvslilxdr`, região `us-west-2`):
  Postgres 17 + Auth (e-mail/senha) + Storage (bucket `images`).
- **Vercel**: hospedagem do Next.js.

## Estado atual (já provisionado)
- ✅ **Schema** aplicado no Supabase (migration `20260909000000_init`).
- ✅ **RLS** habilitado em todas as tabelas do schema (`20260909000100_enable_rls_lockdown`).
  O app usa o Postgres via **Prisma** (role owner, que ignora RLS); a API pública (anon) fica
  **bloqueada**. Se um dia formos usar PostgREST/Supabase client no cliente, criaremos policies.
- ✅ **Seed** de referência: 4 formatos de página + 9 dinâmicas comerciais.
- ✅ **Bucket** `images` (público) criado no Storage.

## Como a app conecta (Prisma × Supabase)
Prisma continua sendo o ORM. O Supabase é o Postgres gerenciado.
- `DATABASE_URL` → **Transaction pooler** (porta 6543, `?pgbouncer=true`) — usado pelo app na Vercel.
- `DIRECT_URL` → conexão direta (porta 5432) — usado por migrations.
- Strings em: Supabase → **Project Settings → Database → Connection string**.

> Como o schema já foi aplicado via MCP, ao rodar migrations pela primeira vez com credenciais,
> faça o **baseline**: `prisma migrate resolve --applied 20260909000000_init` e
> `... 20260909000100_enable_rls_lockdown` (marca como aplicadas sem reexecutar), depois
> `prisma migrate deploy` para as próximas.

## Auth (Supabase Auth — e-mail/senha, sem 2FA)
- `auth.users` é gerenciado pelo Supabase. A tabela `public.User` é o **perfil** da app
  (`id = auth.users.id`, `role` = ADMIN/EDITOR/REVIEWER).
- No cadastro, criamos a linha de perfil correspondente (fatia 2).

## Variáveis de ambiente (Vercel → Project → Settings → Environment Variables)
```
DATABASE_URL                       (pooler 6543, ?pgbouncer=true)
DIRECT_URL                         (direta 5432)
NEXT_PUBLIC_SUPABASE_URL           https://jhpktdyfwqrfvslilxdr.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY   sb_publishable_...
SUPABASE_SECRET_KEY                sb_secret_...   (Server-side only; marcar como Secret)
AUTH_SECRET                        (aleatório)
```
> ⚠️ A `SUPABASE_SECRET_KEY` compartilhada no chat deve ser **rotacionada** no painel do Supabase.

## Exportação PNG/PDF na Vercel
Mantido o plano do `ARQUITETURA.md §10`: `@sparticuz/chromium` + `puppeteer-core` na função de
export; contingência = worker externo. A validar na fatia 4.

## Próximos passos de deploy
1. Definir `DATABASE_URL`/`DIRECT_URL` (do Supabase) nas envs da Vercel.
2. Conectar o repositório à Vercel (projeto Next.js) — pode ser via MCP da Vercel.
3. Publicar preview a cada fatia a partir da fatia 2.

## Imagens via Google Drive (conta de serviço)
As imagens são nomeadas por **COD_ERP** (ex.: `2900.jpg`) e casadas com as apresentações.

Setup (uma vez):
1. Google Cloud Console → crie um **projeto** (ou use um existente) → **APIs & Services → Enable APIs** → habilite **Google Drive API**.
2. **IAM & Admin → Service Accounts → Create service account** → crie e, em **Keys**, **Add key → JSON** (baixa o arquivo).
3. Copie o **e-mail** da conta de serviço (algo como `...@...iam.gserviceaccount.com`) e **compartilhe a pasta do Drive** com esse e-mail (permissão Leitor).
4. Converta o JSON em base64 e coloque nas envs da Vercel:
   - `GOOGLE_SERVICE_ACCOUNT_JSON` = `base64 do arquivo .json` (ex.: `base64 -w0 chave.json`)
   - `GOOGLE_DRIVE_FOLDER_ID` = ID da pasta (opcional; dá p/ colar o link na tela)
5. Em **Admin → Produtos → Imagens do Drive**: cole o link da pasta → **Procurar imagens** → **Importar**.

As imagens vão para o Supabase Storage (bucket `images`, caminho `sku/<COD_ERP>.<ext>`) e preenchem `Sku.imageUrl`.
