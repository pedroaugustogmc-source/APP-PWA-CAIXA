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
- [ ] Fase 1 — Banco de dados (migrations + RLS)
- [ ] Fase 2 — MVP funcional (CRUD, cálculos, dashboard)
- [ ] Fase 3 — Configuração PWA (manifest, service worker, iOS)
- [ ] Fase 4 — KPIs avançados e gráficos
- [ ] Fase 5 — Deploy no Vercel
