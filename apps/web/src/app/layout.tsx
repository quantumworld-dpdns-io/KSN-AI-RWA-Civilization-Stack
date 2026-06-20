import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSN Civilization Console",
  description: "Live operations console for tokenized energy-compute infrastructure"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
