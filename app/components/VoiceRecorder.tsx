"use client";

import { useEffect, useRef, useState } from "react";

function CopyIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function DoubleCheckIcon() {
  return (
    <svg
      width="16"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 7 17l-5-5" />
      <path d="M22 6 11 17" />
    </svg>
  );
}

type LanguageCode =
  | "hi-IN"
  | "en-IN"
  | "ta-IN"
  | "te-IN"
  | "mr-IN"
  | "gu-IN"
  | "bn-IN"
  | "kn-IN";

interface Language {
  code: LanguageCode;
  label: string;
}

const LANGUAGES: Language[] = [
  { code: "hi-IN", label: "हिंदी" },
  { code: "en-IN", label: "English (India)" },
  { code: "ta-IN", label: "தமிழ்" },
  { code: "te-IN", label: "తెలుగు" },
  { code: "mr-IN", label: "मराठी" },
  { code: "gu-IN", label: "ગુજરાતી" },
  { code: "bn-IN", label: "বাংলা" },
  { code: "kn-IN", label: "ಕನ್ನಡ" },
];

interface TranscribeResponse {
  transcript?: string;
  error?: string;
}

// Sarvam की रियल-टाइम REST API सिर्फ़ 30 सेकंड तक की ऑडियो लेती है, इसलिए हर
// रिकॉर्डिंग को अपने आप छोटे-छोटे हिस्सों में तोड़कर, बिना रुके, भेजते रहते हैं।
const CHUNK_DURATION_MS = 25_000;

// कॉपी बटन पर सही का निशान इतनी देर दिखेगा, फिर अपने आप पहले जैसा हो जाएगा
const COPIED_RESET_MS = 2_000;

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [languageCode, setLanguageCode] = useState<LanguageCode>("hi-IN");
  const [copied, setCopied] = useState(false);

  const isProcessing = pendingCount > 0;

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldContinueRef = useRef(false);
  const chunkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  function beginChunk(stream: MediaStream) {
    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      if (audioBlob.size > 0) {
        void sendForTranscription(audioBlob);
      }

      if (shouldContinueRef.current && streamRef.current) {
        // अभी भी बोल रहे हैं — अगला हिस्सा तुरंत शुरू करें
        beginChunk(streamRef.current);
      } else {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
      }
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();

    if (chunkTimeoutRef.current) clearTimeout(chunkTimeoutRef.current);
    chunkTimeoutRef.current = setTimeout(() => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
    }, CHUNK_DURATION_MS);
  }

  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // मोनो — Sarvam के लिए सबसे बेहतर accuracy
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      streamRef.current = stream;
      shouldContinueRef.current = true;
      setIsRecording(true);
      beginChunk(stream);
    } catch (err) {
      setError("माइक्रोफ़ोन एक्सेस नहीं मिला। ब्राउज़र permission चेक करें।");
      console.error(err);
    }
  }

  function stopRecording() {
    if (!isRecording) return;
    shouldContinueRef.current = false;
    if (chunkTimeoutRef.current) {
      clearTimeout(chunkTimeoutRef.current);
      chunkTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function sendForTranscription(audioBlob: Blob) {
    setPendingCount((c) => c + 1);
    setError("");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language_code", languageCode);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data: TranscribeResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "अज्ञात एरर");
      }

      // नया टेक्स्ट पहले से मौजूद टेक्स्ट के आगे जोड़ें (लगातार डिक्टेशन के लिए)
      setTranscript((prev) => (prev ? prev + " " + data.transcript : data.transcript ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription में गड़बड़ी हुई");
      console.error(err);
    } finally {
      setPendingCount((c) => c - 1);
    }
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    } catch (err) {
      console.error(err);
    }
  }

  function clearTranscript() {
    setTranscript("");
  }

  return (
    <div className="recorder-card">
      <div className="controls-row">
        <select
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value as LanguageCode)}
          disabled={isRecording || isProcessing}
          className="lang-select"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing && !isRecording}
          className={`mic-button ${isRecording ? "recording" : ""}`}
        >
          <span className="mic-dot" />
          {isRecording ? "रोकें और भेजें" : isProcessing ? "प्रोसेस हो रहा है..." : "बोलना शुरू करें"}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <textarea
        className="transcript-box"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="यहाँ आपकी बोली गई बात टेक्स्ट में दिखेगी..."
        rows={10}
      />

      <div className="actions-row">
        <button
          onClick={copyToClipboard}
          disabled={!transcript}
          className={`secondary-btn ${copied ? "copied" : ""}`}
        >
          {copied ? <DoubleCheckIcon /> : <CopyIcon />}
          {copied ? "कॉपी हो गया" : "कॉपी करें"}
        </button>
        <button onClick={clearTranscript} disabled={!transcript} className="secondary-btn">
          साफ़ करें
        </button>
      </div>
    </div>
  );
}
