import type { Metadata } from "next";
import { DM_Sans, Krona_One } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const kronaOne = Krona_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-krona-one",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nonprofit County Checker",
  description: "Search IRS public data for nonprofits in any US county",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${kronaOne.variable}`}>
      <body className="font-sans antialiased bg-surface text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
