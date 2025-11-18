import { Category } from "../types";

const REQUEST_TIMEOUT_MS = 25_000;

// Client-side: call the local API route so secrets stay on the server/runtime
export const generateGameContent = async (existingCategories: Partial<Category>[] = []): Promise<any> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ existingCategories }),
      signal: controller.signal,
    });
    const text = await res.text();
    if (!res.ok) {
      const errorPayload = safeParse(text);
      throw new Error(errorPayload?.error || 'Failed to generate game content');
    }
    const parsed = safeParse(text);
    if (!parsed) {
      throw new Error('AI service returned an invalid response');
    }
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
};

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};