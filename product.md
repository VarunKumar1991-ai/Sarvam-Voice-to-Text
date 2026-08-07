# Product — Sarvam Voice-to-Text

## 1. What This Project Is

A lightweight, standalone web application that lets a user speak into
their microphone and get instant text — primarily in Indian languages —
powered by Sarvam AI's Saaras v3 speech-to-text model. It can be built, tested, and deployed
on its own, without depending on any other project (such as
case-management tools).

## 2. Problem It Solves

- Existing voice-typing tools (e.g. Google Docs Voice Typing) are either
  English-centric or lack accuracy for Indian languages, accents, and
  code-mixed speech (e.g. Hinglish).
- Sarvam AI's model is trained specifically on Indian languages and mixed
  colloquial speech, giving noticeably better accuracy for this use case.
- This project is a clean, secure (no API-key leakage) reference
  implementation that any developer can drop into their own app or
  extend further.

## 3. Target Users

- Developers who want to add Indian-language voice-to-text to their own
  Next.js project and need a correct, secure sample implementation to
  follow.
- End users who want to dictate in Hindi or another regional language for
  everyday tasks — notes, drafts, short messages, etc.

## 4. Core Features (Current)

| Feature | Description |
|---|---|
| One-click recording | "Start Speaking" button starts the mic; clicking again stops and auto-sends |
| 8 languages + English (India) | Hindi, English (India), Tamil, Telugu, Marathi, Gujarati, Bengali, Kannada |
| Editable transcript | Result appears in a textarea and can be edited directly |
| Continuous dictation | Each new recording's text is appended to the existing transcript |
| Copy / Clear | One-click copy or clear of the transcript |
| Mode control | `transcribe` (clean output), `verbatim` (word-for-word), `translate`, `translit`, `codemix` (Hinglish) |
| Secure key handling | API key never reaches the browser (see [architecture.md](./architecture.md)) |
| Type-safe end to end | TypeScript across client component, API route, and shared response contracts |

## 5. Out of Scope (For Now)

- User accounts/login, multi-user data isolation
- Persistent storage of transcripts (database)
- Speaker diarization (identifying who spoke)
- Live streaming transcription for long recordings/meetings
- Native mobile app (this is a responsive web app, not a native app)

## 6. Potential Roadmap (Unordered Backlog)

1. **Persistence** — option to save transcripts to a database
2. **Diarization** — label each speaker in multi-speaker recordings
3. **Streaming transcription** — live, incremental text updates
4. **Export options** — download as .txt / .docx
5. **Dark mode / theme options**
6. **Automated test suite**

## 7. Success Criteria (Qualitative)

- A user can get the app running locally within ~2 minutes with no
  friction.
- Transcription accuracy in Hindi and other supported languages feels
  practically usable (in a reasonably quiet environment).
- The API key must never leak into the client bundle — this is a hard
  security requirement, not a nice-to-have.
