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

  // Use a configured short domain in production; fall back to the current origin.
  const base = (
    process.env.NEXT_PUBLIC_SHORT_DOMAIN ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  ).replace(/\/$/, '');
  const shortUrl = shortLinkData ? `${base}/rs/${shortLinkData.shortCode}` : '';
  // Prettier version for display — no protocol, no leading "www.".
  const displayUrl = shortUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setShortLinkData(null);
    setQrCodeData('');
    setStyled(false);
    setCopied(false);

    if (!longUrl.trim()) {
      setError('Drop a URL in there first. ✨');
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
        setError(data.error || 'Something went sideways. Try again.');
        return;
      }
      setShortLinkData(data);
    } catch {
      setError('Network hiccup. Check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }

  // Fetch the standard QR once we have a short link. Uses the same shortUrl
  // as the display and styled QR so all three stay in sync.
  useEffect(() => {
    if (!shortUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/qr?url=${encodeURIComponent(shortUrl)}`);
        const data = await res.json();
        if (!cancelled && res.ok) setQrCodeData(data.qrCode);
      } catch {
        /* non-critical */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [shortUrl]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center px-4 py-14 font-sans text-zinc-100 sm:py-20">
      <main className="w-full max-w-2xl">
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center text-center">
          <span className="float mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium tracking-wide text-zinc-300 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            AI-powered · Lightning fast · Free
          </span>

          <h1 className="text-6xl font-black leading-none tracking-tighter sm:text-7xl">
            <span className="text-gradient">Zap</span>
            <span className="text-zinc-100">⚡</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-zinc-400">
            Paste a monstrous URL. Get a{' '}
            <span className="font-semibold text-zinc-200">tiny, intelligent link</span> —
            with an AI summary, a safety check, and a QR code you&apos;ll actually want to
            show off.
          </p>
        </div>

        {/* Form */}
        <div className="glow-border">
          <form
            onSubmit={handleSubmit}
            className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row"
          >
            <input
              type="url"
              value={longUrl}
              onChange={(e) => setLongUrl(e.target.value)}
              placeholder="https://your-absurdly-long-link.com/…"
              className="flex-1 rounded-xl bg-black/30 px-4 py-3.5 text-zinc-100 placeholder-zinc-500 outline-none transition focus:bg-black/50 focus:ring-2 focus:ring-indigo-500/50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="glow-pulse group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-cyan-500 px-7 py-3.5 font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className="relative z-10">
                {loading ? 'Zapping…' : 'Zap it ⚡'}
              </span>
              {loading && (
                <span className="shimmer absolute inset-0 z-0" aria-hidden="true" />
              )}
            </button>
          </form>
        </div>

        {/* Stat strip */}
        {!shortLinkData && !loading && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="AI metadata" value="🧠 Auto" />
            <Stat label="Safety check" value="🛡️ Built-in" />
            <Stat label="Styled QR" value="🎨 Free" />
          </div>
        )}

        {error && (
          <p className="pop mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </p>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="glass mt-6 space-y-4 rounded-2xl p-6">
            <div className="shimmer h-4 w-1/3 rounded bg-white/5" />
            <div className="shimmer h-8 w-2/3 rounded bg-white/5" />
            <div className="shimmer h-24 w-full rounded bg-white/5" />
            <p className="text-center text-xs text-zinc-500">
              Summoning your link &amp; asking the AI what it thinks…
            </p>
          </div>
        )}

        {/* Result */}
        {shortLinkData && !loading && (
          <div className="glass rise mt-6 overflow-hidden rounded-2xl">
            <div className="border-b border-white/5 bg-gradient-to-r from-indigo-500/10 via-fuchsia-500/10 to-cyan-500/10 px-6 py-3 text-xs font-medium uppercase tracking-widest text-zinc-400">
              ⚡ Your link is live
            </div>

            <div className="p-6">
              <p
                className="mb-1 truncate text-xs text-zinc-500"
                title={shortLinkData.longUrl}
              >
                {shortLinkData.longUrl}
              </p>

              <div className="flex items-center justify-between gap-3">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-fuchsia-300 hover:from-indigo-200 hover:to-fuchsia-200"
                >
                  {displayUrl}
                </a>
                <button
                  onClick={copyToClipboard}
                  className={`shrink-0 rounded-lg border px-3.5 py-1.5 text-sm transition ${
                    copied
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/10 text-zinc-300 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>

              {/* AI metadata */}
              {shortLinkData.aiMetadata?.summary && (
                <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <SecurityBadge status={shortLinkData.securityStatus} />
                    {shortLinkData.aiMetadata.category && (
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-zinc-300">
                        {shortLinkData.aiMetadata.category}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-zinc-600">
                      AI analysis
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {shortLinkData.aiMetadata.summary}
                  </p>
                  {shortLinkData.aiMetadata.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {shortLinkData.aiMetadata.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs text-indigo-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* QR */}
              {qrCodeData && (
                <div className="mt-6 flex flex-col items-center border-t border-white/5 pt-6">
                  <div className="mb-4 inline-flex rounded-xl border border-white/10 bg-black/20 p-1 text-sm">
                    <button
                      onClick={() => setStyled(false)}
                      className={`rounded-lg px-4 py-1.5 transition ${
                        !styled
                          ? 'bg-white/10 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Standard
                    </button>
                    <button
                      onClick={() => setStyled(true)}
                      className={`rounded-lg px-4 py-1.5 transition ${
                        styled
                          ? 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      ✨ Styled
                    </button>
                  </div>

                  {styled ? (
                    <StyledQr url={shortUrl} />
                  ) : (
                    <div className="pop flex flex-col items-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrCodeData}
                        alt={`QR code for ${shortUrl}`}
                        width={220}
                        height={220}
                        className="rounded-xl bg-white p-2 shadow-lg shadow-indigo-500/10"
                      />
                      <p className="mt-3 text-xs text-zinc-500">Scan to open the link</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="mt-14 text-center text-xs text-zinc-600">
          Built with Next.js · MongoDB · OpenRouter — and an unreasonable amount of ⚡
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="glass rounded-xl px-3 py-3 text-center">
      <div className="text-sm font-semibold text-zinc-200">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </div>
    </div>
  );
}

function StyledQr({ url }) {
  const containerRef = useRef(null);
  const qrRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // qr-code-styling touches the DOM, so import it only on the client.
      const QRCodeStyling = (await import('qr-code-styling')).default;
      if (cancelled) return;
      const qr = new QRCodeStyling({
        width: 220,
        height: 220,
        data: url,
        margin: 8,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: {
          type: 'rounded',
          gradient: {
            type: 'linear',
            rotation: 0.8,
            colorStops: [
              { offset: 0, color: '#6366f1' },
              { offset: 1, color: '#d946ef' },
            ],
          },
        },
        cornersSquareOptions: { type: 'extra-rounded', color: '#4f46e5' },
        cornersDotOptions: { type: 'dot', color: '#06b6d4' },
        backgroundOptions: { color: '#ffffff' },
      });
      qrRef.current = qr;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qr.append(containerRef.current);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  function download() {
    qrRef.current?.download({ name: 'zap-qr', extension: 'png' });
  }

  return (
    <div className="pop flex flex-col items-center">
      <div
        ref={containerRef}
        className="rounded-xl bg-white p-2 shadow-lg shadow-fuchsia-500/20"
      />
      <button
        onClick={download}
        className="mt-3 rounded-lg border border-indigo-500/40 px-3.5 py-1.5 text-sm text-indigo-300 transition hover:bg-indigo-500/10"
      >
        ⬇ Download PNG
      </button>
    </div>
  );
}

function SecurityBadge({ status }) {
  const styles = {
    safe: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    flagged: 'bg-red-500/15 text-red-300 border-red-500/30',
    pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
  const label = { safe: '✓ Safe', flagged: '⚠ Flagged', pending: '… Checking' };
  const key = styles[status] ? status : 'pending';
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[key]}`}
    >
      {label[key]}
    </span>
  );
}
