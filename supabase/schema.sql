-- ============================================================
-- DJA Sneakers – Supabase Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- updated_at trigger function
-- ─────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────
-- Table: pairs
-- ─────────────────────────────────────────
create table if not exists pairs (
  id               uuid primary key default gen_random_uuid(),
  sku              text,
  brand            text not null,
  model            text not null,
  colorway         text,
  size             text not null,
  condition        text not null check (condition in ('new','like_new','good','fair','poor')),
  purchase_price   numeric(10,2) not null default 0,
  planned_sale_price numeric(10,2),
  actual_sale_price  numeric(10,2),
  source           text,
  purchase_date    date,
  sale_date        date,
  shipping_date    date,
  platform         text,
  customer_name    text,
  tracking_number  text,
  status           text not null default 'draft' check (status in (
    'draft','in_stock','reserved','listed_on_whatnot','sold','to_ship','shipped','completed','cancelled','returned'
  )),
  notes            text,
  photo_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger pairs_updated_at
  before update on pairs
  for each row execute function set_updated_at();

-- Indexes
create index if not exists pairs_status_idx  on pairs(status);
create index if not exists pairs_brand_idx   on pairs(brand);
create index if not exists pairs_sku_idx     on pairs(sku);

-- ─────────────────────────────────────────
-- Table: stock_movements
-- ─────────────────────────────────────────
create table if not exists stock_movements (
  id             uuid primary key default gen_random_uuid(),
  pair_id        uuid not null references pairs(id) on delete cascade,
  movement_type  text not null,
  old_status     text,
  new_status     text not null,
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists stock_movements_pair_id_idx on stock_movements(pair_id);

-- ─────────────────────────────────────────
-- Table: whatnot_import_exports
-- ─────────────────────────────────────────
create table if not exists whatnot_import_exports (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('import','export')),
  filename      text not null,
  row_count     int not null default 0,
  success_count int not null default 0,
  error_count   int not null default 0,
  raw_log       text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- Row Level Security (permissive for solo use)
-- ─────────────────────────────────────────
alter table pairs enable row level security;
alter table stock_movements enable row level security;
alter table whatnot_import_exports enable row level security;

create policy "Allow all on pairs" on pairs for all using (true) with check (true);
create policy "Allow all on stock_movements" on stock_movements for all using (true) with check (true);
create policy "Allow all on whatnot_import_exports" on whatnot_import_exports for all using (true) with check (true);

-- ─────────────────────────────────────────
-- Demo data (12 pairs)
-- ─────────────────────────────────────────
insert into pairs (sku, brand, model, colorway, size, condition, purchase_price, planned_sale_price, actual_sale_price, source, purchase_date, sale_date, platform, customer_name, tracking_number, status, notes) values
  ('NK-AJ1-001', 'Jordan', 'Air Jordan 1 Retro High OG', 'Chicago', '42', 'new', 185.00, 350.00, null, 'SNKRS', '2024-11-01', null, null, null, null, 'in_stock', 'DS, boite parfaite'),
  ('NB-550-002', 'New Balance', '550', 'White Green', '41.5', 'like_new', 95.00, 160.00, null, 'Vinted', '2024-10-15', null, null, null, null, 'in_stock', 'Légères traces semelle'),
  ('AD-YZ-003', 'Adidas', 'Yeezy Boost 350 V2', 'Zebra', '43', 'new', 210.00, 280.00, 265.00, 'StockX', '2024-09-20', '2024-12-01', 'Whatnot', 'user_sneakerhead42', null, 'sold', 'Vendu live Whatnot'),
  ('NK-AF1-004', 'Nike', 'Air Force 1 Low', 'Triple White', '44', 'good', 55.00, 85.00, null, 'Vide-greniers', '2024-10-05', null, 'Whatnot', null, null, 'listed_on_whatnot', 'Listée 75€'),
  ('NK-AJ4-005', 'Jordan', 'Air Jordan 4 Retro', 'Military Black', '42.5', 'new', 220.00, 320.00, 310.00, 'SNKRS', '2024-08-12', '2024-11-20', 'Whatnot', 'sneaker_paris', null, 'to_ship', 'En attente suivi'),
  ('NB-993-006', 'New Balance', '993', 'Grey', '40', 'like_new', 150.00, 200.00, null, 'Grailed', '2024-10-28', null, null, null, null, 'in_stock', null),
  ('AD-NMD-007', 'Adidas', 'NMD R1', 'Core Black', '43.5', 'good', 60.00, 95.00, 90.00, 'Vinted', '2024-07-30', '2024-10-10', 'Vinted', 'buyer_nmd', '1Z999AA10123456784', 'shipped', null),
  ('NK-SB-008', 'Nike', 'SB Dunk Low', 'Panda', '41', 'new', 120.00, 185.00, null, 'SNKRS', '2024-11-15', null, 'Instagram', null, null, 'reserved', 'Réservé pour un acheteur insta'),
  ('NK-AJ1-009', 'Jordan', 'Air Jordan 1 Mid', 'Black Toe', '45', 'fair', 35.00, 65.00, 60.00, 'Leboncoin', '2024-06-01', '2024-09-15', 'Vinted', 'customer_foot', '1Z999AA10123456785', 'completed', null),
  ('AD-GAZELLE-010', 'Adidas', 'Gazelle', 'Green/White', '42', 'like_new', 45.00, 80.00, null, 'Vide-greniers', '2024-04-10', null, null, null, null, 'in_stock', 'Achat brocante'),
  ('NK-PEGASUS-011', 'Nike', 'Air Zoom Pegasus 40', 'Blue', '43', 'good', 70.00, 100.00, null, 'Vinted', '2024-03-20', null, null, null, null, 'draft', 'A photographier'),
  ('NB-2002R-012', 'New Balance', '2002R', 'Stone Island Grey', '41', 'new', 180.00, 260.00, null, 'StockX', '2024-12-01', null, null, null, null, 'in_stock', 'Collab rare');
