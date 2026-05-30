'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortLinkData, setShortLinkData] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [copied, setCopied] = useState(false);

  // Build the full short URL from the returned shortCode.
  const shortUrl = shortLinkData
    ? `${window.location.origin}/rs/${shortLinkData.shortCode}`
    : '';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setShortLinkData(null);
    setQrCodeData('');
    setCopied(false);

    if (!longUrl.trim()) {
      setError('Please enter a URL to shorten.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl: longUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setShortLinkData(data);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  // Once we have a short link, fetch its QR code from /api/qr.
  useEffect(() => {
    if (!shortLinkData) return;

    let cancelled = false;
    const url = `${window.location.origin}/rs/${shortLinkData.shortCode}`;

    async function fetchQr() {
      try {
        const res = await fetch(`/api/qr?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!cancelled && res.ok) {
          setQrCodeData(data.qrCode);
        }
      } catch {
        // QR is a non-critical enhancement; ignore failures silently.
      }
    }

    fetchQr();
    return () => {
      cancelled = true;
    };
  }, [shortLinkData]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable (e.g. non-secure context); ignore silently.
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 font-sans text-zinc-100">
      <main className="w-full max-w-xl">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Shorten your links
          </h1>
          <p className="mt-3 text-zinc-400">
            Paste a long URL and get a clean, shareable short link.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            placeholder="https://example.com/very/long/url"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Shortening…' : 'Shorten'}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Result section — rendered once the POST succeeds. */}
        {shortLinkData && (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="mb-1 truncate text-xs text-zinc-500" title={shortLinkData.longUrl}>
              {shortLinkData.longUrl}
            </p>

            <div className="flex items-center justify-between gap-3">
              <a
                href={shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-lg font-medium text-indigo-400 hover:text-indigo-300"
              >
                {shortUrl}
              </a>
              <button
                onClick={copyToClipboard}
                className="shrink-0 rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>

            {/* Standard QR code for the short link. */}
            {qrCodeData && (
              <div className="mt-5 flex flex-col items-center border-t border-zinc-800 pt-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeData}
                  alt={`QR code for ${shortUrl}`}
                  width={200}
                  height={200}
                  className="rounded-lg bg-white p-2"
                />
                <p className="mt-2 text-xs text-zinc-500">Scan to open the link</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
