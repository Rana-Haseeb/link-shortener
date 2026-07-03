# Link Shortener

A modern URL shortener built with **Next.js (App Router)**, **MongoDB/Mongoose**, and **Tailwind CSS**. Paste a long URL, get a clean short link with a scannable QR code, and track clicks on every visit.

It also enriches every link with AI: a summary, category, and tags (via OpenRouter) plus a safety status, and offers a free **styled QR code** (gradient, rounded modules) rendered client-side.

---

## Features

- 🔗 **URL shortening** — custom Base62 encoding with a collision-resistant random fallback.
- 📊 **Click analytics** — every redirect logs the visit (device / user-agent, referrer, timestamp).
- 🧠 **AI link metadata** — summary, category, tags, and a safety status generated on creation (OpenRouter).
- 🎨 **Styled QR codes** — free, client-side gradient/rounded QR (via `qr-code-styling`) with PNG download, alongside the plain QR.
- 🧾 **Standard QR codes** — base64 PNG data URIs generated on demand.
- 🌙 **Clean dark-mode UI** — responsive Tailwind landing page with copy-to-clipboard.
- ⚡ **Serverless-friendly** — cached Mongoose connection that survives hot-reloads and serverless invocations.

---

## Tech Stack

| Layer       | Technology                          |
| ----------- | ----------------------------------- |
| Framework   | Next.js 16 (App Router, JavaScript) |
| Database    | MongoDB via Mongoose                |
| Styling     | Tailwind CSS                        |
| QR codes    | `qrcode` + `qr-code-styling`        |
| AI metadata | OpenRouter (`openai/gpt-4o-mini`)   |
| Env / config| `dotenv`                            |
| Linting     | ESLint (`eslint-config-next`)       |

---

## Project Structure

```
src/
├── app/
│   ├── page.js                # Landing page + URL submission form
│   ├── api/
│   │   ├── links/route.js        # POST — create a short link (+ AI metadata)
│   │   └── qr/route.js           # GET  — generate a QR code data URI
│   └── rs/[code]/route.js        # GET  — redirect + click logging
├── lib/
│   ├── db.js                     # Cached Mongoose connection helper
│   ├── ai/
│   │   └── metadata.js           # OpenRouter summary/category/tags/safety
│   └── utils/base62.js           # encode / decode / random code generator
└── models/
    ├── Link.js                # Link schema
    └── Click.js               # Click analytics schema
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```bash
MONGODB_URI=your_mongodb_connection_string
OPENROUTER_API_KEY=your_openrouter_api_key   # AI link metadata (summary/category/tags/safety)
```

> - `MONGODB_URI` is **required** — the app won't connect without it.
> - `OPENROUTER_API_KEY` powers AI metadata. If absent, links are still created without metadata.
> - Styled QR codes are rendered entirely client-side (`qr-code-styling`) and need **no API key**.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

### `POST /api/links`

Create a new short link.

**Request body**

```json
{ "longUrl": "https://example.com/some/very/long/path" }
```

**Response — `201 Created`**

On creation the link is enriched with AI metadata (best-effort — the link is still
returned if the AI call fails).

```json
{
  "id": "65f...",
  "longUrl": "https://example.com/some/very/long/path",
  "shortCode": "bfP3Qp",
  "securityStatus": "safe",
  "aiMetadata": {
    "summary": "A concise description of the destination.",
    "category": "News",
    "tags": ["example", "web", "article"]
  },
  "createdAt": "2026-05-30T12:00:00.000Z"
}
```

| Status | Meaning                                |
| ------ | -------------------------------------- |
| 400    | Missing/invalid JSON or non-http(s) URL|
| 500    | Server / database error                |

### `GET /api/qr?url=<encoded_url>`

Generate a standard QR code for any URL.

**Response — `200 OK`**

```json
{ "url": "http://localhost:3000/rs/bfP3Qp", "qrCode": "data:image/png;base64,..." }
```

The `qrCode` field is a data URI that can be used directly as an `<img src>`.

> The **styled QR** (gradient / rounded modules) is generated in the browser with
> `qr-code-styling` — no API endpoint or key required. Toggle it in the result card.

### `GET /rs/[code]`

Resolve a short code and redirect to the original URL. Logs a click on every visit, then issues a **302** redirect (temporary, so analytics keep firing). Unknown codes redirect to the home page.

---

## Data Models

**Link**

| Field            | Type     | Notes                                       |
| ---------------- | -------- | ------------------------------------------- |
| `longUrl`        | String   | required                                    |
| `shortCode`      | String   | required, unique                            |
| `createdAt`      | Date     | defaults to now                             |
| `securityStatus` | String   | `safe` \| `flagged` \| `pending`            |
| `aiMetadata`     | Object   | `{ summary, category, tags[] }` (AI-filled) |
| `artisticQrUrl`  | String   | reserved for future AI-art QR (roadmap)     |

**Click**

| Field       | Type     | Notes                       |
| ----------- | -------- | --------------------------- |
| `linkId`    | ObjectId | references `Link`           |
| `timestamp` | Date     | defaults to now             |
| `device`    | String   | from the `user-agent` header|
| `referrer`  | String   | from the `referer` header   |

---

## Scripts

| Command         | Description                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Start the development server      |
| `npm run build` | Create a production build         |
| `npm run start` | Run the production build          |
| `npm run lint`  | Run ESLint                        |

---

## Roadmap

- [x] AI link summaries & categorization (OpenRouter)
- [x] Styled QR codes (`qr-code-styling`, free & client-side)
- [x] AI-driven safety status on `securityStatus`
- [ ] Optional AI-art QR codes (fal.ai / local ControlNet) for users who want generated art
- [ ] Dedicated threat-intel scanning (e.g. Google Safe Browsing) for stronger safety checks
- [ ] Analytics dashboard for click data
