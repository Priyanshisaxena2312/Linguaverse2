-- -----------------------------------------------------------------------------------------------
-- 1. DICTIONARY WORDS TABLE
--
-- Stores saved vocabulary and grammar corrections for each user.
-- -----------------------------------------------------------------------------------------------

create table public.dictionary_words (
    id uuid not null default gen_random_uuid (),
    user_id uuid not null,
    created_at timestamp with time zone not null default now(),
    word text not null,
    original_context text not null,
    corrected_context text not null,
    explanation text not null,
    "type" text not null check (type IN ('written', 'audio')),
    pronunciation_url text null,
    constraint dictionary_words_pkey primary key (id),
    constraint dictionary_words_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- -----------------------------------------------------------------------------------------------
-- 2. DICTIONARY WORDS RLS (ROW LEVEL SECURITY)
--
-- Ensures users can only access their own dictionary words.
-- -----------------------------------------------------------------------------------------------

alter table public.dictionary_words enable row level security;

create policy "Users can view their own dictionary words." on public.dictionary_words
  for select using (auth.uid() = user_id);

create policy "Users can add new words to their dictionary." on public.dictionary_words
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own dictionary words." on public.dictionary_words
  for update using (auth.uid() = user_id);

create policy "Users can delete their own dictionary words." on public.dictionary_words
  for delete using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------------------------
-- 3. DICTIONARY AUDIO STORAGE BUCKET
--
-- Creates a dedicated bucket for storing audio pronunciation files.
-- -----------------------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
values ('journal-media', 'journal-media', false, false, 5242880, '{"audio/mpeg", "audio/wav", "audio/webm"}')
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------------------------
-- 4. DICTIONARY AUDIO BUCKET RLS
--
-- Secures the audio bucket so users can only access their own pronunciation files.
-- The files are stored in folders named after the user's ID.
-- -----------------------------------------------------------------------------------------------

create policy "Users can view their own audio files."
  on storage.objects for select
  using ( bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can upload audio files to their folder."
  on storage.objects for insert
  with check ( bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can update their own audio files."
  on storage.objects for update
  using ( bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete their own audio files."
  on storage.objects for delete
  using ( bucket_id = 'journal-media' and auth.uid()::text = (storage.foldername(name))[1] );
