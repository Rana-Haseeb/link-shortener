# Link Shortener

A modern URL shortener built with **Next.js (App Router)**, **MongoDB/Mongoose**, and **Tailwind CSS**. Paste a long URL, get a clean short link with a scannable QR code, and track clicks on every visit.

The data layer is also scaffolded for AI-powered enhancements (link summaries, categorization, security status, and artistic QR codes) via the Gemini and FAL AI API placeholders.

---

## Features

- 🔗 **URL shortening** — custom Base62 encoding with a collision-resistant random fallback.
- 📊 **Click analytics** — every redirect logs the visit (device / user-agent, referrer, timestamp).
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
| QR codes    | `qrcode`                            |
| Env / config| `dotenv`                            |
| Linting     | ESLint (`eslint-config-next`)       |

---

## Project Structure

```
src/
├── app/
│   ├── page.js                # Landing page + URL submission form
│   ├── api/
│   │   ├── links/route.js     # POST — create a short link
│   │   └── qr/route.js        # GET  — generate a QR code data URI
│   └── rs/[code]/route.js     # GET  — redirect + click logging
├── lib/
│   ├── db.js                  # Cached Mongoose connection helper
│   └── utils/base62.js        # encode / decode / random code generator
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
GEMINI_API_KEY=your_gemini_api_key      # reserved for AI metadata features
FAL_AI_API_KEY=your_fal_ai_api_key      # reserved for artistic QR features
```

> `MONGODB_URI` is required for the app to connect to the database. The AI keys are placeholders for upcoming features and are not yet wired up.

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

```json
{
  "id": "65f...",
  "longUrl": "https://example.com/some/very/long/path",
  "shortCode": "bfP3Qp",
  "securityStatus": "pending",
  "createdAt": "2026-05-30T12:00:00.000Z"
}
```

| Status | Meaning                                |
| ------ | -------------------------------------- |
| 400    | Missing/invalid JSON or non-http(s) URL|
| 500    | Server / database error                |

### `GET /api/qr?url=<encoded_url>`

Generate a QR code for any URL.

**Response — `200 OK`**

```json
{ "url": "http://localhost:3000/rs/bfP3Qp", "qrCode": "data:image/png;base64,..." }
```

The `qrCode` field is a data URI that can be used directly as an `<img src>`.

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
| `aiMetadata`     | Object   | `{ summary, category, tags[] }`             |
| `artisticQrUrl`  | String   | reserved for AI-generated QR art            |

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

- [ ] AI link summaries & categorization (Gemini)
- [ ] Artistic QR code generation (FAL AI)
- [ ] Security/safety scanning to drive `securityStatus`
- [ ] Analytics dashboard for click data
