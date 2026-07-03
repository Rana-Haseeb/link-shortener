import QRCode from 'qrcode';

const FAL_URL = 'https://fal.run/fal-ai/illusion-diffusion';

const DEFAULT_PROMPT =
  'a beautiful vibrant landscape, intricate detail, high contrast, artistic, masterpiece';

/**
 * Generate an artistic QR code via fal.ai's illusion-diffusion model.
 * Never throws — returns null on any failure (missing key, no balance, API error)
 * so the caller can fall back to the standard QR code.
 *
 * @param {string} url - The URL to encode.
 * @param {string} [prompt] - Optional art style prompt.
 * @returns {Promise<string|null>} URL of the generated image, or null.
 */
export async function generateArtisticQr(url, prompt = DEFAULT_PROMPT) {
  const apiKey = process.env.FAL_AI_API_KEY;
  if (!apiKey) return null;

  try {
    // fal accepts a data URI for image_url, so we generate the base QR inline.
    const qrDataUri = await QRCode.toDataURL(url, { width: 512, margin: 2 });

    const res = await fetch(FAL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: qrDataUri,
        prompt,
        image_size: 'square_hd',
      }),
    });

    if (!res.ok) {
      // 403 with "Exhausted balance" lands here — degrade gracefully.
      const detail = await res.text();
      console.error('fal.ai artistic QR failed:', res.status, detail.slice(0, 200));
      return null;
    }

    const data = await res.json();
    // illusion-diffusion returns { images: [{ url }] }.
    return data?.images?.[0]?.url ?? data?.image?.url ?? null;
  } catch (err) {
    console.error('generateArtisticQr error:', err.message);
    return null;
  }
}
