-- SEPuente – Supabase inicial
-- Aplica con: supabase db push o en el SQL editor del dashboard

-- ─── Extensiones ────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ─── Transacciones SEP-24 ───────────────────────────────────────────────────
create table if not exists sep24_transactions (
  id                    uuid primary key default gen_random_uuid(),
  kind                  text not null check (kind in ('deposit', 'withdrawal')),
  status                text not null default 'incomplete',
  stellar_account       text not null,
  amount_in             numeric(18,7),
  amount_out            numeric(18,7),
  amount_fee            numeric(18,7),
  asset_code            text not null default 'TMXN',
  asset_issuer          text not null,
  clabe                 text,
  spei_reference        text,
  stellar_transaction_id text,
  more_info_url         text,
  started_at            timestamptz not null default now(),
  completed_at          timestamptz,
  updated_at            timestamptz not null default now(),
  driver_order_id       text,
  anchor_account        text,
  anchor_memo           text,
  anchor_memo_type      text,
  claimable_balance_id  text,
  error_message         text
);

-- Índices para las consultas más frecuentes
create index if not exists sep24_tx_account on sep24_transactions (stellar_account);
create index if not exists sep24_tx_status  on sep24_transactions (status);
create index if not exists sep24_tx_started on sep24_transactions (started_at desc);

-- RLS: cada wallet solo ve sus propias transacciones
-- (el service role de servidor siempre tiene acceso total)
alter table sep24_transactions enable row level security;

create policy "Users see own txs" on sep24_transactions
  for select
  using (stellar_account = current_setting('app.stellar_account', true));

-- ─── Quotes SEP-38 ──────────────────────────────────────────────────────────
create table if not exists sep38_quotes (
  id               uuid primary key default gen_random_uuid(),
  sell_asset       text not null,
  buy_asset        text not null,
  sell_amount      numeric(18,7) not null,
  buy_amount       numeric(18,7) not null,
  price            numeric(18,7) not null,
  fee              numeric(18,7) not null,
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now(),
  stellar_account  text,
  context          text default 'sep24'
);

create index if not exists sep38_quotes_account on sep38_quotes (stellar_account);

alter table sep38_quotes enable row level security;

create policy "Users see own quotes" on sep38_quotes
  for select
  using (stellar_account = current_setting('app.stellar_account', true));

-- ─── Faucet requests (rate limiting por cuenta) ─────────────────────────────
create table if not exists faucet_requests (
  id               uuid primary key default gen_random_uuid(),
  stellar_account  text not null,
  created_at       timestamptz not null default now()
);

create index if not exists faucet_req_account_day on faucet_requests (stellar_account, created_at);

alter table faucet_requests enable row level security;
-- Solo el service role escribe/lee esta tabla
