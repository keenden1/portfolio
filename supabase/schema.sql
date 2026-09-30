create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  tech text[] not null default '{}',
  live_url text not null default '#',
  github_url text not null default '#',
  image_url text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  icon text not null default 'Code2',
  sort_order integer not null default 0,
  published boolean not null default true
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  role text not null,
  company text not null,
  period text not null,
  description text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.site_settings enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "Published projects are public" on public.projects;
create policy "Published projects are public" on public.projects for select to anon, authenticated
  using (published or (select public.is_admin()));
drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects" on public.projects for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Published skills are public" on public.skills;
create policy "Published skills are public" on public.skills for select to anon, authenticated
  using (published or (select public.is_admin()));
drop policy if exists "Admins manage skills" on public.skills;
create policy "Admins manage skills" on public.skills for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Published experiences are public" on public.experiences;
create policy "Published experiences are public" on public.experiences for select to anon, authenticated
  using (published or (select public.is_admin()));
drop policy if exists "Admins manage experiences" on public.experiences;
create policy "Admins manage experiences" on public.experiences for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Site settings are public" on public.site_settings;
create policy "Site settings are public" on public.site_settings for select to anon, authenticated
  using (true);
drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings" on public.site_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users" on public.admin_users for select to authenticated
  using ((select public.is_admin()) or user_id = (select auth.uid()));

grant select on public.projects, public.skills, public.experiences, public.site_settings to anon, authenticated;
grant insert, update, delete on public.projects, public.skills, public.experiences to authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant select on public.admin_users to authenticated;

-- Project images are publicly readable, but only admins can upload, replace, or delete them.
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view project images" on storage.objects;
create policy "Public can view project images" on storage.objects for select to public
  using (bucket_id = 'project-images');

drop policy if exists "Admins can upload project images" on storage.objects;
create policy "Admins can upload project images" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-images' and (select public.is_admin()));

drop policy if exists "Admins can update project images" on storage.objects;
create policy "Admins can update project images" on storage.objects for update to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()))
  with check (bucket_id = 'project-images' and (select public.is_admin()));

drop policy if exists "Admins can delete project images" on storage.objects;
create policy "Admins can delete project images" on storage.objects for delete to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()));

-- After creating your Supabase Auth user, run:
-- insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID');

-- Initial portfolio content. Safe to run more than once.
create unique index if not exists projects_title_unique on public.projects (title);
create unique index if not exists skills_label_unique on public.skills (label);
create unique index if not exists experiences_role_company_unique on public.experiences (role, company);

insert into public.projects (title, description, tech, live_url, github_url, image_url, sort_order)
values
  ('Restoria – Educational Platform', 'Modern banking platform with real-time transactions, analytics, and AI insights.', '{Next.js,TypeScript,Tailwind,Supabase}', '#', 'https://github.com/keenden1/Restioria', 'https://picsum.photos/id/1015/800/600', 1),
  ('CHRR1 – Social Media Human Rights Platform', 'Twitter/X clone with threads, real-time chat, and AI content suggestions.', '{Next.js,tRPC,Prisma,PostgreSQL}', '#', 'https://github.com/keenden1/humanrights', 'https://picsum.photos/id/106/800/600', 2),
  ('HR System – Water District Villasis', 'Generate beautiful UI components with natural language.', '{React,Tailwind,Framer Motion}', '#', 'https://github.com/keenden1/Waterdistrict', 'https://picsum.photos/id/201/800/600', 3),
  ('Digital Serenity – Admin Side', 'Mobile-first web app that tracks and gamifies your carbon footprint.', '{Next.js,TypeScript,Mapbox}', '#', 'https://github.com/keenden1/DigitalSerenityAdmin', 'https://picsum.photos/id/251/800/600', 4)
on conflict (title) do nothing;

insert into public.skills (label, icon, sort_order)
values
  ('Laravel & PHP', 'Code2', 1),
  ('Flutter & Dart', 'Smartphone', 2),
  ('Firebase', 'Database', 3),
  ('Java & Android Studio', 'Smartphone', 4),
  ('REST APIs & Backend', 'Code2', 5),
  ('MySQL & SQL', 'Database', 6),
  ('Mobile App Development', 'Smartphone', 7),
  ('Full-Stack Development', 'Globe', 8)
on conflict (label) do nothing;

insert into public.experiences (role, company, period, description, sort_order)
values
  ('Junior Full-Stack Developer', 'Eljin Corp', '2026 — Present', 'Built design system for the Company.', 1),
  ('Freelance Full-Stack Developer', 'Home', '2024 — Present', 'Developed client projects.', 2)
on conflict (role, company) do nothing;

insert into public.site_settings (id, content)
values (1, '{
  "display_name": "Jimmy Bautista",
  "hero_title": "Hi, I''m Jimmy R. Bautista Jr.",
  "hero_highlight": "exceptional",
  "hero_suffix": " digital experiences.",
  "availability": "Available for freelance • Open to full-time roles",
  "hero_description": "Full-Stack Web Developer & UI Engineer • Turning ideas into pixel-perfect, high-performance products.",
  "about_paragraph_1": "I''m a passionate full-stack developer with over 6 years of experience crafting delightful digital products.",
  "about_paragraph_2": "I specialize in React, Next.js, TypeScript, and modern backend technologies. My focus is on performance, beautiful interfaces, and building products people love to use.",
  "about_paragraph_3": "When I''m not coding, you''ll find me exploring new design trends, contributing to open source, or capturing street photography.",
  "years_experience": "2+",
  "contact_heading": "Let''s build something great together",
  "contact_description": "Currently open to new opportunities and interesting projects.",
  "email": "bautistajimmy.dev@gmail.com",
  "github_url": "https://github.com/keenden1",
  "linkedin_url": "https://linkedin.com",
  "twitter_url": "https://twitter.com",
  "footer_text": "© 2026 Jimmy Bautista. All rights reserved.",
  "made_with": "Made with ❤️ and Next.js 15"
}'::jsonb)
on conflict (id) do nothing;
