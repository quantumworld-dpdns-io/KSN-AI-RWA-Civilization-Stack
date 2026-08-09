import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KSN Civilization Console",
  description: "Live operations console for tokenized energy-compute infrastructure",
};

export default function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
