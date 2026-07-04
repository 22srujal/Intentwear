# Intent Supabase Setup

1. Create a Supabase project.
2. Run both migrations in the Supabase SQL editor or with the Supabase CLI:
   - `supabase/migrations/20260703000000_admin_cms.sql`
   - `supabase/migrations/20260704000000_orders.sql`
3. Add your first admin email before creating/signing into that user:

```sql
insert into public.admin_email_allowlist (email)
values ('you@example.com')
on conflict (email) do nothing;
```

4. Create that user in Supabase Auth with an email/password.
5. Add these environment variables locally and in Vercel:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

The public storefront falls back to local seeded products when Supabase env vars
are missing. `/admin` requires Supabase and an admin profile.

If the Auth user already exists, or the login page says no profile was found,
promote/create the profile manually:

```sql
insert into public.profiles (id, email, role)
select id, email, 'admin'
from auth.users
where email = 'you@example.com'
on conflict (id) do update set role = 'admin', email = excluded.email;
```

If login says `permission denied for table profiles`, run the grants below:

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
