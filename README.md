# Catira Control

PWA pessoal para gestão de compra e venda de qualquer tipo de produto. Cada item carrega seu próprio custo de compra e despesas extras (frete, embalagem...) e o app calcula o custo total, lucro, margem, ROI e preço mínimo automaticamente. Funciona online e offline.

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

Não existe "lote de compra" nem "despesa geral" separados. Cada **item**
é autossuficiente: guarda o próprio custo de compra (`custo_compra`), uma
lista livre de despesas extras (`custos_extras`, ex.: frete, embalagem) e,
opcionalmente, quantos dias você planeja ficar com ele antes de vender
(`dias_planejados`). O custo total, lucro, margem, ROI e preço mínimo são
todos derivados desses campos em `src/lib/calculations.ts` — nunca
duplicados em componente.

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
npm run test      # vitest
```

## Deploy

Projeto `catira-control-app` no Vercel, conectado via GitHub App ao
repositório — todo push na branch abre/atualiza uma preview deployment, e
merge em `main` promove pra produção automaticamente.

`.env.production` está versionado no repo (é a `anon key` pública do
Supabase, protegida por RLS), então o build sai funcional sem configurar
nada manualmente no painel do Vercel.

## Sobre o projeto Supabase

O projeto Supabase usado (`rurqtctrbzxppeickltz`) também hospeda outro
app do mesmo usuário (gestão de fazenda/gado — tabelas `animais`,
`pastos`, `vacinas_*` etc.). As tabelas do Catira Control convivem no
mesmo schema `public`, sem conflito de nomes, e o RLS
(`auth.uid() = user_id`) isola os dados por usuário normalmente. Se
preferir um projeto Supabase dedicado só para este app, é só criar um
novo projeto e reaplicar as migrations de `supabase/migrations` nele.

## Autenticação

Cada pessoa cria sua própria conta direto na tela de login (aba "Criar
conta"), via Supabase Auth. Dependendo da configuração do projeto Supabase
(**Authentication → Providers → Email → Confirm email**), pode ser exigida
confirmação por e-mail antes do primeiro acesso.
