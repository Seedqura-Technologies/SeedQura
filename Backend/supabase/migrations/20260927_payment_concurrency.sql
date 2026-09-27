-- One Razorpay order id belongs to one payment row.
-- One enrollment can have only one open gateway order at a time,
-- so concurrent checkouts reuse that order instead of double-charging.

with ranked as (
  select
    id,
    row_number() over (
      partition by enrollment_id
      order by created_at desc
    ) as rn
  from public.payments
  where status = 'created'
    and razorpay_order_id is not null
    and razorpay_order_id <> ''
)
update public.payments p
set status = 'failed', updated_at = now()
from ranked r
where p.id = r.id
  and r.rn > 1;

create unique index if not exists payments_razorpay_order_id_uidx
  on public.payments (razorpay_order_id)
  where razorpay_order_id is not null and razorpay_order_id <> '';

-- Do not enforce one open order in the database. Older API builds insert a
-- new row per checkout and would fail that constraint. The current API reuses
-- an open order in code.
drop index if exists public.payments_one_open_gateway_order_idx;
