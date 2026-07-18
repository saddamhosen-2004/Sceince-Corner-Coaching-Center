import type { Metadata } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";

const hindSiliguri = Hind_Siliguri({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["bengali", "latin"],
  variable: "--font-hind-siliguri",
  display: "swap",
});

export const metadata: Metadata = {
  title: "বিজ্ঞান কলেজ কোচিং সেন্টার | ম্যানেজমেন্ট সিস্টেম",
  description: "এইচএসসি বিজ্ঞান বিভাগের শিক্ষার্থীদের জন্য বিশেষায়িত কোচিং সেন্টারের সম্পূর্ণ ম্যানেজমেন্ট সিস্টেম ও ওয়েবসাইট।",
};

import DynamicFavicon from "@/lib/DynamicFavicon";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" className={`${hindSiliguri.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans">
        <DynamicFavicon />
        {children}
      </body>
    </html>
  );
}

