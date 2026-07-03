import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Link from '@/models/Link';
import { encode, generateRandomCode } from '@/lib/utils/base62';
import { generateLinkMetadata } from '@/lib/ai/metadata';

// Large random offset keeps generated codes non-sequential/unguessable.
const MAX_RANDOM_OFFSET = 1_000_000_000;
const MAX_RETRIES = 5;

function isValidHttpUrl(value) {
  if (typeof value !== 'string') return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return url.protocol === 'http:' || url.protocol === 'https:';
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { longUrl } = body ?? {};

    if (!isValidHttpUrl(longUrl)) {
      return NextResponse.json(
        { error: 'A valid http or https URL is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Try a few times in case the generated code collides with an existing one.
    let link = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const count = await Link.estimatedDocumentCount();
      const numericId = count + Math.floor(Math.random() * MAX_RANDOM_OFFSET);
      const shortCode = encode(numericId);

      try {
        link = await Link.create({ longUrl, shortCode });
        break;
      } catch (err) {
        // Duplicate key on the unique shortCode index — retry with a new code.
        if (err?.code === 11000) continue;
        throw err;
      }
    }

    // Fallback: if encoding kept colliding, use a random code instead.
    if (!link) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const shortCode = generateRandomCode();
        try {
          link = await Link.create({ longUrl, shortCode });
          break;
        } catch (err) {
          if (err?.code === 11000) continue;
          throw err;
        }
      }
    }

    if (!link) {
      return NextResponse.json(
        { error: 'Could not generate a unique short code, please try again' },
        { status: 500 }
      );
    }

    // Enrich with AI metadata (summary/category/tags/security). Non-fatal:
    // if it fails or returns null, the link is still saved and returned.
    const aiMetadata = await generateLinkMetadata(link.longUrl);
    if (aiMetadata) {
      link.aiMetadata = {
        summary: aiMetadata.summary,
        category: aiMetadata.category,
        tags: aiMetadata.tags,
      };
      link.securityStatus = aiMetadata.securityStatus;
      await link.save();
    }

    return NextResponse.json(
      {
        id: link._id,
        longUrl: link.longUrl,
        shortCode: link.shortCode,
        securityStatus: link.securityStatus,
        aiMetadata: link.aiMetadata,
        createdAt: link.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/links failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
