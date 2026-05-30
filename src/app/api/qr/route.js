import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'A "url" query parameter is required' },
        { status: 400 }
      );
    }

    // Generate a base64 PNG Data URI the frontend can drop straight into an <img src>.
    const dataUri = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });

    return NextResponse.json({ url, qrCode: dataUri }, { status: 200 });
  } catch (error) {
    console.error('GET /api/qr failed:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
