import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "आवाज़ से टेक्स्ट — Sarvam",
  description: "Sarvam AI से पॉवर्ड वॉइस-टू-टेक्स्ट डेमो",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <body>{children}</body>
    </html>
  );
}
