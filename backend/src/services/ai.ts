// AI provider wrapper: Google Gemini first, Groq (OpenAI-compatible) as fallback.
// Both are called over plain REST so no extra SDK is needed.

export interface ChatTurn {
  role: 'user' | 'ai';
  text: string;
}

interface GenerateOptions {
  system: string;
  turns: ChatTurn[];
  json?: boolean;
  image?: { mimeType: string; base64: string };
  // Per-request limit so a stalled provider can't hang the caller
  timeoutMs?: number;
}

// Long enough for a 10-question quiz from a big document, short enough to fail over quickly
const DEFAULT_TIMEOUT_MS = 60000;

// fetch() hides the real network error in `cause`; surface it for the logs
const describeFetchError = (err: any) =>
  err?.name === 'TimeoutError' ? 'request timed out' : [err?.message, err?.cause?.code || err?.cause?.message].filter(Boolean).join(': ');

export class AIConfigError extends Error {}

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const isAIConfigured = () => Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY);

// Tried in order: Google returns 503 (overloaded) or 429 (quota) per model, so fall through to the next
const geminiModels = () => [
  ...new Set([process.env.GEMINI_MODEL || 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest']),
];

class RetryableError extends Error {}

const callGemini = async (options: GenerateOptions): Promise<string> => {
  let lastError: Error | null = null;
  for (const model of geminiModels()) {
    try {
      return await callGeminiModel(model, options);
    } catch (err: any) {
      lastError = err;
      if (!(err instanceof RetryableError)) throw err;
      console.warn(`[AI] ${model} unavailable, trying next model:`, err.message);
    }
  }
  throw lastError || new Error('No Gemini model available');
};

const callGeminiModel = async (model: string, { system, turns, json, image, timeoutMs }: GenerateOptions): Promise<string> => {
  const contents = turns.map((turn, i) => {
    const parts: any[] = [{ text: turn.text }];
    // Attach the image to the last user turn (used for OCR)
    if (image && i === turns.length - 1) {
      parts.unshift({ inline_data: { mime_type: image.mimeType, data: image.base64 } });
    }
    return { role: turn.role === 'ai' ? 'model' : 'user', parts };
  });

  let res: Response;
  try {
    res = await fetch(`${GEMINI_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY as string,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          temperature: json ? 0.4 : 0.7,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
      signal: AbortSignal.timeout(timeoutMs || DEFAULT_TIMEOUT_MS),
    });
  } catch (err: any) {
    throw new RetryableError(`Gemini ${model}: ${describeFetchError(err)}`);
  }

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = `Gemini ${model} ${res.status}: ${data?.error?.message || res.statusText}`;
    throw [429, 500, 503, 404].includes(res.status) ? new RetryableError(message) : new Error(message);
  }
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
  if (!text) throw new Error('Gemini returned an empty response');
  return text;
};

const callGroq = async ({ system, turns, json, image, timeoutMs }: GenerateOptions): Promise<string> => {
  if (image) throw new Error('Groq fallback does not support images');
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      temperature: json ? 0.4 : 0.7,
      messages: [
        { role: 'system', content: system },
        ...turns.map((t) => ({ role: t.role === 'ai' ? 'assistant' : 'user', content: t.text })),
      ],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
    signal: AbortSignal.timeout(timeoutMs || DEFAULT_TIMEOUT_MS),
  }).catch((err) => {
    throw new Error(`Groq: ${describeFetchError(err)}`);
  });

  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Groq ${res.status}: ${data?.error?.message || res.statusText}`);
  }
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Groq returned an empty response');
  return text;
};

export const generate = async (options: GenerateOptions): Promise<string> => {
  if (!isAIConfigured()) {
    throw new AIConfigError('AI is not configured. Add GEMINI_API_KEY (or GROQ_API_KEY) to backend/.env and restart the server.');
  }

  const errors: string[] = [];
  if (process.env.GEMINI_API_KEY) {
    try {
      return await callGemini(options);
    } catch (err: any) {
      console.error('[AI] Gemini failed:', err.message);
      errors.push(err.message);
    }
  }
  if (process.env.GROQ_API_KEY && !options.image) {
    try {
      return await callGroq(options);
    } catch (err: any) {
      console.error('[AI] Groq failed:', err.message);
      errors.push(err.message);
    }
  }
  throw new Error(`AI request failed. ${errors.join(' | ')}`);
};

// Models sometimes wrap JSON in ```json fences even in JSON mode
export const parseJSON = <T>(raw: string): T => {
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error('AI returned malformed JSON');
  }
};

export const generateJSON = async <T>(system: string, prompt: string, timeoutMs?: number): Promise<T> => {
  const raw = await generate({ system, turns: [{ role: 'user', text: prompt }], json: true, timeoutMs });
  return parseJSON<T>(raw);
};
