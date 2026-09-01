import { IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

// Self-hosted via next/font (not a hand-rolled <link>/@import) — this repo's own
// carried-forward lesson is to prefer framework-native font loading so what's declared
// in CSS is guaranteed to be what actually renders.
//
// IBM Plex Sans + Source Serif 4 replace Fraunces + Inter (design review, 2026-09-01):
// same roles (a workhorse sans for body/UI, a serif for the one display accent), but a
// pairing that isn't the default a model reaches for.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata = {
  title: "EPFO Sahayak",
  description: "Decode your EPFO PF claim rejection and know what to do next.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${sourceSerif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
