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

function ChevronDownIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 15V3" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="spinner-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
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

type Mode = "transcribe" | "verbatim" | "translate" | "translit" | "codemix";

interface ModeOption {
  code: Mode;
  label: string;
  description: string;
}

const MODES: ModeOption[] = [
  {
    code: "transcribe",
    label: "मानक (Transcribe)",
    description:
      "साफ़, सामान्य लिखित रूप — नंबर अंकों में, सही formatting के साथ। रोज़मर्रा के इस्तेमाल के लिए सबसे बेहतर। उदाहरण: \"मेरा फोन नंबर है 9840950950\"",
  },
  {
    code: "verbatim",
    label: "शब्द-दर-शब्द (Verbatim)",
    description:
      "बिल्कुल वैसा ही जैसा बोला गया — हिचकिचाहट के शब्द भी, नंबर भी शब्दों में। उदाहरण: \"मेरा फोन नंबर है नौ आठ चार zero नौ पांच zero नौ पांच zero\"",
  },
  {
    code: "translate",
    label: "अनुवाद (Translate)",
    description:
      "भारतीय भाषा में बोली गई बात सीधे अंग्रेज़ी में। उदाहरण: \"My phone number is 9840950950\"",
  },
  {
    code: "translit",
    label: "लिप्यंतरण (Translit)",
    description:
      "भाषा वही रहती है, बस लिखावट रोमन/Latin script में हो जाती है। उदाहरण: \"mera phone number hai 9840950950\"",
  },
  {
    code: "codemix",
    label: "हिंग्लिश (Codemix)",
    description:
      "अंग्रेज़ी शब्द अंग्रेज़ी में और हिंदी शब्द देवनागरी में — जैसे लोग असल में हिंग्लिश में टाइप करते हैं। उदाहरण: \"मेरा phone number है 9840950950\"",
  },
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

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [languageCode, setLanguageCode] = useState<LanguageCode>("hi-IN");
  const [mode, setMode] = useState<Mode>("transcribe");
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<Mode | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);

  const isProcessing = pendingCount > 0;
  const selectedMode = MODES.find((m) => m.code === mode) ?? MODES[0];

  const trimmedTranscript = transcript.trim();
  const wordCount = trimmedTranscript ? trimmedTranscript.split(/\s+/).length : 0;
  const charCountWithSpaces = transcript.length;
  const charCountWithoutSpaces = transcript.replace(/\s/g, "").length;

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldContinueRef = useRef(false);
  const chunkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  // dropdown के बाहर क्लिक या Escape दबाने पर मोड-मेनू बंद कर दें
  useEffect(() => {
    if (!modeMenuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!modeDropdownRef.current?.contains(event.target as Node)) {
        setModeMenuOpen(false);
        setHoveredMode(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModeMenuOpen(false);
        setHoveredMode(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [modeMenuOpen]);

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
      formData.append("mode", mode);

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

  function downloadTxt() {
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    triggerDownload(blob, "transcript.txt");
  }

  async function downloadDocx() {
    setIsExportingDocx(true);
    setError("");
    try {
      const { Document, Packer, Paragraph, TextRun } = await import("docx");
      const doc = new Document({
        sections: [
          {
            children: transcript
              .split("\n")
              .map((line) => new Paragraph({ children: [new TextRun(line)] })),
          },
        ],
      });
      const blob = await Packer.toBlob(doc);
      triggerDownload(blob, "transcript.docx");
    } catch (err) {
      setError("Word फ़ाइल बनाने में गड़बड़ी हुई");
      console.error(err);
    } finally {
      setIsExportingDocx(false);
    }
  }

  function downloadPdf() {
    // ब्राउज़र का print डायलॉग खोलता है — "Save as PDF" चुनकर PDF बना सकते हैं।
    // हर भारतीय भाषा की लिपि सही दिखे इसके लिए यह ब्राउज़र की अपनी text-rendering
    // इस्तेमाल करता है (कोई font embed नहीं करना पड़ता, जो client-side PDF
    // लाइब्रेरी से हल्का और सटीक दोनों है)।
    window.print();
  }

  const controlsDisabled = isRecording || isProcessing;

  return (
    <div className="recorder-card">
      <div className="controls-row">
        <select
          value={languageCode}
          onChange={(e) => setLanguageCode(e.target.value as LanguageCode)}
          disabled={controlsDisabled}
          className="lang-select"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        <div className="mode-dropdown" ref={modeDropdownRef}>
          <button
            type="button"
            className="mode-trigger"
            disabled={controlsDisabled}
            aria-haspopup="listbox"
            aria-expanded={modeMenuOpen}
            onClick={() => setModeMenuOpen((open) => !open)}
          >
            {selectedMode.label}
            <ChevronDownIcon />
          </button>

          {modeMenuOpen && (
            <ul className="mode-menu" role="listbox">
              {MODES.map((option) => (
                <li key={option.code} className="mode-menu-item">
                  <button
                    type="button"
                    role="option"
                    aria-selected={mode === option.code}
                    className={`mode-option-btn ${mode === option.code ? "selected" : ""}`}
                    onClick={() => {
                      setMode(option.code);
                      setModeMenuOpen(false);
                      setHoveredMode(null);
                    }}
                  >
                    <span
                      className="mode-help-icon"
                      onMouseEnter={() => setHoveredMode(option.code)}
                      onMouseLeave={() => setHoveredMode(null)}
                      aria-hidden="true"
                    >
                      ?
                    </span>
                    {option.label}
                  </button>
                  {hoveredMode === option.code && (
                    <p className="mode-tooltip" role="tooltip">
                      {option.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing && !isRecording}
          className={`mic-button ${isRecording ? "recording" : ""}`}
        >
          <span className="mic-dot" />
          {isRecording ? "रोकें और भेजें" : isProcessing ? "प्रोसेस हो रहा है..." : "बोलना शुरू करें"}
        </button>
      </div>

      {isProcessing && (
        <p className="chunk-status">
          <SpinnerIcon />
          {isRecording
            ? "बोलते रहिए — पिछला हिस्सा background में transcribe हो रहा है..."
            : "आख़िरी हिस्सा transcribe हो रहा है..."}
        </p>
      )}

      {error && <p className="error-text">{error}</p>}

      <textarea
        className="transcript-box"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="यहाँ आपकी बोली गई बात टेक्स्ट में दिखेगी..."
        rows={10}
      />

      {transcript && (
        <div className="stats-row">
          <span>शब्द: {wordCount}</span>
          <span>अक्षर (space सहित): {charCountWithSpaces}</span>
          <span>अक्षर (space रहित): {charCountWithoutSpaces}</span>
        </div>
      )}

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
        <button onClick={downloadTxt} disabled={!transcript} className="secondary-btn">
          <DownloadIcon />
          .txt
        </button>
        <button
          onClick={downloadDocx}
          disabled={!transcript || isExportingDocx}
          className="secondary-btn"
        >
          {isExportingDocx ? <SpinnerIcon /> : <DownloadIcon />}
          .docx
        </button>
        <button
          onClick={downloadPdf}
          disabled={!transcript}
          className="secondary-btn"
          title="ब्राउज़र का प्रिंट डायलॉग खुलेगा — वहाँ 'Save as PDF' चुनें"
        >
          <DownloadIcon />
          .pdf
        </button>
      </div>

      {/* सिर्फ़ प्रिंट/PDF के लिए — सामान्य स्क्रीन पर छिपा रहता है */}
      <div className="print-only">
        <h1>आवाज़ से टेक्स्ट — Transcript</h1>
        <div className="print-transcript">{transcript}</div>
      </div>
    </div>
  );
}
