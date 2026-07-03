const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini';

const SYSTEM_PROMPT = `You are a URL analysis assistant. Given a URL, infer what the destination is likely about from its domain and path.
Respond ONLY with a compact JSON object, no markdown, matching exactly:
{
  "summary": "one concise sentence describing the likely destination",
  "category": "a single short category label, e.g. News, Shopping, Video, Docs, Social, Blog, Software, Other",
  "tags": ["3", "to", "5", "lowercase", "keywords"],
  "securityStatus": "safe | flagged | pending"
}
Set securityStatus to "flagged" only if the URL looks like phishing, malware, or an obvious scam; otherwise "safe".`;

/**
 * Generate AI metadata for a URL using OpenRouter.
 * Never throws — returns null on any failure so link creation can proceed.
 *
 * @param {string} longUrl
 * @returns {Promise<{summary:string, category:string, tags:string[], securityStatus:string}|null>}
 */
export async function generateLinkMetadata(longUrl) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this URL: ${longUrl}` },
        ],
      }),
    });

    if (!res.ok) {
      console.error('OpenRouter metadata request failed:', res.status);
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    // Normalize / guard the shape before returning.
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      category: typeof parsed.category === 'string' ? parsed.category : 'Other',
      tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 5) : [],
      securityStatus: ['safe', 'flagged', 'pending'].includes(parsed.securityStatus)
        ? parsed.securityStatus
        : 'pending',
    };
  } catch (err) {
    console.error('generateLinkMetadata error:', err.message);
    return null;
  }
}
