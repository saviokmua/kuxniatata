-- Коментарі до рецептів. Виконати в Supabase → SQL Editor.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  recipe_slug text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null,
  avatar_url text,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_recipe_slug_idx on public.comments (recipe_slug, created_at);

-- Ім'я й аватар беруться з профілю Google на боці бази, а не з клієнта (не можна підмінити).
-- Обмеження частоти: не більше одного коментаря від користувача за 30 секунд.
create or replace function public.comments_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  new.author_name := left(coalesce(nullif(auth.jwt() -> 'user_metadata' ->> 'full_name', ''), 'Гість'), 80);
  new.avatar_url := auth.jwt() -> 'user_metadata' ->> 'avatar_url';
  new.body := btrim(new.body);
  if exists (
    select 1 from public.comments
    where user_id = new.user_id and created_at > now() - interval '30 seconds'
  ) then
    raise exception 'Забагато коментарів: зачекайте пів хвилини' using errcode = 'P0001';
  end if;
  return new;
end $$;

drop trigger if exists comments_before_insert on public.comments;
create trigger comments_before_insert before insert on public.comments
  for each row execute function public.comments_before_insert();

alter table public.comments enable row level security;

drop policy if exists "comments are public" on public.comments;
create policy "comments are public" on public.comments for select using (true);

drop policy if exists "signed in users can comment" on public.comments;
create policy "signed in users can comment" on public.comments for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "authors can delete own comments" on public.comments;
create policy "authors can delete own comments" on public.comments for delete to authenticated
  using (user_id = auth.uid());
