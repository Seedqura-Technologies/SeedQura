-- Research Fellowship: real monthly installment ledger (3 × ₹6,999)
-- payment_status 'partial' = program access active, balance still due

alter table public.enrollments
  add column if not exists payment_plan text;

alter table public.enrollments
  add column if not exists installments_total integer;

alter table public.enrollments
  add column if not exists installments_paid integer not null default 0;

alter table public.enrollments
  add column if not exists installment_amount_inr integer;

alter table public.enrollments
  add column if not exists next_installment_due_at timestamptz;

alter table public.enrollments
  add column if not exists installment_reminder_sent_at timestamptz;

do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
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
          'partial',
          'paid',
          'failed',
          'refunded'
        )
      );
  exception
    when duplicate_object then null;
  end;
end $$;

do $$
begin
  begin
    alter table public.enrollments
      add constraint enrollments_payment_plan_check
      check (
        payment_plan is null
        or payment_plan in ('full', 'monthly', 'standard')
      );
  exception
    when duplicate_object then null;
  end;
end $$;

create index if not exists enrollments_installment_due_idx
  on public.enrollments (next_installment_due_at)
  where payment_status = 'partial'
    and next_installment_due_at is not null;

-- Grandfather: fellowship students who paid one ₹6,999 "monthly" charge
-- but were marked fully paid — reopen remaining installments.
with monthly_once as (
  select
    e.id as enrollment_id,
    count(p.id) filter (where p.status = 'paid') as paid_count,
    max(p.created_at) filter (where p.status = 'paid') as last_paid_at
  from public.enrollments e
  join public.payments p on p.enrollment_id = e.id
  where e.course_id = 'research-fellowship'
    and e.payment_status = 'paid'
    and e.status = 'active'
    and coalesce(p.raw->>'paymentPlan', '') = 'monthly'
    and p.amount = 699900
  group by e.id
  having count(p.id) filter (where p.status = 'paid') = 1
)
update public.enrollments e
set
  payment_plan = 'monthly',
  installments_total = 3,
  installments_paid = 1,
  installment_amount_inr = 6999,
  payment_status = 'partial',
  next_installment_due_at = coalesce(m.last_paid_at, e.updated_at, now()) + interval '30 days',
  updated_at = now()
from monthly_once m
where e.id = m.enrollment_id;

-- Full-fee fellowship rows: mark plan metadata for clarity
update public.enrollments e
set
  payment_plan = coalesce(e.payment_plan, 'full'),
  installments_total = coalesce(e.installments_total, 1),
  installments_paid = greatest(coalesce(e.installments_paid, 0), 1),
  installment_amount_inr = coalesce(e.installment_amount_inr, 19999),
  next_installment_due_at = null,
  updated_at = now()
where e.course_id = 'research-fellowship'
  and e.payment_status = 'paid'
  and e.status = 'active'
  and (
    e.payment_plan is null
    or e.payment_plan = 'full'
    or exists (
      select 1
      from public.payments p
      where p.enrollment_id = e.id
        and p.status = 'paid'
        and coalesce(p.raw->>'paymentPlan', '') = 'full'
    )
  )
  and not exists (
    select 1
    from public.payments p
    where p.enrollment_id = e.id
      and p.status = 'paid'
      and coalesce(p.raw->>'paymentPlan', '') = 'monthly'
      and p.amount = 699900
  );
