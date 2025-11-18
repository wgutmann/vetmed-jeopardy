import type { APIRoute } from 'astro';

const JSON_HEADERS = { 'Content-Type': 'application/json' } as const;
const MAX_CATEGORIES = 6;
const CLUE_VALUES = [200, 400, 600, 800, 1000];
const REQUEST_TIMEOUT_MS = 25_000;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    categories: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          clues: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                value: { type: 'INTEGER' },
                question: { type: 'STRING' },
                answer: { type: 'STRING' },
                imageUrl: { type: 'STRING' },
                imagePrompt: { type: 'STRING' },
              },
              required: ['value', 'question', 'answer'],
            },
          },
        },
        required: ['title', 'clues'],
      },
    },
  },
  required: ['categories'],
} as const;

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      message: 'VetMed Jeopardy Board Generator API',
      method: 'POST',
      description: 'Generate a veterinary medicine Jeopardy board',
      body: {
        existingCategories: 'optional array of existing categories to hybridize with AI generation',
      },
    }),
    { status: 200, headers: JSON_HEADERS }
  );
};

export const POST: APIRoute = async ({ request, locals }) => {
  const apiKey = resolveGeminiKey(locals);
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured in environment' }), { status: 500, headers: JSON_HEADERS });
  }

  const modelName = resolveModelName();
  const body = await request.json().catch(() => ({}));
  const existingCategories = Array.isArray(body?.existingCategories) ? body.existingCategories : [];
  const sanitizedForPrompt = sanitizeExistingCategories(existingCategories);
  const prompt = buildPrompt(sanitizedForPrompt);
  const payload = buildGenAiPayload(prompt);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(`GenAI request timed out after ${REQUEST_TIMEOUT_MS}ms`), REQUEST_TIMEOUT_MS);

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const raw = await resp.text();
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: 'GenAI request failed', status: resp.status, detail: truncate(raw) }),
        { status: 502, headers: JSON_HEADERS }
      );
    }

    const parsedEnvelope = safeJsonParse(raw);
    const textPayload = extractCandidateText(parsedEnvelope);
    if (!textPayload) {
      return new Response(JSON.stringify({ error: 'No content generated' }), { status: 500, headers: JSON_HEADERS });
    }

    const parsedJson = safeJsonParse(textPayload) ?? tryExtractJson(textPayload);
    if (!parsedJson || !Array.isArray(parsedJson.categories)) {
      return new Response(JSON.stringify({ error: 'No JSON content parsed from GenAI response' }), { status: 500, headers: JSON_HEADERS });
    }

    const normalizedBoard = normalizeBoard(parsedJson.categories);
    const mergedBoard = mergeUserCategories(existingCategories, normalizedBoard);

    return new Response(JSON.stringify({ categories: mergedBoard }), { status: 200, headers: JSON_HEADERS });
  } catch (err: any) {
    const status = err?.name === 'AbortError' ? 504 : 500;
    return new Response(JSON.stringify({ error: err?.message || 'Generation failed' }), { status, headers: JSON_HEADERS });
  } finally {
    clearTimeout(timeout);
  }
};

const sanitizeExistingCategories = (categories: any[]) =>
  categories.slice(0, MAX_CATEGORIES).map((category) => ({
    title: sanitizeText(category?.title),
    clues: ensureClueArray(category?.clues).slice(0, CLUE_VALUES.length).map((clue) => ({
      value: Number(clue?.value) || undefined,
      question: sanitizeText(clue?.question),
      answer: sanitizeText(clue?.answer),
      imageUrl: validUrl(clue?.imageUrl) ? clue.imageUrl : undefined,
    })),
  }));

const buildPrompt = (categories: ReturnType<typeof sanitizeExistingCategories>) => {
  const intro = `Create a rigorous Veterinary Medicine Jeopardy board with ${MAX_CATEGORIES} distinct categories.
Each category must contain exactly ${CLUE_VALUES.length} clues with dollar values ${CLUE_VALUES.join(', ')}.
Ensure clues are medically accurate and targeted at veterinary students.
Always include one category named "Visual Diagnosis" if the user did not supply one.`;

  if (!categories.length) {
    return `${intro}\nReturn JSON that matches the provided schema.`;
  }

  const providedSummary = JSON.stringify(categories);
  return `${intro}\nThe user supplied the following partial board. Keep their text verbatim and only generate what is missing.\nDATA: ${providedSummary}`;
};

const buildGenAiPayload = (prompt: string) => ({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: RESPONSE_SCHEMA,
    temperature: 0.65,
  },
});

const normalizeBoard = (categories: any[]) => {
  return categories
    .slice(0, MAX_CATEGORIES)
    .map((cat, index) => ({
      title: sanitizeText(cat?.title) || `Category ${index + 1}`,
      clues: normalizeClues(cat?.clues, index),
    }));
};

const normalizeClues = (clues: any[], categoryIndex: number) => {
  const list = ensureClueArray(clues);
  return CLUE_VALUES.map((value, clueIndex) => {
    const candidate = list.find((item) => Number(item?.value) === value) ?? list[clueIndex] ?? {};
    return {
      value,
      question: sanitizeText(candidate.question) || `Question ${categoryIndex + 1}-${clueIndex + 1}`,
      answer: sanitizeText(candidate.answer) || 'Answer not provided',
      imageUrl: validUrl(candidate.imageUrl) ? candidate.imageUrl : undefined,
    };
  });
};

const mergeUserCategories = (userCategories: any[], generated: ReturnType<typeof normalizeBoard>) => {
  if (!userCategories.length) return padCategories(generated);

  const pool = [...generated];
  const merged: typeof generated = [];

  userCategories.slice(0, MAX_CATEGORIES).forEach((userCat, index) => {
    const baseIndex = findMatchingCategoryIndex(pool, userCat?.title);
    const base = baseIndex >= 0 ? pool.splice(baseIndex, 1)[0] : pool.shift() ?? buildEmptyCategory(index);
    merged.push(mergeCategory(userCat, base, index));
  });

  return padCategories([...merged, ...pool]);
};

const mergeCategory = (userCategory: any, baseCategory: { title: string; clues: any[] }, index: number) => {
  const normalizedClues = ensureClueArray(userCategory?.clues);
  return {
    title: sanitizeText(userCategory?.title) || baseCategory.title || `Category ${index + 1}`,
    clues: CLUE_VALUES.map((value, clueIndex) => {
      const provided = normalizedClues.find((c) => Number(c?.value) === value) ?? normalizedClues[clueIndex];
      if (provided && provided.question && provided.answer) {
        return {
          value,
          question: sanitizeText(provided.question) || baseCategory.clues[clueIndex]?.question,
          answer: sanitizeText(provided.answer) || baseCategory.clues[clueIndex]?.answer,
          imageUrl: validUrl(provided.imageUrl) ? provided.imageUrl : baseCategory.clues[clueIndex]?.imageUrl,
        };
      }
      return baseCategory.clues[clueIndex] ?? buildEmptyClue(value, clueIndex, index);
    }),
  };
};

const padCategories = (categories: { title: string; clues: any[] }[]) => {
  const result = [...categories];
  while (result.length < MAX_CATEGORIES) {
    result.push(buildEmptyCategory(result.length));
  }
  return result.slice(0, MAX_CATEGORIES);
};

const buildEmptyCategory = (index: number) => ({
  title: `Category ${index + 1}`,
  clues: CLUE_VALUES.map((value, clueIndex) => buildEmptyClue(value, clueIndex, index)),
});

const buildEmptyClue = (value: number, clueIndex: number, categoryIndex: number) => ({
  value,
  question: `Placeholder clue ${categoryIndex + 1}-${clueIndex + 1}`,
  answer: 'Answer pending',
});

const resolveGeminiKey = (locals: any) => {
  const localsEnv = locals?.runtime?.env || locals?.env;
  return localsEnv?.GEMINI_API_KEY || (import.meta.env as any)?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
};

const resolveModelName = () => {
  return (import.meta.env as any)?.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
};

const extractCandidateText = (envelope: any) => {
  if (!envelope) return null;
  const candidate = envelope?.candidates?.[0];
  return candidate?.content?.parts?.[0]?.text ?? null;
};

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const tryExtractJson = (value: string) => {
  const match = value.match(/\{[\s\S]*\}/);
  return match ? safeJsonParse(match[0]) : null;
};

const ensureClueArray = (clues: any): any[] => (Array.isArray(clues) ? clues : []);

const sanitizeText = (value: any) => (typeof value === 'string' ? value.trim() : '');

const validUrl = (value: any) => typeof value === 'string' && /^https?:\/\//i.test(value);

const findMatchingCategoryIndex = (categories: { title: string }[], title: any) => {
  if (typeof title !== 'string') return -1;
  const target = title.trim().toLowerCase();
  return categories.findIndex((cat) => cat.title.trim().toLowerCase() === target);
};

const truncate = (value: string, max = 500) => (value?.length > max ? `${value.slice(0, max)}…` : value || '');
