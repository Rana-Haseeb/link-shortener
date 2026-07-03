'use client';

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const [longUrl, setLongUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shortLinkData, setShortLinkData] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [styled, setStyled] = useState(false);
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
    setStyled(false);
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

  // Once we have a short link, fetch its standard QR code from /api/qr.
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

            {/* AI-generated metadata. */}
            {shortLinkData.aiMetadata?.summary && (
              <div className="mt-4 border-t border-zinc-800 pt-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SecurityBadge status={shortLinkData.securityStatus} />
                  {shortLinkData.aiMetadata.category && (
                    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                      {shortLinkData.aiMetadata.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-400">{shortLinkData.aiMetadata.summary}</p>
                {shortLinkData.aiMetadata.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {shortLinkData.aiMetadata.tags.map((tag) => (
                      <span key={tag} className="text-xs text-indigo-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* QR code — standard PNG, or a styled QR rendered client-side. */}
            {qrCodeData && (
              <div className="mt-5 flex flex-col items-center border-t border-zinc-800 pt-5">
                {/* Toggle between the two QR styles. */}
                <div className="mb-4 inline-flex rounded-lg border border-zinc-700 p-0.5 text-sm">
                  <button
                    onClick={() => setStyled(false)}
                    className={`rounded-md px-3 py-1 transition ${
                      !styled ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setStyled(true)}
                    className={`rounded-md px-3 py-1 transition ${
                      styled ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    ✨ Styled
                  </button>
                </div>

                {styled ? (
                  <StyledQr url={shortUrl} />
                ) : (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrCodeData}
                      alt={`QR code for ${shortUrl}`}
                      width={220}
                      height={220}
                      className="rounded-lg bg-white p-2"
                    />
                    <p className="mt-2 text-xs text-zinc-500">Scan to open the link</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function StyledQr({ url }) {
  const containerRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      // qr-code-styling touches the DOM, so import it only on the client.
      const QRCodeStyling = (await import('qr-code-styling')).default;
      if (cancelled) return;

      const qr = new QRCodeStyling({
        width: 220,
        height: 220,
        data: url,
        margin: 8,
        // High error correction keeps the code scannable despite styling.
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: {
          type: 'rounded',
          gradient: {
            type: 'linear',
            rotation: 0.8,
            colorStops: [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: '#a855f7' },
            ],
          },
        },
        cornersSquareOptions: { type: 'extra-rounded', color: '#4f46e5' },
        cornersDotOptions: { type: 'dot', color: '#a855f7' },
        backgroundOptions: { color: '#ffffff' },
      });

      qrRef.current = qr;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qr.append(containerRef.current);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  function download() {
    qrRef.current?.download({ name: 'styled-qr', extension: 'png' });
  }

  return (
    <div className="flex flex-col items-center">
      <div ref={containerRef} className="rounded-lg bg-white p-2" />
      <button
        onClick={download}
        className="mt-3 rounded-md border border-indigo-500/40 px-3 py-1.5 text-sm text-indigo-300 transition hover:bg-indigo-500/10"
      >
        ⬇ Download PNG
      </button>
    </div>
  );
}

function SecurityBadge({ status }) {
  const styles = {
    safe: 'bg-green-500/15 text-green-400',
    flagged: 'bg-red-500/15 text-red-400',
    pending: 'bg-yellow-500/15 text-yellow-400',
  };
  const label = {
    safe: '✓ Safe',
    flagged: '⚠ Flagged',
    pending: '… Pending',
  };
  const key = styles[status] ? status : 'pending';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[key]}`}>
      {label[key]}
    </span>
  );
}
