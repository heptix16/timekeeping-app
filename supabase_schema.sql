-- Create profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text default 'employee' check (role in ('employee', 'admin')),
  leave_credits numeric default 15.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn ON Row Level Security
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create time logs table
create table public.time_logs (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.profiles(id) on delete cascade not null,
  time_in timestamp with time zone not null default timezone('utc'::text, now()),
  time_out timestamp with time zone,
  date date not null default current_date
);

alter table public.time_logs enable row level security;

create policy "Users can view own time logs" on public.time_logs
  for select using (auth.uid() = employee_id);

create policy "Users can insert own time logs" on public.time_logs
  for insert with check (auth.uid() = employee_id);

create policy "Users can update own time logs" on public.time_logs
  for update using (auth.uid() = employee_id);

-- Create leave requests table
create table public.leave_requests (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references public.profiles(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  reason text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leave_requests enable row level security;

create policy "Users can view own leave requests" on public.leave_requests
  for select using (auth.uid() = employee_id);

create policy "Users can insert own leave requests" on public.leave_requests
  for insert with check (auth.uid() = employee_id);

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, leave_credits)
  values (new.id, new.raw_user_meta_data->>'full_name', 'employee', 15.0);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
