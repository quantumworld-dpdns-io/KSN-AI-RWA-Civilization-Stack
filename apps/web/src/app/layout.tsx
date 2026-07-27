import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSN Civilization Console",
  description: "Live operations console for tokenized energy-compute infrastructure",
  icons: { icon: "/icon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
