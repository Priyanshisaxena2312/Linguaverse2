
-- =============================================
-- Step 1: Optimize Row Level Security Policies
-- =============================================

-- Note: We use "create or replace function" for functions and drop/create for policies.
-- This ensures the changes are safe to re-run.

-- Helper function to get a user's role (re-usable and optimized)
create or replace function get_user_role(user_id uuid)
returns text as $$
  select role from public.profiles where id = user_id;
$$ language sql stable;


-- === PROFILES Table ===
-- Users can manage their own profile
drop policy "Users can manage their own profile" on public.profiles;
create policy "Users can manage their own profile" on public.profiles for all
  using ( (select auth.uid()) = id );

-- Users can view their own profile
drop policy "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile" on public.profiles for select
  using ( (select auth.uid()) = id );

-- Admins can view all profiles
drop policy "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select
  using ( (select get_user_role(auth.uid())) = 'admin' );

-- === JOURNAL_ENTRIES Table ===
-- Users can manage their own journal entries
drop policy "Users can manage their own journal entries" on public.journal_entries;
create policy "Users can manage their own journal entries" on public.journal_entries for all
  using ( (select auth.uid()) = user_id );

-- Teachers can view their students' entries
drop policy "Teachers can view their students' entries" on public.journal_entries;
create policy "Teachers can view their students' entries" on public.journal_entries for select
  using (
    (select get_user_role(auth.uid())) = 'admin'
    and
    exists (
      select 1 from public.profiles
      where id = journal_entries.user_id and (profiles.branch || '-' || profiles.section) in (
        select unnest(managed_classes) from public.profiles where id = (select auth.uid())
      )
    )
  );

-- Teachers can update feedback on their students' entries
drop policy "Teachers can update feedback on their students' entries" on public.journal_entries;
create policy "Teachers can update feedback on their students' entries" on public.journal_entries for update
  using (
    (select get_user_role(auth.uid())) = 'admin'
    and
    exists (
      select 1 from public.profiles
      where id = journal_entries.user_id and (profiles.branch || '-' || profiles.section) in (
        select unnest(managed_classes) from public.profiles where id = (select auth.uid())
      )
    )
  )
  with check ( (select get_user_role(auth.uid())) = 'admin' );

-- Consolidate "Users can view own entries and teachers can view their students"
drop policy "Users can view own entries and teachers can view their students" on public.journal_entries;


-- === ASSIGNMENTS Table ===
-- Consolidate policies for assignments
drop policy "Students can see assignments for their class" on public.assignments;
drop policy "Teachers can manage assignments for their classes" on public.assignments;

create policy "Users can see assignments for their class or manage them" on public.assignments for all
  using (
    ( -- Students can see assignments for their class
      (select get_user_role(auth.uid())) = 'user' and
      (select branch from public.profiles where id = (select auth.uid())) = assignments.branch and
      (select section from public.profiles where id = (select auth.uid())) = assignments.section
    )
    or
    ( -- Admins/teachers can manage assignments
      (select get_user_role(auth.uid())) = 'admin'
    )
  );

-- === GRAMMAR_MISTAKES Table ===
-- Consolidate policies for grammar_mistakes
drop policy "Admins can access all grammar mistakes" on public.grammar_mistakes;
drop policy "Users can insert their own grammar mistakes" on public.grammar_mistakes;
drop policy "Users can view their own grammar mistakes" on public.grammar_mistakes;

create policy "Users can manage their own mistakes, admins can see all" on public.grammar_mistakes for all
  using (
    ( (select auth.uid()) = user_id )
    or
    ( (select get_user_role(auth.uid())) = 'admin' )
  );

-- === DICTIONARY_WORDS Table ===
drop policy "Users can manage their own dictionary words" on public.dictionary_words;
create policy "Users can manage their own dictionary words" on public.dictionary_words for all
  using ( (select auth.uid()) = user_id );

-- === TODO_LISTS Table ===
drop policy "Users can manage their own to-do lists" on public.todo_lists;
create policy "Users can manage their own to-do lists" on public.todo_lists for all
  using ( (select auth.uid()) = user_id );

-- === TODO_TASKS Table ===
drop policy "Users can manage their own to-do tasks" on public.todo_tasks;
create policy "Users can manage their own to-do tasks" on public.todo_tasks for all
  using ( (select auth.uid()) = user_id );

-- === HARD_WORDS Table ===
drop policy "Users can view their own hard words" on public.hard_words;
drop policy "Users can insert their own hard words" on public.hard_words;
drop policy "Users can update their own hard words" on public.hard_words;
drop policy "Users can delete their own hard words" on public.hard_words;

create policy "Users can manage their own hard words" on public.hard_words for all
  using ( (select auth.uid()) = user_id );


-- === COMPARED_WORDS Table ===
drop policy "Users can manage their own compared words" on public.compared_words;
create policy "Users can manage their own compared words" on public.compared_words for all
  using ( (select auth.uid()) = user_id );


-- === PRACTICE_SESSIONS Table ===
drop policy "Users can view their own practice sessions" on public.practice_sessions;
drop policy "Users can create their own practice sessions" on public.practice_sessions;

create policy "Users can manage their own practice sessions" on public.practice_sessions for all
  using ( (select auth.uid()) = user_id );


-- =============================================
-- Step 2: Add Missing Indexes to Foreign Keys
-- =============================================

-- These commands will only create an index if it doesn't already exist, making them safe to re-run.

create index if not exists idx_assignments_created_by on public.assignments(created_by);
create index if not exists idx_dictionary_words_user_id on public.dictionary_words(user_id);
create index if not exists idx_grammar_mistakes_journal_entry_id on public.grammar_mistakes(journal_entry_id);
create index if not exists idx_grammar_mistakes_user_id on public.grammar_mistakes(user_id);
create index if not exists idx_hard_words_user_id on public.hard_words(user_id);
create index if not exists idx_journal_entries_assignment_id on public.journal_entries(assignment_id);
create index if not exists idx_practice_sessions_journal_entry_id on public.practice_sessions(journal_entry_id);
create index if not exists idx_practice_sessions_user_id on public.practice_sessions(user_id);
create index if not exists idx_todo_lists_user_id on public.todo_lists(user_id);
create index if not exists idx_todo_tasks_list_id on public.todo_tasks(list_id);
create index if not exists idx_todo_tasks_user_id on public.todo_tasks(user_id);

-- Also index the user_id on journal_entries as it's the most common lookup
create index if not exists idx_journal_entries_user_id on public.journal_entries(user_id);
