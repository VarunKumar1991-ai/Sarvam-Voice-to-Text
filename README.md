# 🎙️ Sarvam Voice-to-Text

Next.js (App Router) + TypeScript + Sarvam AI (Saaras v3) पर आधारित एक **स्वतंत्र** वॉइस-टू-टेक्स्ट
वेब एप्लिकेशन। ब्राउज़र से माइक रिकॉर्ड होता है, और सर्वर साइड API route से
सुरक्षित रूप से Sarvam को भेजा जाता है, जहाँ से टेक्स्ट ट्रांसक्रिप्ट वापस आता है।

यह एक स्टैंडअलोन प्रोजेक्ट है — किसी अन्य प्रोजेक्ट पर निर्भर नहीं है।

अधिक जानकारी के लिए देखें:
- [architecture.md](./architecture.md) — तकनीकी आर्किटेक्चर और डेटा फ़्लो
- [product.md](./product.md) — प्रोडक्ट विज़न, यूज़र और रोडमैप

---

## 📁 फ़ाइल संरचना

```
Sarvam-Voice-to-Text/
├── app/
│   ├── api/
│   │   └── transcribe/
│   │       └── route.ts       # सर्वर साइड: Sarvam को कॉल करता है (key यहीं रहती है)
│   ├── components/
│   │   └── VoiceRecorder.tsx  # क्लाइंट: माइक रिकॉर्ड करता है, UI दिखाता है
│   ├── globals.css            # स्टाइलिंग
│   ├── layout.tsx             # रूट लेआउट
│   └── page.tsx               # होमपेज
├── .env.local.example         # API key का सैंपल
├── .gitignore
├── next.config.js
├── next-env.d.ts
├── tsconfig.json
├── package.json
├── architecture.md
├── product.md
└── README.md
```

## 🔑 क्यों दो हिस्सों में बँटा है (सुरक्षा की वजह)

- **`app/api/transcribe/route.ts` (सर्वर)** — यहीं `SARVAM_API_KEY` इस्तेमाल
  होती है। यह कोड कभी भी ब्राउज़र में नहीं भेजा जाता, इसलिए key सुरक्षित रहती है।
- **`app/components/VoiceRecorder.tsx` (क्लाइंट, `"use client"`)** — यह सिर्फ़
  माइक से रिकॉर्ड करके ऑडियो को अपने ही सर्वर के `/api/transcribe` पर भेजता
  है। इसमें API key कहीं नहीं है।

> ⚠️ **कभी भी** `SarvamAIClient` को किसी `"use client"` फ़ाइल में सीधे
> इस्तेमाल न करें — इससे आपकी API key ब्राउज़र में दिखने लगेगी।

---

## 1️⃣ सेटअप

```bash
git clone <this-repo-url> sarvam-voice-to-text
cd sarvam-voice-to-text
npm install
```

`.env.local.example` को `.env.local` नाम से कॉपी करें और अपनी key भरें:

```bash
cp .env.local.example .env.local
```

```
SARVAM_API_KEY=आपकी_असली_key_यहाँ
```

Sarvam API key [dashboard.sarvam.ai](https://dashboard.sarvam.ai) से मिलती है।

---

## 2️⃣ चलाना

```bash
npm run dev
```

फिर ब्राउज़र में **http://localhost:3000** खोलें।

> **नोट:** माइक्रोफ़ोन एक्सेस के लिए ब्राउज़र को **HTTPS या localhost**
> चाहिए — `localhost` पर सामान्य रूप से चलता है, कोई एक्स्ट्रा सेटअप नहीं चाहिए।

---

## 3️⃣ 100% सही टाइपिंग के लिए ज़रूरी टिप्स

| समस्या | समाधान |
|---|---|
| गलत भाषा में शब्द आना | UI में सही भाषा चुनें (हिंदी बोल रहे हैं तो "हिंदी" चुनें) |
| पीछे का शोर टेक्स्ट बिगाड़ रहा है | शांत जगह पर बोलें — कोड में पहले से `noiseSuppression: true` सेट है |
| बोलचाल के शब्द टेक्स्ट में आना | `route.ts` में `mode: "transcribe"` रखें (साफ़ आउटपुट) |
| शब्द-दर-शब्द (हर हिचकिचाहट सहित) चाहिए | `route.ts` में `mode: "verbatim"` कर दें |
| हिंग्लिश/कोड-मिक्स भाषा | `mode: "codemix"` इस्तेमाल करें |
| लंबी रिकॉर्डिंग (मिनटों में) चाहिए | अभी का सेटअप छोटी क्लिप्स के लिए है; लंबी फ़ाइलों के लिए Sarvam की Batch API इस्तेमाल करें |

**टेक्स्ट एडिट करने की सुविधा:** ट्रांसक्रिप्ट बॉक्स editable है — अगर
मॉडल कोई शब्द गलत पहचाने, तो आप वहीं टाइप करके ठीक कर सकते हैं, ठीक वैसे
जैसे Google Docs Voice Typing में होता है।

---

## 4️⃣ आगे क्या जोड़ा जा सकता है

- **ट्रांसक्रिप्ट सेव करना:** `sendForTranscription` के बाद transcript को
  किसी database (जैसे Supabase, MongoDB, Postgres) में सेव करने का कॉल जोड़ें
- **स्पीकर पहचान (कौन बोला)?** Sarvam की diarization सुविधा इस्तेमाल करें
  ताकि मल्टी-स्पीकर रिकॉर्डिंग में हर बोलने वाले को अलग किया जा सके
- **लंबी रिकॉर्डिंग/मीटिंग रिकॉर्ड करनी है?** Streaming API से लगातार लाइव
  ट्रांसक्रिप्शन दिखा सकते हैं, हर कुछ सेकंड में टेक्स्ट अपडेट होता रहेगा
- **डेटा सुरक्षा:** भेजे जाने वाला ऑडियो संवेदनशील हो सकता है — भेजने से
  पहले Sarvam की data-retention नीति एक बार डॉक्स में ज़रूर पढ़ लें

अधिक विवरण के लिए [architecture.md](./architecture.md) और
[product.md](./product.md) देखें।
