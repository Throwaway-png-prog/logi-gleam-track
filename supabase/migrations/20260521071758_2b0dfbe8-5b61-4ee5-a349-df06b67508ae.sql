
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  worker_id text not null unique,
  phone text not null unique,
  pin text not null,
  tier text not null default 'Starter',
  points integer not null default 0,
  units_today integer not null default 0,
  last_reset_date date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  batch_number text not null,
  points_earned integer not null,
  created_at timestamptz not null default now()
);
create index activity_logs_user_time on public.activity_logs(user_id, created_at desc);

create table public.upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_tier text not null,
  amount_paid numeric not null,
  transaction_code text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id integer primary key default 1,
  maintenance boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into public.system_settings (id, maintenance) values (1, false);

alter table public.profiles enable row level security;
alter table public.activity_logs enable row level security;
alter table public.upgrade_requests enable row level security;
alter table public.system_settings enable row level security;

-- Demo app: phone+PIN auth (no Supabase auth). Permissive policies.
create policy "demo all profiles" on public.profiles for all using (true) with check (true);
create policy "demo all logs" on public.activity_logs for all using (true) with check (true);
create policy "demo all upgrades" on public.upgrade_requests for all using (true) with check (true);
create policy "demo all settings" on public.system_settings for all using (true) with check (true);
