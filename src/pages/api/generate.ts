import type { APIRoute } from 'astro';
import { Type } from '@google/genai';

// Use the GenAI REST API via fetch to improve portability with Cloudflare Pages.
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    message: 'VetMed Jeopardy Board Generator API',
    method: 'POST',
    description: 'Generate a veterinary medicine Jeopardy board',
    body: {
      existingCategories: 'optional array of existing categories to hybridize with AI generation'
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Resolve GEMINI_API_KEY from several fallbacks.
    // Priority: Cloudflare Pages secret > local .env.local > .env > process.env
    const localsEnv = (locals as any)?.runtime?.env || (locals as any)?.env;
    const apiKey = localsEnv?.GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    const body = await request.json().catch(() => ({}));
    const forceReal = !!(body?.forceReal || (import.meta.env as any).VITE_FORCE_REAL_GEN === '1' || process.env.FORCE_REAL_GEN === '1');

    // Allow overriding apiKey from request body in local dev (use with caution)
    const overrideKey = body?.apiKey;
    const effectiveApiKey = overrideKey || apiKey;

    // For development without API key, return mock data unless forceReal requested
    if (!effectiveApiKey && !forceReal) {
      console.log('No GEMINI_API_KEY found, returning mock data for development');
      return new Response(JSON.stringify({
        categories: [
          {
            title: "Veterinary Anatomy",
            clues: [
              { value: 200, question: "What is the largest organ in the canine body?", answer: "The skin" },
              { value: 400, question: "How many chambers does a dog's heart have?", answer: "Four" },
              { value: 600, question: "What bone connects the shoulder to the elbow?", answer: "The humerus" },
              { value: 800, question: "What is the medical term for the windpipe?", answer: "Trachea" },
              { value: 1000, question: "What gland produces insulin in dogs?", answer: "Pancreas" }
            ]
          },
          {
            title: "Common Diseases",
            clues: [
              { value: 200, question: "What viral disease causes vomiting and diarrhea in puppies?", answer: "Parvovirus" },
              { value: 400, question: "What is the most common type of heart disease in dogs?", answer: "Mitral valve disease" },
              { value: 600, question: "What bacterial infection affects a dog's ears?", answer: "Otitis externa" },
              { value: 800, question: "What autoimmune disease causes joint pain in dogs?", answer: "Rheumatoid arthritis" },
              { value: 1000, question: "What parasitic infection is transmitted by ticks?", answer: "Lyme disease" }
            ]
          },
          {
            title: "Pharmacology",
            clues: [
              { value: 200, question: "What antibiotic is commonly used for skin infections?", answer: "Cephalexin" },
              { value: 400, question: "What drug is used to control seizures in dogs?", answer: "Phenobarbital" },
              { value: 600, question: "What is the active ingredient in Benadryl?", answer: "Diphenhydramine" },
              { value: 800, question: "What steroid is used for anti-inflammatory purposes?", answer: "Prednisone" },
              { value: 1000, question: "What anticoagulant is used to prevent blood clots?", answer: "Heparin" }
            ]
          },
          {
            title: "Surgery",
            clues: [
              { value: 200, question: "What is the most common surgical procedure in dogs?", answer: "Spaying" },
              { value: 400, question: "What type of anesthesia is commonly used in veterinary surgery?", answer: "Isoflurane" },
              { value: 600, question: "What instrument is used to cut tissue during surgery?", answer: "Scalpel" },
              { value: 800, question: "What is the term for surgical removal of a limb?", answer: "Amputation" },
              { value: 1000, question: "What type of suture is absorbable?", answer: "Vicryl" }
            ]
          },
          {
            title: "Nutrition",
            clues: [
              { value: 200, question: "What nutrient is essential for healthy bones?", answer: "Calcium" },
              { value: 400, question: "What vitamin is produced by sunlight exposure?", answer: "Vitamin D" },
              { value: 600, question: "What is the main energy source in dog food?", answer: "Carbohydrates" },
              { value: 800, question: "What mineral is important for thyroid function?", answer: "Iodine" },
              { value: 1000, question: "What fatty acid is important for skin health?", answer: "Omega-3" }
            ]
          },
          {
            title: "Visual Diagnosis",
            clues: [
              { value: 200, question: "What condition shows as redness and swelling of the gums?", answer: "Gingivitis" },
              { value: 400, question: "What skin condition appears as circular, red lesions?", answer: "Ringworm" },
              { value: 600, question: "What eye condition causes cloudiness of the cornea?", answer: "Corneal ulcer" },
              { value: 800, question: "What dental condition shows brown tartar buildup?", answer: "Periodontal disease" },
              { value: 1000, question: "What abdominal condition shows distension and pain?", answer: "Bloat" }
            ]
          }
        ]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existingCategories = Array.isArray(body?.existingCategories) ? body.existingCategories : [];
    const schema = {
      type: Type.OBJECT,
      properties: {
        categories: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              clues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    value: { type: Type.INTEGER },
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    imageUrl: { type: Type.STRING },
                    imagePrompt: { type: Type.STRING },
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
    };

    let prompt = `
      Create a rigorous Veterinary Medicine Jeopardy game board.
      Generate 6 distinct categories.
      For EACH category, generate exactly 5 clues with values: 200, 400, 600, 800, 1000.
      Ensure the facts are medically accurate and suitable for veterinary students or professionals.
    `;

    if (existingCategories.length > 0) {
      prompt += `
        IMPORTANT - HYBRID MODE:
        The user has provided some existing game board data (categories and clues).
        You MUST include the provided categories and clues EXACTLY as they appear.
        If a provided category has fewer than 5 clues, generate the missing clues.
        If fewer than 6 categories exist, add new distinct categories to reach 6 total.
        Prefer one category named 'Visual Diagnosis' if not already present.
        PROVIDED DATA: ${JSON.stringify(existingCategories)}
      `;
    } else {
      prompt += `
        Include one category named 'Visual Diagnosis'. For that category, include an 'imagePrompt' describing a specific medical image.
      `;
    }

    // Build the REST request payload following the GenAI REST API structure.
    // We ask for a JSON response and provide a response schema to make parsing deterministic.
    const restPayload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        temperature: 0.7,
      },
    };

    const genAiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveApiKey}`;
    const resp = await fetch(genAiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(restPayload),
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '');
      // If API key has referrer restrictions (common in dev), fall back to mock data
      if (!forceReal && resp.status === 403 && txt.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
        console.log('API key has referrer restrictions, falling back to mock data for development');
        return new Response(JSON.stringify({
          categories: [
            {
              title: "Veterinary Anatomy",
              clues: [
                { value: 200, question: "What is the largest organ in the canine body?", answer: "The skin" },
                { value: 400, question: "How many chambers does a dog's heart have?", answer: "Four" },
                { value: 600, question: "What bone connects the shoulder to the elbow?", answer: "The humerus" },
                { value: 800, question: "What is the medical term for the windpipe?", answer: "Trachea" },
                { value: 1000, question: "What gland produces insulin in dogs?", answer: "Pancreas" }
              ]
            },
            {
              title: "Common Diseases",
              clues: [
                { value: 200, question: "What viral disease causes vomiting and diarrhea in puppies?", answer: "Parvovirus" },
                { value: 400, question: "What is the most common type of heart disease in dogs?", answer: "Mitral valve disease" },
                { value: 600, question: "What bacterial infection affects a dog's ears?", answer: "Otitis externa" },
                { value: 800, question: "What autoimmune disease causes joint pain in dogs?", answer: "Rheumatoid arthritis" },
                { value: 1000, question: "What parasitic infection is transmitted by ticks?", answer: "Lyme disease" }
              ]
            },
            {
              title: "Pharmacology",
              clues: [
                { value: 200, question: "What antibiotic is commonly used for skin infections?", answer: "Cephalexin" },
                { value: 400, question: "What drug is used to control seizures in dogs?", answer: "Phenobarbital" },
                { value: 600, question: "What is the active ingredient in Benadryl?", answer: "Diphenhydramine" },
                { value: 800, question: "What steroid is used for anti-inflammatory purposes?", answer: "Prednisone" },
                { value: 1000, question: "What anticoagulant is used to prevent blood clots?", answer: "Heparin" }
              ]
            },
            {
              title: "Surgery",
              clues: [
                { value: 200, question: "What is the most common surgical procedure in dogs?", answer: "Spaying" },
                { value: 400, question: "What type of anesthesia is commonly used in veterinary surgery?", answer: "Isoflurane" },
                { value: 600, question: "What instrument is used to cut tissue during surgery?", answer: "Scalpel" },
                { value: 800, question: "What is the term for surgical removal of a limb?", answer: "Amputation" },
                { value: 1000, question: "What type of suture is absorbable?", answer: "Vicryl" }
              ]
            },
            {
              title: "Nutrition",
              clues: [
                { value: 200, question: "What nutrient is essential for healthy bones?", answer: "Calcium" },
                { value: 400, question: "What vitamin is produced by sunlight exposure?", answer: "Vitamin D" },
                { value: 600, question: "What is the main energy source in dog food?", answer: "Carbohydrates" },
                { value: 800, question: "What mineral is important for thyroid function?", answer: "Iodine" },
                { value: 1000, question: "What fatty acid is important for skin health?", answer: "Omega-3" }
              ]
            },
            {
              title: "Visual Diagnosis",
              clues: [
                { value: 200, question: "What condition shows as redness and swelling of the gums?", answer: "Gingivitis" },
                { value: 400, question: "What skin condition appears as circular, red lesions?", answer: "Ringworm" },
                { value: 600, question: "What eye condition causes cloudiness of the cornea?", answer: "Corneal ulcer" },
                { value: 800, question: "What dental condition shows brown tartar buildup?", answer: "Periodontal disease" },
                { value: 1000, question: "What abdominal condition shows distension and pain?", answer: "Bloat" }
              ]
            }
          ]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // If forcing real, or other errors, propagate details to caller so they can inspect
      return new Response(JSON.stringify({ error: 'GenAI request failed', detail: txt }), { status: 502 });
    }

    const json = await resp.json().catch(() => null);
    // The REST response format: { candidates: [{ content: { parts: [{ text: '...' }] } }] }
    let text = null as string | null;
    if (json && Array.isArray(json.candidates) && json.candidates[0]?.content?.parts?.[0]?.text) {
      text = json.candidates[0].content.parts[0].text;
    }

    if (!text) {
      // As a fallback, attempt to stringify the whole response and parse JSON out of it.
      try {
        const s = JSON.stringify(json || {});
        text = s;
      } catch (e) {
        return new Response(JSON.stringify({ error: 'No content generated' }), { status: 500 });
      }
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // If text was plain JSON within a wrapper string, attempt to extract JSON substring.
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try { data = JSON.parse(m[0]); } catch (ee) { data = null; }
      }
    }

    if (!data) return new Response(JSON.stringify({ error: 'No JSON content parsed from GenAI response' }), { status: 500 });

    // Drop imagePrompt field (no server-side image generation in Pages runtime)
    for (const category of data.categories) {
      for (const clue of category.clues) {
        if ('imagePrompt' in clue) delete clue.imagePrompt;
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'Generation failed' }), { status: 500 });
  }
};
