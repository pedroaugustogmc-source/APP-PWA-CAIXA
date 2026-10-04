# PHONEITZ

PWA para gestão de loja de celular: estoque serializado por IMEI, venda com
múltiplos itens e múltiplas formas de pagamento, trade-in, comissão de
vendedor e simulador de upgrade — com margem real calculada automaticamente
em precisão decimal (nunca float). Funciona online e offline para cadastro.

## Stack

- Vite + React + TypeScript (strict)
- Tailwind CSS v4
- vite-plugin-pwa (Workbox) — service worker + manifest
- Supabase (Postgres + Auth + Row Level Security)
- decimal.js — todo valor monetário é `Decimal`, nunca `number` puro
- Deploy: Vercel

## Estrutura

```
/src
  /components   componentes de UI reutilizáveis
  /pages        telas do app
  /lib          cliente Supabase + fórmulas de cálculo centralizadas
  /hooks        hooks de dados (via Supabase)
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

Cada **loja** (`lojas`, uma por usuário nesta fase) tem seu próprio estoque e
vendas. Um **aparelho** (`aparelhos`) é uma unidade física serializada por
IMEI (validado por formato + dígito verificador Luhn, direto no banco) —
guarda custo de compra, custos extras (frete, embalagem...) e condição, mas
**não** guarda mais dados de venda na própria linha. Um **acessório**
(`acessorios`) é um produto fungível com estoque por quantidade (capa,
película, carregador).

Uma **venda** (`vendas`) é uma entidade própria com múltiplos itens
(`venda_itens` — aparelho ou acessório), múltiplas formas de pagamento
(`venda_pagamentos` — dinheiro, Pix, cartão, boleto, financiamento) e,
opcionalmente, um trade-in (`venda_trade_ins` — aparelho usado recebido como
parte do pagamento). Tudo isso é gravado atomicamente pelo RPC
`phoneitz_concluir_venda`: ou a venda inteira é confirmada (baixa o estoque,
registra os pagamentos, cria o aparelho do trade-in), ou nada é gravado. Um
mesmo aparelho nunca pode ser vendido duas vezes — trava de concorrência via
lock de linha implícito no `UPDATE ... WHERE status IN (...)`.

Margem, custo total e preço mínimo são todos derivados em
`src/lib/calculations.ts` — nunca duplicados em componente. O
`depreciacao_modelos` alimenta o Simulador de upgrade (depreciação linear
por modelo/condição, editável em Ajustes). Toda mutação em tabela do
PHONEITZ é registrada em `phoneitz_auditoria` por trigger — não depende de
nenhum hook lembrar de gravar.

Quando `dias_planejados` não é definido no aparelho, o alerta de "parado"
cai no prazo padrão configurado em Ajustes.

### Uso offline

O app funciona com a conexão caída. Leituras vêm do cache do service
worker (Workbox, `NetworkFirst` pras chamadas ao Supabase). Cadastro de
aparelho/acessório continua funcionando offline, guardado numa fila no
IndexedDB (`src/lib/offlineOutbox.ts`) e reenviado automaticamente assim que
a conexão volta. O selo no cabeçalho do app mostra "Offline" ou "Enviando N"
enquanto há pendências. **Nova venda exige conexão** — `concluir_venda` é
uma operação atômica multi-tabela via RPC, não um insert simples que dá pra
enfileirar e reenviar depois sem risco de corrida (ex.: duas vendas offline
do mesmo IMEI, cada uma achando que o aparelho ainda estava livre).

## Scripts

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (tsc -b && vite build)
npm run preview   # servir o build localmente
npm run lint      # oxlint
npm run test      # vitest
```

## Deploy

Deploy automático via Vercel, conectado via GitHub App ao repositório —
todo push na branch abre/atualiza uma preview deployment, e merge em `main`
promove pra produção automaticamente. `vercel.json` define os headers de
segurança (`X-Frame-Options`, `X-Content-Type-Options`,
`Strict-Transport-Security` etc.) aplicados a todas as respostas.

`.env.production` está versionado no repo (é a `anon key` pública do
Supabase, protegida por RLS), então o build sai funcional sem configurar
nada manualmente no painel do Vercel.

## Sobre o projeto Supabase

O projeto Supabase usado (`rurqtctrbzxppeickltz`) também hospeda outro app
do mesmo usuário (gestão de fazenda/gado — tabelas `animais`, `pastos`,
`vacinas_*` etc.). As tabelas do PHONEITZ convivem no mesmo schema `public`
sem conflito de nomes (funções novas usam o prefixo `phoneitz_` por
segurança — `CREATE OR REPLACE FUNCTION` sobrescreve silenciosamente em
colisão, diferente de `CREATE TABLE`), e o RLS (`auth.uid() = user_id`)
isola os dados por usuário normalmente. Se preferir um projeto Supabase
dedicado só para este app, é só criar um novo projeto e reaplicar as
migrations de `supabase/migrations` nele.

PHONEITZ é a evolução do antigo "Catira Control" — mesmo repositório, dados
de vendas históricos migrados sem perda (ver `supabase/migrations/0018_vendas.sql`).

## Autenticação

Cada pessoa cria sua própria conta direto na tela de login (aba "Criar
conta"), via Supabase Auth. Dependendo da configuração do projeto Supabase
(**Authentication → Providers → Email → Confirm email**), pode ser exigida
confirmação por e-mail antes do primeiro acesso.
