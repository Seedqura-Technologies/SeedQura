-- UTR enroll fields + awaiting_verification payment status
-- Seedqura Technologies LLP — interim founder UPI flow
-- Idempotent / additive: does not mutate existing enrollment rows' payment_status.

alter table public.enrollments
  add column if not exists utr text,
  add column if not exists institution text,
  add column if not exists degree text,
  add column if not exists year_of_study text,
  add column if not exists applicant_phone text,
  add column if not exists applicant_name text,
  add column if not exists utr_submitted_at timestamptz;

-- Drop ANY check constraint that mentions payment_status (name may vary),
-- then install the widened allow-list. Existing values stay valid.
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'enrollments'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%payment_status%'
  loop
    execute format(
      'alter table public.enrollments drop constraint %I',
      r.conname
    );
  end loop;

  begin
    alter table public.enrollments
      add constraint enrollments_payment_status_check
      check (
        payment_status in (
          'pending',
          'awaiting_verification',
          'paid',
          'failed',
          'refunded'
        )
      );
  exception
    when duplicate_object then null;
  end;
end $$;

create index if not exists enrollments_utr_idx
  on public.enrollments (utr)
  where utr is not null and utr <> '';

create index if not exists enrollments_awaiting_verification_idx
  on public.enrollments (payment_status, created_at desc)
  where payment_status = 'awaiting_verification';
