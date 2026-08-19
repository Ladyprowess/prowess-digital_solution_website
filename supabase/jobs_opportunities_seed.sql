-- Taxonomy seed data for the V1 jobs/opportunities schema. Run after
-- supabase/jobs_opportunities_schema.sql. Safe to re-run (on conflict do
-- nothing on the unique slug).

insert into job_sources (slug, name, source_type) values
  ('manual', 'Manually Curated', 'manual')
on conflict (slug) do nothing;

insert into job_categories (slug, name) values
  ('tech', 'Tech'),
  ('design', 'Design'),
  ('marketing', 'Marketing'),
  ('writing', 'Writing'),
  ('customer-support', 'Customer Support'),
  ('sales', 'Sales'),
  ('web3', 'Web3')
on conflict (slug) do nothing;

insert into job_types (slug, name) values
  ('full-time', 'Full-time'),
  ('part-time', 'Part-time'),
  ('contract', 'Contract'),
  ('freelance', 'Freelance'),
  ('internship', 'Internship')
on conflict (slug) do nothing;

insert into opportunity_types (slug, name) values
  ('internships', 'Internships'),
  ('freelance', 'Freelance'),
  ('scholarships', 'Scholarships'),
  ('grants', 'Grants'),
  ('fellowships', 'Fellowships'),
  ('competitions', 'Competitions')
on conflict (slug) do nothing;

insert into career_paths (slug, title) values
  ('technology', 'Technology'),
  ('business', 'Business'),
  ('marketing', 'Marketing'),
  ('design', 'Design'),
  ('writing', 'Writing'),
  ('finance', 'Finance'),
  ('web3', 'Web3'),
  ('customer-support', 'Customer Support')
on conflict (slug) do nothing;

-- A small starter skill set covering the two worked examples from the
-- product discussion (Digital Marketing, Cybersecurity). Admins can add
-- more from the Career Paths admin page as new content needs them.
insert into skills (slug, name) values
  ('seo', 'SEO'),
  ('content-marketing', 'Content Marketing'),
  ('social-media-marketing', 'Social Media Marketing'),
  ('email-marketing', 'Email Marketing'),
  ('analytics', 'Analytics'),
  ('paid-advertising', 'Paid Advertising'),
  ('networking', 'Networking'),
  ('linux', 'Linux'),
  ('security-fundamentals', 'Security Fundamentals'),
  ('python', 'Python'),
  ('cloud', 'Cloud'),
  ('figma', 'Figma'),
  ('ux-research', 'UX Research'),
  ('copywriting', 'Copywriting')
on conflict (slug) do nothing;
