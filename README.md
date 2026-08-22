# Catira Control

PWA pessoal para gestão de compra e venda de acessórios (capas, relógios, etc). Cada item carrega seu próprio custo de compra e despesas extras (frete, embalagem...) e o app calcula o custo total, lucro, margem, ROI e preço mínimo automaticamente. Funciona online e offline.

> Status: em construção (ver fases abaixo). Este README é atualizado a cada fase.

## Stack

- Vite + React + TypeScript (strict)
- Tailwind CSS v4
- vite-plugin-pwa (Workbox) — service worker + manifest
- Supabase (Postgres + Auth + Row Level Security)
- Recharts
- Deploy: Vercel

## Estrutura

```
/src
  /components   componentes de UI reutilizáveis
  /pages        telas do app
  /lib          cliente Supabase + fórmulas de cálculo centralizadas
  /hooks        hooks de dados (React Query-like, via Supabase)
  /types        tipos TS (schema do banco, domínio)
/supabase
  /migrations   SQL versionado do schema
public/
  ícones do PWA (192x192, 512x512, maskable)
```

## Setup local

Pré-requisitos: Node 20+.

```bash
npm install
cp .env.example .env.local
# preencha .env.local com as chaves do seu projeto Supabase
npm run dev
```

### Variáveis de ambiente

| Variável | Onde encontrar |
|---|---|
| `VITE_SUPABASE_URL` | Painel Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Painel Supabase → Project Settings → API (chave `anon`/`public`) |

Nunca comite `.env.local` — ele já está no `.gitignore`.

O `.env.production` **é** versionado de propósito: contém só a `anon key`
pública do Supabase (não é segredo — é protegida por RLS e o Vite já a
embute em qualquer bundle de produção de qualquer forma). Isso deixa o
deploy no Vercel funcionar sem precisar configurar variáveis de ambiente
no painel.

### Banco de dados

As migrations SQL ficam em `supabase/migrations`. Aplique-as no seu projeto Supabase (SQL Editor ou Supabase CLI) na ordem numérica dos arquivos.

### Modelo de dados

Não existe mais "lote de compra" nem "despesa geral" separados. Cada
**item** é autossuficiente: guarda o próprio custo de compra
(`custo_compra`), uma lista livre de despesas extras (`custos_extras`,
ex.: frete, embalagem) e, opcionalmente, quantos dias você planeja ficar
com ele antes de vender (`dias_planejados`). O custo total, lucro, margem,
ROI e preço mínimo são todos derivados desses campos em
`src/lib/calculations.ts` — nunca duplicados em componente.

Quando `dias_planejados` não é definido, o alerta de "item parado" cai no
prazo padrão configurado em Ajustes.

### Uso offline

O app funciona com a conexão caída. Leituras vêm do cache do service
worker (Workbox, `NetworkFirst` pras chamadas ao Supabase). Duas ações de
escrita continuam funcionando offline — cadastrar um item novo e
registrar uma venda — guardadas numa fila no IndexedDB
(`src/lib/offlineOutbox.ts`) e reenviadas automaticamente assim que a
conexão volta. O selo no cabeçalho do app mostra "Offline" ou "Enviando
N" enquanto há pendências. As demais ações (cancelar venda, marcar
perdido, excluir) exigem conexão.

## Scripts

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (tsc -b && vite build)
npm run preview   # servir o build localmente
npm run lint      # oxlint
```

## Roadmap de fases

- [x] Fase 0 — Setup do projeto
- [x] Fase 1 — Banco de dados (migrations + RLS)
- [x] Fase 2 — MVP funcional (CRUD, cálculos, dashboard)
- [x] Fase 3 — Configuração PWA (manifest, service worker, iOS)
- [x] Fase 4 — KPIs avançados e gráficos
- [x] Fase 5 — Deploy no Vercel (ver nota abaixo)

## Deploy no Vercel

**Status: no ar.** Projeto `catira-control-app` (conta Vercel `pedrocastro`)
conectado via GitHub App a `pedroaugustogmc-source/APP-PWA-CAIXA`. O
check do GitHub no commit confirma `Vercel: Deployment has completed` e o
bot do Vercel comentou na PR com status **Ready**:

- Preview desta branch: https://catira-control-app-git-claude-catira-control-6e0219-pedrocastro.vercel.app
- Painel do projeto: https://vercel.com/pedrocastro/catira-control-app

(As ferramentas de leitura da API do Vercel usadas nesta sessão não
enxergam o projeto — provavelmente um problema de escopo da integração —
mas o check do GitHub e o comentário do bot são a fonte de verdade do
próprio Vercel e confirmam o deploy.)

`.env.production` está versionado no repo (é a `anon key` pública do
Supabase, protegida por RLS), então o build sai funcional sem configurar
nada manualmente no painel. Como a branch de produção do projeto é
`main`, isso ainda é uma *Preview* deployment — assim que a PR for
mesclada em `main`, o mesmo build é promovido automaticamente para o
domínio de produção (`catira-control-app.vercel.app` ou um domínio
customizado, se configurado).

## Sobre o projeto Supabase

O projeto Supabase usado (`rurqtctrbzxppeickltz`) já hospeda outro app do
usuário (gestão de fazenda/gado — tabelas `animais`, `pastos`, `vacinas_*`
etc.). As tabelas do Catira Control convivem no mesmo schema `public`, sem
conflito de nomes, e o RLS (`auth.uid() = user_id`) isola os dados por
usuário normalmente. Se preferir um projeto Supabase dedicado só para este
app, é só criar um novo projeto e reaplicar as migrations de
`supabase/migrations` nele.

## Auditoria PWA

O Lighthouse 13.x removeu a categoria "PWA" do relatório padrão (o Google
descontinuou esse score dedicado). Validação feita manualmente com o build
de produção (`npm run build && npm run preview`):

- Categorias que ainda existem no Lighthouse: **Performance 100**,
  **Best Practices 100**, **Accessibility 96**, **SEO 91**.
- `manifest.webmanifest` válido: name, short_name, ícones 192/512/maskable,
  `start_url`, `display: standalone`.
- Service worker ativo controlando a página (`sw.js`, escopo `/`).
- Ícones (192, 512, maskable, apple-touch-icon) servidos com `200` e
  `image/png`.
- Zero erros de console no carregamento.

## Criar seu usuário

O app não tem cadastro público (uso pessoal, login único). Crie seu usuário
pelo painel do Supabase: **Authentication → Users → Add user**, marcando
"Auto Confirm User". Depois é só entrar com esse e-mail/senha no app.
