create extension if not exists pgcrypto;


create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'CITIZEN' check (role in ('CITIZEN','GOVT. OFFICER','ADMIN')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "users can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email), 'CITIZEN')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();


create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sla_hours integer not null default 48,
  created_at timestamptz not null default now()
);

create table if not exists public.applications (
  id text primary key,
  title text not null,
  applicant text not null,
  status text not null default 'in_progress' check (status in ('in_progress','at_risk','delayed','completed')),
  current_stage text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id text not null references public.applications(id) on delete cascade,
  stage text not null,
  status text not null check (status in ('pending','completed','rejected')),
  at timestamptz not null default now(),
  note text,
  actor uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists application_events_application_id_idx on public.application_events(application_id);
create index if not exists applications_status_idx on public.applications(status);
create index if not exists applications_current_stage_idx on public.applications(current_stage);

alter table public.departments enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;

-- Authenticated users can read; officer writes should go through the server using service-role.
create policy "authenticated can read departments" on public.departments for select to authenticated using (true);
create policy "authenticated can read applications" on public.applications for select to authenticated using (true);
create policy "authenticated can read events" on public.application_events for select to authenticated using (true);

insert into public.departments(name,sla_hours) values
('Citizen Services',4),('Revenue Department',48),('Municipal Corporation',48),('Police Department',72),('District Administration',24)
on conflict (name) do nothing;

insert into public.applications(id,title,applicant,status,current_stage)
values ('APP-10482','Property Registration Application','Priya Nair','delayed','municipal_verification')
on conflict (id) do nothing;

insert into public.application_events(application_id,stage,status,at,note)
select 'APP-10482','submitted','completed',now()-interval '5 days','Application received successfully.'
where not exists(select 1 from public.application_events where application_id='APP-10482' and stage='submitted');
insert into public.application_events(application_id,stage,status,at,note)
select 'APP-10482','revenue_review','completed',now()-interval '4 days','Revenue documents verified.'
where not exists(select 1 from public.application_events where application_id='APP-10482' and stage='revenue_review');
insert into public.application_events(application_id,stage,status,at,note)
select 'APP-10482','municipal_verification','pending',now()-interval '3 days','Field inspection is pending.'
where not exists(select 1 from public.application_events where application_id='APP-10482' and stage='municipal_verification');
