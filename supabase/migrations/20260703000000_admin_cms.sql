create extension if not exists "pgcrypto";

create type public.product_status as enum ('draft', 'published');
create type public.profile_role as enum ('customer', 'admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role public.profile_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_email_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  fit text not null default '',
  copy text not null default '',
  price_value integer not null check (price_value >= 0),
  compare_at text,
  badge text,
  selected_size text not null default 'M',
  material text not null default '',
  care text not null default '',
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  sort_order integer not null default 0,
  image_url text,
  sizes text[] not null default array['XS','S','M','L','XL']::text[],
  swatches text[] not null default array[]::text[],
  color_names text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  hex text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  body text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

create trigger site_content_touch_updated_at
before update on public.site_content
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    case
      when exists (
        select 1
        from public.admin_email_allowlist
        where lower(email) = lower(new.email)
      )
      then 'admin'::public.profile_role
      else 'customer'::public.profile_role
    end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.admin_email_allowlist enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_images enable row level security;
alter table public.site_content enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_colors to anon, authenticated;
grant select on public.product_images to anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.admin_email_allowlist to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_colors to authenticated;
grant select, insert, update, delete on public.product_images to authenticated;
grant select, insert, update, delete on public.site_content to authenticated;

create policy "Users can read their profile"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

create policy "Admins can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can read allowlist"
on public.admin_email_allowlist for select
using (public.is_admin());

create policy "Admins can manage allowlist"
on public.admin_email_allowlist for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read published products"
on public.products for select
using (status = 'published' or public.is_admin());

create policy "Admins can manage products"
on public.products for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read colors for visible products"
on public.product_colors for select
using (
  public.is_admin()
  or exists (
    select 1 from public.products
    where products.id = product_colors.product_id
      and products.status = 'published'
  )
);

create policy "Admins can manage colors"
on public.product_colors for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read images for visible products"
on public.product_images for select
using (
  public.is_admin()
  or exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status = 'published'
  )
);

create policy "Admins can manage images"
on public.product_images for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read site content"
on public.site_content for select
using (true);

create policy "Admins can manage site content"
on public.site_content for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can read product image files"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Admins can manage product image files"
on storage.objects for all
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

insert into public.site_content (key, label, body, sort_order) values
('home.hero.kicker', 'Home hero kicker', '100% Bamboo · Made for India', 10),
('home.hero.title', 'Home hero title', 'Forest to Body, Body to Soul.', 20),
('home.hero.lede', 'Home hero lede', 'Bamboo-led basics for Indian heat.', 30),
('home.collection.title', 'Home collection title', 'Basics that last, heat that doesn''t.', 40),
('home.origin.title', 'Home origin title', 'We Started with a Bamboo Stalk.', 50),
('home.origin.body_one', 'Home origin first paragraph', 'Not a trend. Not a mood board. A single stalk of Moso bamboo that grows three feet per day without pesticides, without irrigation, without asking much of the earth at all.', 60),
('home.origin.body_two', 'Home origin second paragraph', 'We asked what if fabric could carry that same softness, speed, efficiency, already where Intent is our answer. Worn daily across Delhi, Pune, Chennai. Built for Indian summers.', 70),
('shop.hero.title', 'Shop hero title', 'The Full Collection', 80),
('shop.hero.lede', 'Shop hero lede', '8 styles · Bamboo-led, India-built', 90),
('shop.note', 'Shop note', 'All Intent garments are OEKO-TEX Standard 100 certified. Free shipping across India on orders above ₹1,999.', 100),
('about.hero.title', 'About hero title', 'Built on one honest question.', 110),
('about.hero.lede', 'About hero lede', 'Why does sustainable clothing have to compromise on comfort - especially in a country that sits at 40°C for five months a year?', 120),
('footer.tagline', 'Footer tagline', 'Plant-based essentials for hot Indian days.', 130)
on conflict (key) do nothing;

insert into public.admin_email_allowlist (email)
values ('your-real-email@example.com')
on conflict (email) do nothing;
