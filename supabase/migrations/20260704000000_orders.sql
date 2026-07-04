create type public.order_status as enum (
  'payment_pending',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
);

create type public.payment_status as enum ('pending', 'paid', 'failed');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('INT-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_email text,
  customer_name text not null,
  customer_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_state text not null,
  shipping_pincode text not null,
  subtotal integer not null check (subtotal >= 0),
  total integer not null check (total >= 0),
  currency text not null default 'INR',
  order_status public.order_status not null default 'payment_pending',
  payment_status public.payment_status not null default 'pending',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_image text,
  selected_size text not null,
  selected_color text not null,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create trigger orders_touch_updated_at
before update on public.orders
for each row execute function public.touch_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select, insert, update on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;

create policy "Customers can read their orders"
on public.orders for select
using (user_id = auth.uid() or public.is_admin());

create policy "Customers can create their orders"
on public.orders for insert
with check (user_id = auth.uid());

create policy "Admins can update order status"
on public.orders for update
using (public.is_admin())
with check (public.is_admin());

create policy "Customers can read their order items"
on public.order_items for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

create policy "Customers can create their order items"
on public.order_items for insert
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);
