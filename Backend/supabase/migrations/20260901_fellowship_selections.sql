-- Fellowship payment allow-list (replaces manual FELLOWSHIP_SELECTED_EMAILS env edits).

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
