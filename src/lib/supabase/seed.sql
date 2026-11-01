-- Create a table for public profiles
create table
  profiles (
    id uuid not null references auth.users on delete cascade,
    updated_at timestamp with time zone,
    full_name text,
    contact_mail text,
    plan text not null default 'free',
    analysis_used integer not null default 0,
    chat_entries_used integer not null default 0,
    voice_entries_used integer not null default 0,
    summaries_used integer not null default 0,
    usage_reset_date timestamp with time zone not null default now(),
    current_streak integer not null default 0,
    last_entry_date date,
    trial_started_at timestamp with time zone,
    highest_streak integer not null default 0,
    role text default 'user',
    reports_used integer default 0,
    ai_analysis_enabled boolean default false,
    daily_questions_asked integer default 0,
    last_question_date date,
    primary key (id)
  );

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles for select using (true);

create policy "Users can insert their own profile." on profiles for insert with check (auth.uid () = id);

create policy "Users can update own profile." on profiles for update using (auth.uid () = id);

-- This trigger automatically creates a profile for new users.
-- See https://supabase.com/docs/guides/auth/managing-user-data#creating-a-profile-for-your-user
create function
  public.handle_new_user () returns trigger as $$
begin
  insert into public.profiles (id, full_name, contact_mail, trial_started_at)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'contact_mail', now());
  return new;
end;
$$ language plpgsql security definer;

create trigger
  on_auth_user_created
after insert on auth.users for each row
execute
  procedure public.handle_new_user ();

-- Create a table for journal entries
create table
  journal_entries (
    id uuid not null default gen_random_uuid (),
    user_id uuid not null references auth.users on delete cascade,
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    title text not null,
    content text not null,
    analysis jsonb,
    language_analysis jsonb,
    theme text default 'default',
    page_style text default 'default',
    is_project_log boolean not null default false,
    iterations jsonb,
    source text,
    conversation jsonb,
    tags text[],
    primary key (id)
  );

-- Enable RLS for journal_entries
alter table journal_entries enable row level security;

create policy "Users can view their own entries." on journal_entries for select using (auth.uid () = user_id);

create policy "Users can insert their own entries." on journal_entries for insert with check (auth.uid () = user_id);

create policy "Users can update their own entries." on journal_entries for update using (auth.uid () = user_id);

create policy "Users can delete their own entries." on journal_entries for delete using (auth.uid () = user_id);

-- Create storage bucket for journal media
insert into
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('journal-media', 'journal-media', false, 5242880, '{"image/*", "audio/*"}') on conflict (id) do nothing;

-- Set up RLS policies for journal-media bucket
create policy "Users can view their own media." on storage.objects for select using (
  bucket_id = 'journal-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can upload media." on storage.objects for insert with check (
  bucket_id = 'journal-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own media." on storage.objects for update using (
  bucket_id = 'journal-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own media." on storage.objects for delete using (
  bucket_id = 'journal-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table for To-Do lists
create table
  todo_lists (
    id uuid not null primary key default gen_random_uuid (),
    user_id uuid not null references auth.users on delete cascade,
    created_at timestamp with time zone not null default now(),
    name text not null
  );

alter table todo_lists enable row level security;

create policy "Users can manage their own todo lists" on todo_lists for all using (auth.uid () = user_id);

-- Create table for To-Do tasks
create table
  todo_tasks (
    id uuid not null primary key default gen_random_uuid (),
    list_id uuid not null references todo_lists on delete cascade,
    user_id uuid not null references auth.users on delete cascade,
    created_at timestamp with time zone not null default now(),
    content text not null,
    status text not null default 'todo' check (status in ('todo', 'inprogress', 'done')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high'))
  );

alter table todo_tasks enable row level security;

create policy "Users can manage tasks in their own lists" on todo_tasks for all using (auth.uid () = user_id);

-- Create table for Dictionary Words
create table
  dictionary_words (
    id uuid not null primary key default gen_random_uuid (),
    user_id uuid not null references auth.users on delete cascade,
    created_at timestamp with time zone not null default now(),
    word text not null,
    original_context text not null,
    corrected_context text not null,
    explanation text not null,
    type text not null check (type in ('written', 'audio')),
    pronunciation_url text
  );
  
alter table dictionary_words enable row level security;
create policy "Users can manage their own dictionary words" on dictionary_words for all using (auth.uid () = user_id);

-- Create storage bucket for dictionary audio
insert into
  storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('journal-media', 'journal-media', false, 1048576, '{"audio/wav", "audio/mpeg", "audio/webm"}') on conflict (id) do nothing;

create policy "Users can manage their own dictionary audio" on storage.objects for all
  using ( bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1] );

-- RPC functions for admin dashboard
create or replace function get_plan_distribution()
returns table(plan text, count bigint) as $$
begin
  return query select profiles.plan, count(*) from profiles group by profiles.plan;
end;
$$ language plpgsql;

create or replace function get_active_users_counts(oneDayAgo text, sevenDaysAgo text, thirtyDaysAgo text)
returns table(daily_active bigint, weekly_active bigint, monthly_active bigint) as $$
begin
    return query
    select
        (select count(distinct user_id) from journal_entries where created_at >= oneDayAgo::timestamp) as daily_active,
        (select count(distinct user_id) from journal_entries where created_at >= sevenDaysAgo::timestamp) as weekly_active,
        (select count(distinct user_id) from journal_entries where created_at >= thirtyDaysAgo::timestamp) as monthly_active;
end;
$$ language plpgsql;

create or replace function get_entry_method_distribution()
returns table(source text, count bigint) as $$
begin
    return query select journal_entries.source, count(*) from journal_entries group by journal_entries.source;
end;
$$ language plpgsql;

create or replace function get_journal_type_distribution()
returns table(is_project_log boolean, count bigint) as $$
begin
    return query select journal_entries.is_project_log, count(*) from journal_entries group by journal_entries.is_project_log;
end;
$$ language plpgsql;

create or replace function get_total_ai_usage()
returns table(total_calls bigint) as $$
begin
    return query
    select sum(chat_entries_used) + sum(voice_entries_used) + sum(analysis_used) + sum(summaries_used) + sum(reports_used) as total_calls
    from profiles;
end;
$$ language plpgsql;
