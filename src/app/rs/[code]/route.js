import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Link from '@/models/Link';
import Click from '@/models/Click';

export async function GET(request, { params }) {
  const { code } = await params;

  try {
    await connectDB();

    const link = await Link.findOne({ shortCode: code });

    if (!link) {
      // Unknown code — send the visitor back to the home page.
      return NextResponse.redirect(new URL('/', request.url), 302);
    }

    // Log the click without blocking the redirect. Failures here must not
    // break the user's navigation, so swallow any logging error.
    Click.create({
      linkId: link._id,
      device: request.headers.get('user-agent') ?? 'unknown',
      referrer: request.headers.get('referer') ?? '',
    }).catch((err) => console.error('Click logging failed:', err));

    // 302 temporary redirect so analytics keep firing on every visit
    // (a 301 would let browsers cache the redirect and skip our route).
    return NextResponse.redirect(link.longUrl, 302);
  } catch (error) {
    console.error(`GET /rs/${code} failed:`, error);
    return NextResponse.redirect(new URL('/', request.url), 302);
  }
}
