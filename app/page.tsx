import VoiceRecorder from "./components/VoiceRecorder";

export default function Home() {
  return (
    <main className="page-wrap">
      <header className="page-header">
        <p className="eyebrow">Sarvam Saaras v3</p>
        <h1>आवाज़ से टेक्स्ट</h1>
        <p className="subtitle">
          माइक्रोफ़ोन पर बोलिए, Sarvam AI इसे तुरंत टेक्स्ट में बदल देगा।
        </p>
      </header>

      <VoiceRecorder />
    </main>
  );
}
