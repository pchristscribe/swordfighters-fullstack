-- Migration 003: Reviews table
-- Stores editorial product reviews written by the Swordfighters team

create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  title       text,
  content     text not null,
  pros        text[] not null default '{}',
  cons        text[] not null default '{}',
  author_name text not null default 'Swordfighters Team',
  is_featured boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists reviews_product_id_idx on reviews(product_id);
create index if not exists reviews_is_featured_idx on reviews(is_featured);

create trigger reviews_updated_at before update on reviews
  for each row execute function set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────

alter table reviews enable row level security;

-- Public can read all reviews (editorial content, no user PII)
create policy "reviews_public_read" on reviews
  for select using (true);

-- Service role manages reviews via admin backend
create policy "reviews_service_all" on reviews
  for all using (auth.role() = 'service_role');
