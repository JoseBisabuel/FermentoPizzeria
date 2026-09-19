-- ============================================================
-- FERMENTO - Esquema de base de datos
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo)
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ROLES / PERFILES ----------
create type user_role as enum ('admin', 'mesero');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'mesero',
  full_name text,
  created_at timestamptz not null default now()
);

-- Helper: rol del usuario autenticado actual
create or replace function public.current_role()
returns user_role
language sql stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()) = 'admin', false)
$$;

-- ---------- AJUSTES GENERALES (logo, whatsapp, etc.) ----------
create table settings (
  id int primary key default 1,
  logo_url text,
  whatsapp_number text default '573193034610',
  business_name text default 'Fermento',
  constraint single_row check (id = 1)
);
insert into settings (id) values (1);

-- ---------- CATEGORÍAS ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTOS ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  name text not null,
  description text default '',
  image_url text,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- PRECIOS POR PRESENTACIÓN (20cm/30cm/panzerotti/único...) ----------
create table product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size_label text not null,       -- ej: '20cm', '30cm', 'Panzerotti', 'Único'
  price numeric(10,2) not null,
  sort_order int not null default 0
);

-- ---------- MESAS ----------
create type table_status as enum ('libre', 'ocupada');

create table restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,             -- ej: 'Mesa 1'
  status table_status not null default 'libre',
  sort_order int not null default 0
);

-- ---------- PEDIDOS (una "orden" abierta por mesa/servicio) ----------
create type order_status as enum ('abierta', 'cerrada');

create table orders (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null references restaurant_tables(id) on delete restrict,
  status order_status not null default 'abierta',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid references profiles(id),
  invoice_printed boolean not null default false
);

-- ---------- ITEMS DEL PEDIDO ----------
create type item_status as enum ('pendiente', 'enviado');

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,      -- snapshot del nombre al momento de pedir
  size_label text not null,        -- snapshot de la presentación
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  status item_status not null default 'pendiente',
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_products_category on products(category_id);
create index idx_prices_product on product_prices(product_id);
create index idx_orders_table on orders(table_id);
create index idx_orders_status on orders(status);
create index idx_items_order on order_items(order_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table settings enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_prices enable row level security;
alter table restaurant_tables enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- profiles: cada quien lee su propio perfil, admin lee todos
create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or is_admin());
create policy "profiles_admin_write" on profiles
  for all using (is_admin()) with check (is_admin());

-- settings: lectura pública (se usa para mostrar el logo en la pantalla de login), solo admin escribe
create policy "settings_select_all" on settings
  for select using (true);
create policy "settings_admin_write" on settings
  for update using (is_admin()) with check (is_admin());

-- categories: lectura para autenticados, escritura solo admin
create policy "categories_select" on categories
  for select using (auth.uid() is not null);
create policy "categories_admin_write" on categories
  for insert with check (is_admin());
create policy "categories_admin_update" on categories
  for update using (is_admin()) with check (is_admin());
create policy "categories_admin_delete" on categories
  for delete using (is_admin());

-- products
create policy "products_select" on products
  for select using (auth.uid() is not null);
create policy "products_admin_insert" on products
  for insert with check (is_admin());
create policy "products_admin_update" on products
  for update using (is_admin()) with check (is_admin());
create policy "products_admin_delete" on products
  for delete using (is_admin());

-- product_prices
create policy "prices_select" on product_prices
  for select using (auth.uid() is not null);
create policy "prices_admin_insert" on product_prices
  for insert with check (is_admin());
create policy "prices_admin_update" on product_prices
  for update using (is_admin()) with check (is_admin());
create policy "prices_admin_delete" on product_prices
  for delete using (is_admin());

-- restaurant_tables: mesero y admin pueden leer y actualizar estado
create policy "tables_select" on restaurant_tables
  for select using (auth.uid() is not null);
create policy "tables_update" on restaurant_tables
  for update using (auth.uid() is not null);
create policy "tables_admin_insert" on restaurant_tables
  for insert with check (is_admin());
create policy "tables_admin_delete" on restaurant_tables
  for delete using (is_admin());

-- orders: mesero y admin gestionan pedidos
create policy "orders_select" on orders
  for select using (auth.uid() is not null);
create policy "orders_insert" on orders
  for insert with check (auth.uid() is not null);
create policy "orders_update" on orders
  for update using (auth.uid() is not null);

-- order_items: mesero y admin gestionan items
create policy "items_select" on order_items
  for select using (auth.uid() is not null);
create policy "items_insert" on order_items
  for insert with check (auth.uid() is not null);
create policy "items_update" on order_items
  for update using (auth.uid() is not null);
create policy "items_delete" on order_items
  for delete using (auth.uid() is not null);

-- ============================================================
-- Trigger: crear perfil automáticamente al crear un usuario auth
-- (el rol se fija manualmente después vía SQL, ver README)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'mesero', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE: bucket para fotos de productos y logo
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and is_admin());

create policy "product_images_admin_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and is_admin());

create policy "product_images_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and is_admin());
