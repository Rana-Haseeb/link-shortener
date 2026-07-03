import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Zap ⚡ — AI Link Shortener",
  description:
    "Shorten any URL into a lightning-fast link with AI summaries, safety checks, click analytics, and stylable QR codes.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="aurora" aria-hidden="true">
          <span />
        </div>
        <div className="grid-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
