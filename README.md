# Catira Control

PWA pessoal para gestão de compra e venda de acessórios (capas, relógios, etc). Calcula o lucro real do negócio automaticamente — não só por item — e mostra o preço mínimo pra não ter prejuízo em cada venda.

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

Projeto criado e conectado ao repositório GitHub:
**`catira-control-app`**, na conta Vercel `pedrocastro`, apontando para
`pedroaugustogmc-source/APP-PWA-CAIXA`. Cada push nesta branch dispara um
build automático (Preview, já que a branch de produção do projeto é
`main`). `.env.production` está versionado no repo, então o build já sai
funcional sem configurar nada manualmente no painel.

**Não consegui confirmar visualmente o resultado do build**: as chamadas
de leitura da API do Vercel (`list_projects`, `get_project`,
`get_deployment`) voltaram vazias/404 para esse projeto mesmo depois da
criação ter respondido com sucesso — uma inconsistência da integração que
não depende do código do app. O acesso direto a `*.vercel.app` também é
bloqueado pela política de rede deste ambiente de desenvolvimento, então
não deu pra checar por fora também.

**Para confirmar**: abra
[vercel.com/pedrocastro/catira-control-app](https://vercel.com/pedrocastro/catira-control-app)
no seu navegador. Se não houver nenhum deployment lá, o motivo mais
provável é o GitHub App do Vercel não estar autorizado neste repositório
ainda — a Vercel pede essa autorização (instalação do app na conta/repo
GitHub) na primeira vez que conecta um projeto, e isso não é algo que a
API consiga fazer sozinha. Autorizando pelo painel e dando um novo push
(ou clicando em "Redeploy"), o build deve rodar normalmente — o app já
está pronto pra isso.

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
