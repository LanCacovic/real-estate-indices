import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Causaris Bench",
  description: "Raziskovalec slovenskih indeksov cen nepremičnin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="sl">
      <body className={`${ebGaramond.variable} font-sans text-slate-950`}>
        {children}
      </body>
    </html>
  );
}
