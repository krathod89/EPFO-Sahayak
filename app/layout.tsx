import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font (not a hand-rolled <link>/@import) — this repo's own
// carried-forward lesson is to prefer framework-native font loading so what's declared
// in CSS is guaranteed to be what actually renders.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "EPFO Sahayak",
  description: "Decode your EPFO PF claim rejection and know what to do next.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
