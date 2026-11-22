import type { SupabaseClient } from '@supabase/supabase-js';

export const MAX_COMMENT_LENGTH = 2000;

export interface Comment {
  id: string;
  recipe_slug: string;
  user_id: string;
  author_name: string;
  avatar_url: string | null;
  body: string;
  created_at: string;
}

export type Validation = { ok: true; body: string } | { ok: false; error: string };

export function validateComment(body: string): Validation {
  const trimmed = body.trim();
  if (trimmed.length === 0) return { ok: false, error: 'Напишіть текст коментаря.' };
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { ok: false, error: `Коментар задовгий (максимум ${MAX_COMMENT_LENGTH} символів).` };
  }
  return { ok: true, body: trimmed };
}

export async function loadComments(client: SupabaseClient, slug: string): Promise<Comment[]> {
  const { data, error } = await client
    .from('comments')
    .select('*')
    .eq('recipe_slug', slug)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Comment[];
}

export async function postComment(client: SupabaseClient, slug: string, body: string): Promise<void> {
  const { error } = await client.from('comments').insert({ recipe_slug: slug, body });
  if (error) throw error;
}

export async function deleteComment(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('comments').delete().eq('id', id);
  if (error) throw error;
}
