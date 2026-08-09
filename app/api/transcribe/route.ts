// app/api/transcribe/route.ts
//
// यह एक Next.js API Route (सर्वर साइड कोड) है।
// ब्राउज़र से रिकॉर्ड की गई ऑडियो यहाँ आती है, और यहीं से Sarvam को भेजी जाती है।
// ⚠️ SARVAM_API_KEY हमेशा सिर्फ़ सर्वर साइड (यहाँ) पर इस्तेमाल होनी चाहिए —
//    इसे कभी भी क्लाइंट कोड ("use client" वाली फ़ाइलों) में मत डालें।

import { SarvamAI, SarvamAIClient, SarvamAIError } from "sarvamai";
import { NextRequest, NextResponse } from "next/server";

const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

const ALLOWED_MODES: readonly SarvamAI.Mode[] = [
  "transcribe",
  "verbatim",
  "translate",
  "translit",
  "codemix",
];

function parseMode(value: FormDataEntryValue | null): SarvamAI.Mode {
  return ALLOWED_MODES.includes(value as SarvamAI.Mode)
    ? (value as SarvamAI.Mode)
    : "transcribe";
}

// Sarvam के रियल-टाइम REST API से आने वाली संरचित एरर से असली मैसेज निकालना
// ताकि यूज़र को "Transcription में गड़बड़ी हुई" जैसा अस्पष्ट मैसेज न मिले
function extractSarvamErrorMessage(error: unknown): string | null {
  if (!(error instanceof SarvamAIError)) return null;
  const body = error.body;
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof (body as { error?: unknown }).error === "object" &&
    (body as { error?: unknown }).error !== null
  ) {
    const inner = (body as { error: { message?: unknown } }).error;
    if (typeof inner.message === "string") return inner.message;
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const languageCode = ((formData.get("language_code") as string) ||
      "hi-IN") as SarvamAI.SpeechToTextLanguage;

    if (!audioFile) {
      return NextResponse.json(
        { error: "कोई ऑडियो फ़ाइल नहीं मिली" },
        { status: 400 }
      );
    }

    const mode = parseMode(formData.get("mode"));

    const response = await client.speechToText.transcribe({
      file: audioFile, // ब्राउज़र से आया File/Blob सीधे SDK को दिया जा सकता है
      model: "saaras:v3",
      language_code: languageCode, // सटीकता के लिए सही भाषा कोड दें, जैसे hi-IN, en-IN
      mode, // transcribe/verbatim/translate/translit/codemix — UI में यूज़र चुनता है
    });

    return NextResponse.json({ transcript: response.transcript });
  } catch (error) {
    console.error("Sarvam transcription error:", error);
    const sarvamMessage = extractSarvamErrorMessage(error);
    return NextResponse.json(
      {
        error: sarvamMessage || "Transcription में गड़बड़ी हुई",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
