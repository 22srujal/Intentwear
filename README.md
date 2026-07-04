# Intentwear

Intentwear is a Vite + React storefront for a bamboo clothing brand. It includes
public pages for home, shop, about, account, cart interactions, product modals,
a Supabase-backed admin CMS, customer accounts, Razorpay checkout, and order
management.

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
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
RAZORPAY_KEY_ID=rzp_test_your-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
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

Create a Supabase project, then run the migrations:

```text
supabase/migrations/20260703000000_admin_cms.sql
supabase/migrations/20260704000000_orders.sql
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
- `orders`
- `order_items`
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
- View and update customer orders
- View product/content/order counts in the admin dashboard

## Customer Accounts and Google Sign-In

The account page supports email/password sign up, email/password sign in, Google
OAuth, and sign out.

To enable Google sign-in:

1. In Supabase, go to **Authentication -> Providers -> Google**.
2. Add your Google OAuth client ID and client secret.
3. Add redirect URLs in Supabase Auth settings:

```text
http://localhost:5173/account
https://your-vercel-domain.vercel.app/account
```

4. In Google Cloud OAuth settings, allow the Supabase callback URL shown in the
Supabase Google provider page.

## Razorpay Checkout

Orders use Razorpay Standard Checkout. Payment orders are created and verified
through Vercel serverless functions in `api/`, so Razorpay secrets stay off the
client.

Required Vercel/server environment variables:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

Use Razorpay test keys while developing. Published Supabase products must have
real product IDs; fallback local products cannot be checked out because the
server recalculates totals from Supabase.

The `/api/*` payment endpoints are Vercel serverless functions. They run on
Vercel deployments, or locally through `vercel dev`; plain `npm run dev` only
runs the Vite frontend.

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
- `/api/create-razorpay-order` - Server-side Razorpay order creation
- `/api/verify-razorpay-payment` - Server-side payment verification

## Deployment

For Vercel:

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Set framework preset to Vite.
4. Add environment variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
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
