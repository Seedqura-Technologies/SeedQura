-- Replace legacy Academy catalog with the three weekend lab courses (₹4,999 each).
-- Safe to run on prod: archives old marketing courses, upserts new published rows.

update public.courses
set status = 'archived', updated_at = now()
where id in (
  'academy',
  'crop-vision',
  'clinical-ai',
  'remote-sensing',
  'research-pilots'
);

insert into public.courses (
  id, name, tagline, description, category, level, duration, format,
  schedule_summary, price_inr, currency, price_display, status,
  display_status, featured, features
) values
  (
    'frameworks-lab',
    'Frameworks Lab',
    'See with code — ship vision projects',
    'Build end-to-end computer vision skills — from raw images and cleaning to classification, detection, and a GitHub portfolio employers can click and run.',
    'Course',
    'Beginner–Intermediate',
    '4 weeks',
    'Sat & Sun · 8 live classes',
    '8 live hours · 4 weekends · Campus Vision project',
    4999,
    'INR',
    '₹4,999',
    'published',
    'Open',
    true,
    '["Image pipelines with OpenCV","Hands-on PyTorch projects","Classification + detection demos","Portfolio-ready GitHub repos"]'::jsonb
  ),
  (
    'signal-lab',
    'Signal Lab',
    'Business question → deployed model',
    'Go from a real business problem to clean data, trained models, and a live prediction API — then package the full workflow as a GitHub portfolio recruiters can run.',
    'Course',
    'Beginner–Intermediate',
    '4 weeks',
    'Sat & Sun · 8 live classes',
    '8 live hours · 4 weekends · Student Success Predictor project',
    4999,
    'INR',
    '₹4,999',
    'published',
    'Open',
    true,
    '["Business → ML problem framing","EDA, cleaning & feature craft","Model training & evaluation","FastAPI deploy + portfolio"]'::jsonb
  ),
  (
    'groundtruth-lab',
    'Groundtruth Lab',
    'Label data like a pro — ML-ready handoff',
    'Design taxonomies, label real images, run quality checks, and ship documentation an ML engineer can import tomorrow — a GitHub portfolio that proves you belong in AI data ops.',
    'Course',
    'Beginner',
    '4 weeks',
    'Sat & Sun · 8 live classes',
    '8 live hours · 4 weekends · Campus Safety Labeling Kit project',
    4999,
    'INR',
    '₹4,999',
    'published',
    'Open',
    true,
    '["Taxonomy & guideline design","Hands-on Label Studio labeling","QA scripts & quality checks","ML handoff docs + portfolio"]'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  tagline = excluded.tagline,
  description = excluded.description,
  category = excluded.category,
  level = excluded.level,
  duration = excluded.duration,
  format = excluded.format,
  schedule_summary = excluded.schedule_summary,
  price_inr = excluded.price_inr,
  currency = excluded.currency,
  price_display = excluded.price_display,
  status = excluded.status,
  display_status = excluded.display_status,
  featured = excluded.featured,
  features = excluded.features,
  updated_at = now();
