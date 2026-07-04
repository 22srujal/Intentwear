# Intentwear

Intentwear is a Vite + React storefront for a bamboo clothing brand. It includes
public pages for home, shop, about, account, cart interactions, product modals,
and a Supabase-backed admin CMS for managing products and editable site copy.

## Tech Stack

- React + TypeScript
- Vite
- Plain CSS
- Supabase Auth, Postgres, Storage, and RLS
- Three.js / React Three Fiber for interactive animation

## Requirements

- Node.js 18 or newer
- npm
- A Supabase project for backend/admin features

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local env file:

```bash
cp .env.example .env
```

Fill in `.env`:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

The public storefront still works without Supabase env vars by falling back to
local seeded products. The admin page requires Supabase.

## Supabase Setup

Create a Supabase project, then run the migration:

```text
supabase/migrations/20260703000000_admin_cms.sql
```

You can run it from the Supabase SQL Editor or with the Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

The migration creates:

- `profiles`
- `admin_email_allowlist`
- `products`
- `product_colors`
- `product_images`
- `site_content`
- `product-images` storage bucket
- RLS policies and table grants

More setup notes live in:

```text
supabase/README.md
```

## Admin Access

Whitelist the admin email in Supabase SQL Editor:

```sql
insert into public.admin_email_allowlist (email)
values ('you@example.com')
on conflict (email) do nothing;
```

Create the Auth user in Supabase:

```text
Supabase Dashboard -> Authentication -> Users -> Add user
```

Use the same email and set a password.

If the Auth user already exists, promote/create the admin profile:

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'you@example.com'
on conflict (id) do update set role = 'admin', email = excluded.email;
```

Open the admin login:

```text
http://localhost:5173/admin/login
```

Admins can:

- Add, edit, publish, draft, and delete products
- Upload product images to Supabase Storage
- Edit prices, badges, categories, sizes, colors, material, and care copy
- Edit key storefront content blocks
- View product/content counts in the admin dashboard

## Available Scripts

```bash
npm run dev
```

Runs the local Vite dev server.

```bash
npm run build
```

Type-checks and builds the production app.

```bash
npm run preview
```

Serves the production build locally.

## Routes

- `/` - Home landing page
- `/shop` - Product collection
- `/about` - Brand story/about page
- `/account` - Account UI
- `/admin/login` - Admin sign in
- `/admin` - Protected admin CMS

## Deployment

For Vercel:

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Set framework preset to Vite.
4. Add environment variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

5. Deploy.

If direct links like `/shop` or `/admin/login` return 404 after deployment,
add a Vercel rewrite to serve the Vite app for all routes.

## Troubleshooting

If admin login says `permission denied for table profiles`, run:

```sql
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
```

If admin login says the account is not allowed, verify:

```sql
select id, email from auth.users where email = 'you@example.com';
select id, email, role from public.profiles where email = 'you@example.com';
```

If product uploads fail, confirm the `product-images` bucket exists and the
storage policies from the migration were created.
