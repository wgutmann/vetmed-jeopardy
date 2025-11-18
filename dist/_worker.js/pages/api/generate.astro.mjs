globalThis.process ??= {}; globalThis.process.env ??= {};
export { r as renderers } from '../../chunks/_@astro-renderers_CCFqxJvH.mjs';

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_CATEGORIES = 6;
const CLUE_VALUES = [200, 400, 600, 800, 1e3];
const REQUEST_TIMEOUT_MS = 25e3;
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    categories: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          clues: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                value: { type: "INTEGER" },
                question: { type: "STRING" },
                answer: { type: "STRING" },
                imageUrl: { type: "STRING" },
                imagePrompt: { type: "STRING" }
              },
              required: ["value", "question", "answer"]
            }
          }
        },
        required: ["title", "clues"]
      }
    }
  },
  required: ["categories"]
};
const GET = async () => {
  return new Response(
    JSON.stringify({
      message: "VetMed Jeopardy Board Generator API",
      method: "POST",
      description: "Generate a veterinary medicine Jeopardy board",
      body: {
        existingCategories: "optional array of existing categories to hybridize with AI generation"
      }
    }),
    { status: 200, headers: JSON_HEADERS }
  );
};
const POST = async ({ request, locals }) => {
  const apiKey = resolveGeminiKey(locals);
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
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const raw = await resp.text();
    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: "GenAI request failed", status: resp.status, detail: truncate(raw) }),
        { status: 502, headers: JSON_HEADERS }
      );
    }
    const parsedEnvelope = safeJsonParse(raw);
    const textPayload = extractCandidateText(parsedEnvelope);
    if (!textPayload) {
      return new Response(JSON.stringify({ error: "No content generated" }), { status: 500, headers: JSON_HEADERS });
    }
    const parsedJson = safeJsonParse(textPayload) ?? tryExtractJson(textPayload);
    if (!parsedJson || !Array.isArray(parsedJson.categories)) {
      return new Response(JSON.stringify({ error: "No JSON content parsed from GenAI response" }), { status: 500, headers: JSON_HEADERS });
    }
    const normalizedBoard = normalizeBoard(parsedJson.categories);
    const mergedBoard = mergeUserCategories(existingCategories, normalizedBoard);
    return new Response(JSON.stringify({ categories: mergedBoard }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    const status = err?.name === "AbortError" ? 504 : 500;
    return new Response(JSON.stringify({ error: err?.message || "Generation failed" }), { status, headers: JSON_HEADERS });
  } finally {
    clearTimeout(timeout);
  }
};
const sanitizeExistingCategories = (categories) => categories.slice(0, MAX_CATEGORIES).map((category) => ({
  title: sanitizeText(category?.title),
  clues: ensureClueArray(category?.clues).slice(0, CLUE_VALUES.length).map((clue) => ({
    value: Number(clue?.value) || void 0,
    question: sanitizeText(clue?.question),
    answer: sanitizeText(clue?.answer),
    imageUrl: validUrl(clue?.imageUrl) ? clue.imageUrl : void 0
  }))
}));
const buildPrompt = (categories) => {
  const intro = `Create a rigorous Veterinary Medicine Jeopardy board with ${MAX_CATEGORIES} distinct categories.
Each category must contain exactly ${CLUE_VALUES.length} clues with dollar values ${CLUE_VALUES.join(", ")}.
Ensure clues are medically accurate and targeted at veterinary students.
Always include one category named "Visual Diagnosis" if the user did not supply one.`;
  if (!categories.length) {
    return `${intro}
Return JSON that matches the provided schema.`;
  }
  const providedSummary = JSON.stringify(categories);
  return `${intro}
The user supplied the following partial board. Keep their text verbatim and only generate what is missing.
DATA: ${providedSummary}`;
};
const buildGenAiPayload = (prompt) => ({
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: RESPONSE_SCHEMA,
    temperature: 0.65
  }
});
const normalizeBoard = (categories) => {
  return categories.slice(0, MAX_CATEGORIES).map((cat, index) => ({
    title: sanitizeText(cat?.title) || `Category ${index + 1}`,
    clues: normalizeClues(cat?.clues, index)
  }));
};
const normalizeClues = (clues, categoryIndex) => {
  const list = ensureClueArray(clues);
  return CLUE_VALUES.map((value, clueIndex) => {
    const candidate = list.find((item) => Number(item?.value) === value) ?? list[clueIndex] ?? {};
    return {
      value,
      question: sanitizeText(candidate.question) || `Question ${categoryIndex + 1}-${clueIndex + 1}`,
      answer: sanitizeText(candidate.answer) || "Answer not provided",
      imageUrl: validUrl(candidate.imageUrl) ? candidate.imageUrl : void 0
    };
  });
};
const mergeUserCategories = (userCategories, generated) => {
  if (!userCategories.length) return padCategories(generated);
  const pool = [...generated];
  const merged = [];
  userCategories.slice(0, MAX_CATEGORIES).forEach((userCat, index) => {
    const baseIndex = findMatchingCategoryIndex(pool, userCat?.title);
    const base = baseIndex >= 0 ? pool.splice(baseIndex, 1)[0] : pool.shift() ?? buildEmptyCategory(index);
    merged.push(mergeCategory(userCat, base, index));
  });
  return padCategories([...merged, ...pool]);
};
const mergeCategory = (userCategory, baseCategory, index) => {
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
          imageUrl: validUrl(provided.imageUrl) ? provided.imageUrl : baseCategory.clues[clueIndex]?.imageUrl
        };
      }
      return baseCategory.clues[clueIndex] ?? buildEmptyClue(value, clueIndex, index);
    })
  };
};
const padCategories = (categories) => {
  const result = [...categories];
  while (result.length < MAX_CATEGORIES) {
    result.push(buildEmptyCategory(result.length));
  }
  return result.slice(0, MAX_CATEGORIES);
};
const buildEmptyCategory = (index) => ({
  title: `Category ${index + 1}`,
  clues: CLUE_VALUES.map((value, clueIndex) => buildEmptyClue(value, clueIndex, index))
});
const buildEmptyClue = (value, clueIndex, categoryIndex) => ({
  value,
  question: `Placeholder clue ${categoryIndex + 1}-${clueIndex + 1}`,
  answer: "Answer pending"
});
const resolveGeminiKey = (locals) => {
  const localsEnv = locals?.runtime?.env || locals?.env;
  return localsEnv?.GEMINI_API_KEY || "replace-with-local-key";
};
const resolveModelName = () => {
  return "gemini-1.5-flash";
};
const extractCandidateText = (envelope) => {
  if (!envelope) return null;
  const candidate = envelope?.candidates?.[0];
  return candidate?.content?.parts?.[0]?.text ?? null;
};
const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};
const tryExtractJson = (value) => {
  const match = value.match(/\{[\s\S]*\}/);
  return match ? safeJsonParse(match[0]) : null;
};
const ensureClueArray = (clues) => Array.isArray(clues) ? clues : [];
const sanitizeText = (value) => typeof value === "string" ? value.trim() : "";
const validUrl = (value) => typeof value === "string" && /^https?:\/\//i.test(value);
const findMatchingCategoryIndex = (categories, title) => {
  if (typeof title !== "string") return -1;
  const target = title.trim().toLowerCase();
  return categories.findIndex((cat) => cat.title.trim().toLowerCase() === target);
};
const truncate = (value, max = 500) => value?.length > max ? `${value.slice(0, max)}…` : value || "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
