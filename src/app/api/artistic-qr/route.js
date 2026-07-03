import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Link from '@/models/Link';
import { generateArtisticQr } from '@/lib/ai/artisticQr';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { url, id } = body ?? {};
    if (typeof url !== 'string' || !url) {
      return NextResponse.json({ error: 'A "url" field is required' }, { status: 400 });
    }

    const artisticQrUrl = await generateArtisticQr(url);

    if (!artisticQrUrl) {
      // fal.ai unavailable (e.g. no balance) — tell the client to keep the standard QR.
      return NextResponse.json(
        { artisticQrUrl: null, message: 'Artistic QR generation is unavailable' },
        { status: 503 }
      );
    }

    // Persist onto the link document when an id is provided.
    if (id) {
      try {
        await connectDB();
        await Link.findByIdAndUpdate(id, { artisticQrUrl });
      } catch (err) {
        console.error('Failed to persist artisticQrUrl:', err.message);
      }
    }

    return NextResponse.json({ artisticQrUrl }, { status: 200 });
  } catch (error) {
    console.error('POST /api/artistic-qr failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
