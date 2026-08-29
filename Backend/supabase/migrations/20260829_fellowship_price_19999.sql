-- Force fellowship price to match UPI QR (₹19,999, not rounded ₹20,000 display).

update public.courses
set
  price_inr = 19999,
  price_display = '₹19,999 · incl. GST',
  duration = '3 months',
  updated_at = now()
where id = 'research-fellowship';
