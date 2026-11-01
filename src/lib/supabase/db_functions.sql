
-- Helper function to get dashboard stats in one go
create or replace function get_admin_dashboard_stats()
returns json as $$
begin
  return json_build_object(
    'total_users', (select count(*) from public.profiles),
    'total_entries', (select count(*) from public.journal_entries),
    'total_ai_calls', (select coalesce(sum(chat_entries_used + voice_entries_used + analysis_used + summaries_used + reports_used), 0) from public.profiles)
  );
end;
$$ language plpgsql security definer;

-- Helper function to get plan distribution
create
or replace function get_plan_distribution () returns table (plan text, count bigint) as $$
begin
  return query
  select
    profiles.plan,
    count(profiles.id)
  from
    public.profiles
  group by
    profiles.plan;
end;
$$ language plpgsql;

-- Helper function to get active user counts
create
or replace function get_active_users_counts (
  onedayago text,
  sevendaysago text,
  thirtydaysago text
) returns table (
  daily_active bigint,
  weekly_active bigint,
  monthly_active bigint
) as $$
begin
  return query
  select
    (
      select
        count(distinct user_id)
      from
        public.journal_entries
      where
        created_at >= onedayago::timestamptz
    ) as daily_active,
    (
      select
        count(distinct user_id)
      from
        public.journal_entries
      where
        created_at >= sevendaysago::timestamptz
    ) as weekly_active,
    (
      select
        count(distinct user_id)
      from
        public.journal_entries
      where
        created_at >= thirtydaysago::timestamptz
    ) as monthly_active;
end;
$$ language plpgsql;

-- Helper function to get entry method distribution
create
or replace function get_entry_method_distribution () returns table (source text, count bigint) as $$
begin
  return query
  select
    journal_entries.source,
    count(journal_entries.id)
  from
    public.journal_entries
  group by
    journal_entries.source;
end;
$$ language plpgsql;

-- Helper function to get journal type distribution
create
or replace function get_journal_type_distribution () returns table (is_project_log boolean, count bigint) as $$
begin
  return query
  select
    journal_entries.is_project_log,
    count(journal_entries.id)
  from
    public.journal_entries
  group by
    journal_entries.is_project_log;
end;
$$ language plpgsql;

-- Helper function to get total AI usage
create
or replace function get_total_ai_usage () returns table (total_calls bigint) as $$
begin
  return query
  select
    sum(
      chat_entries_used + voice_entries_used + analysis_used + summaries_used + reports_used
    )
  from
    public.profiles;
end;
$$ language plpgsql;

-- To-Do List Tables
create table if not exists public.todo_lists (
    id uuid not null default gen_random_uuid (),
    user_id uuid not null,
    name text not null,
    created_at timestamp with time zone not null default now(),
    constraint todo_lists_pkey primary key (id),
    constraint todo_lists_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade
);
alter table public.todo_lists enable row level security;
create policy "Users can manage their own to-do lists." on public.todo_lists for all using (auth.uid () = user_id);

create table if not exists public.todo_tasks (
    id uuid not null default gen_random_uuid (),
    list_id uuid not null,
    user_id uuid not null,
    created_at timestamp with time zone not null default now(),
    content text not null,
    status text not null default 'todo'::text,
    priority text not null default 'medium'::text,
    constraint todo_tasks_pkey primary key (id),
    constraint todo_tasks_list_id_fkey foreign key (list_id) references todo_lists (id) on delete cascade,
    constraint todo_tasks_user_id_fkey foreign key (user_id) references profiles (id) on delete cascade
);
alter table public.todo_tasks enable row level security;
create policy "Users can manage their own tasks." on public.todo_tasks for all using (auth.uid () = user_id);
