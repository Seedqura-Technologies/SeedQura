-- Align fellowship price display to ₹19,999 (matches UPI QR) + refresh trimmed catalog copy.

update public.courses set
  tagline = 'See the world in code.',
  description = 'Build vision systems that run, not slide decks. Leave with projects recruiters can open and run.',
  features = '["Runnable vision projects","GitHub portfolio employers can run","Images to live models"]'::jsonb,
  updated_at = now()
where id = 'frameworks-lab';

update public.courses set
  tagline = 'Models that answer real questions.',
  description = 'Frame a business problem, train a model, deploy it live. One portfolio that proves the full loop.',
  features = '["Live prediction API","Messy data to trained models","Question to production on GitHub"]'::jsonb,
  updated_at = now()
where id = 'signal-lab';

update public.courses set
  tagline = 'Truth before training.',
  description = 'Design labels and quality systems ML teams trust. Prove it with a portfolio, not promises.',
  features = '["Data ML teams trust","Labels that scale cleanly","Portfolio proof for data ops"]'::jsonb,
  updated_at = now()
where id = 'groundtruth-lab';

update public.courses set
  tagline = 'Research you can publish.',
  description = 'Three months in a six-person group on one serious AI problem. Exit with research-grade work, not certificates.',
  format = 'Live weekends · groups of 6',
  price_display = '₹19,999 · incl. GST',
  display_status = 'Applications Open',
  features = '["Research-grade project and report","One domain, one deep problem","Manuscript-ready publication path"]'::jsonb,
  updated_at = now()
where id = 'research-fellowship';
