import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "आवाज़ से टेक्स्ट — Sarvam",
  description: "Sarvam AI से पॉवर्ड वॉइस-टू-टेक्स्ट डेमो",
};

// पेज पेंट होने से पहले सेव की हुई थीम लागू करने के लिए —
// इससे dark mode में पहले हल्का-सा light theme "flash" नहीं दिखता।
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="hi">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
