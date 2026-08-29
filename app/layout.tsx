export const metadata = {
  title: "EPFO Sahayak",
  description: "Decode your EPFO PF claim rejection and know what to do next.",
};

// Placeholder root layout. The product owner is designing the real UI separately —
// this exists only so Next.js has a valid App Router root for the API routes to sit under.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
