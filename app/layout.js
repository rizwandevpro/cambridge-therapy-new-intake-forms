// Fonts are self-hosted (same Lora + Source Sans 3 pairing as the existing
// forms app, but without a request to Google from a patient's browser).
import "@fontsource/lora/600.css";
import "@fontsource/lora/500-italic.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "./globals.css";

export const metadata = {
  title: "Therapy New Client Intake | Cambridge Psychiatry",
  description: "New client intake forms for therapy at Cambridge Psychiatry and Behavioral Institute.",
  robots: { index: false, follow: false },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#1e3a5f" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
