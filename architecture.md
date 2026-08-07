# Architecture — Sarvam Voice-to-Text

## 1. Purpose

This document describes how the project is technically built — components,
data flow, security boundaries, current limitations, and future extension
points.

This is a **standalone project**. It has no code-level dependency on any
other repository or application (e.g. case-management systems).

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server + Client components in one codebase; built-in API routes |
| Language | TypeScript | Static typing across client, server, and API contracts — catches integration bugs at compile time |
| UI | React 18, plain CSS (`app/globals.css`) | No heavy UI library — lightweight, custom-styled |
| Speech-to-Text | Sarvam AI — Saaras v3 (`sarvamai` SDK) | High accuracy for Indian languages (Hindi, Tamil, Telugu, etc.) |
| Audio capture | Browser MediaRecorder API + getUserMedia | No extra client-side dependency required |
| Deployment target | Any Next.js-compatible host (Vercel, Node server, etc.) | Must support both App Router and API routes |

---

## 3. High-Level Data Flow

```
[Browser Microphone]
      │  getUserMedia + MediaRecorder
      ▼
[VoiceRecorder.tsx  ("use client")]
      │  audio/webm Blob → FormData
      │  POST /api/transcribe
      ▼
[route.ts  (Server, Node runtime)]
      │  SarvamAIClient.speechToText.transcribe()
      │  (SARVAM_API_KEY is used here only)
      ▼
[Sarvam AI — Saaras v3 API]
      │  returns transcript text
      ▼
[route.ts] → JSON response → [VoiceRecorder.tsx] → rendered in the textarea
```

---

## 4. Component Breakdown

### 4.1 `app/components/VoiceRecorder.tsx` (Client Component)

- `"use client"` directive — runs in the browser.
- Responsibilities:
  - Requesting microphone access (mono, 16kHz, echo cancellation, noise
    suppression)
  - Capturing `audio/webm` chunks via `MediaRecorder`
  - On stop, building a `Blob` and posting it as `FormData` to
    `/api/transcribe`
  - Language selection (8 Indian languages + English (India)) — held in
    component state, sent as `language_code` with every request
  - Appending the returned transcript to existing text (continuous
    dictation)
  - Text editing, copy, and clear actions on an editable `<textarea>`
  - Fully typed: `LanguageCode` union type, typed `useRef<MediaRecorder | null>`
    and `useRef<Blob[]>`, typed fetch response shape (`TranscribeResponse`)
- **Never import `SARVAM_API_KEY` or `SarvamAIClient` into this file.**

### 4.2 `app/api/transcribe/route.ts` (Server Component / API Route)

- Next.js Route Handler — runs only on the server (Node runtime).
- Responsibilities:
  - Extracting the audio file and `language_code` from the incoming
    `FormData` (typed via `NextRequest`)
  - Passing the browser's `File`/`Blob` directly to the Sarvam SDK
    (`sarvamai` v1.1.x accepts `File | Blob | fs.ReadStream` natively —
    no manual Buffer conversion needed)
  - Initializing `SarvamAIClient` with `SARVAM_API_KEY` (env var)
  - Calling `speechToText.transcribe()` — `model: "saaras:v3"`, the
    selected language, and `mode: "transcribe"` (clean output;
    `"verbatim"` / `"translate"` / `"translit"` / `"codemix"` modes also
    available, `saaras:v3` only)
  - Returning `{ transcript }` on success, or `{ error, details }`
    (HTTP 400/500) on failure

### 4.3 `app/page.tsx` + `app/layout.tsx`

- `page.tsx` — home page; renders the header copy and mounts
  `VoiceRecorder`.
- `layout.tsx` — root HTML shell (`<html lang="hi">`), typed `Metadata`
  export, global CSS import, typed `children: ReactNode` prop.

### 4.4 `app/globals.css`

- The entire visual design (notebook/paper theme) is defined here — no
  CSS-in-JS or UI library.
- Google Fonts (Fraunces, Inter, Tiro Devanagari Hindi) loaded via
  `@import`.

---

## 5. Security Boundary

```
        Client (Browser)                │              Server (Node)
────────────────────────────────────────┼─────────────────────────────────
  VoiceRecorder.tsx                      │   route.ts
  - Records audio only                   │   - SARVAM_API_KEY lives here only
  - Calls /api/transcribe                │   - Calls Sarvam directly
  - No knowledge of the API key          │   - Env var is never sent to the client
```

- `SARVAM_API_KEY` lives only in `.env.local` — never committed
  (covered by `.gitignore`).
- `SarvamAIClient` must never be imported into a `"use client"` file, or
  the key could leak into the browser bundle.
- Microphone access requires HTTPS or `localhost` per browser policy.

---

## 6. Known Limitations

- No persistence layer — the transcript lives only in browser memory
  (React state) and is lost on refresh.
- Built for short clips (record → stop → send in one shot). Long
  recordings/meetings would need Sarvam's Streaming or Batch API.
- Speaker diarization (who spoke) is not implemented.
- No authentication/user-account system — this is a single-user
  tool/demo.
- No automated test suite yet.

## 7. Future Extension Points

- **Persistence:** add a save-call after `sendForTranscription` to
  store transcripts in a database (Supabase/Postgres/MongoDB).
- **Diarization:** use Sarvam's speaker-diarization feature to label
  multi-speaker output.
- **Streaming transcription:** live, incremental text updates via
  Sarvam's Streaming API + a WebSocket/SSE connection.
- **Auth:** if multi-user support is needed, add a solution like
  NextAuth.
- **Type-safe Sarvam SDK contract:** if the `sarvamai` SDK's published
  types are incomplete, introduce local interface augmentations in a
  `types/` directory rather than using `any`.
