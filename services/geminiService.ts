import { Category } from "../types";

// Client-side: call serverless API route which holds the secret
export const generateGameContent = async (existingCategories: Partial<Category>[] = [], options: { forceReal?: boolean; apiKey?: string } = {}): Promise<any> => {
  const body: any = { existingCategories };
  if (options.forceReal) body.forceReal = true;
  if (options.apiKey) body.apiKey = options.apiKey;

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Failed to generate game content');
  }
  return res.json();
};