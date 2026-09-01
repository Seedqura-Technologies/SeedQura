-- Fellowship payment allow-list (admin-managed via /admin/fellowship).

create table if not exists public.fellowship_selections (
  email text primary key,
  full_name text,
  notes text,
  selected_at timestamptz not null default now(),
  selected_by uuid references public.profiles (id) on delete set null,
  revoked_at timestamptz,
  selection_email_sent_at timestamptz
);

create index if not exists fellowship_selections_active_idx
  on public.fellowship_selections (selected_at desc)
  where revoked_at is null;

alter table public.fellowship_selections enable row level security;

-- Expose table to PostgREST (service_role is used by the backend API).
grant usage on schema public to postgres, anon, authenticated, service_role;
grant select, insert, update, delete on table public.fellowship_selections to service_role;
grant select, insert, update, delete on table public.fellowship_selections to postgres;

notify pgrst, 'reload schema';
