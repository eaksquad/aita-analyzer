import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AITA Analyzer | AI-Powered Reddit Post Analysis",
  description: "Analyze Am I The Asshole (AITA) Reddit posts with AI to get insights and judgments. Get an AI perspective on moral dilemmas and social situations.",
  keywords: ["AITA", "Reddit", "AI Analysis", "Am I The Asshole", "Moral Judgment", "Social Analysis"],
  authors: [{ name: "AITA Analyzer" }],
  openGraph: {
    title: "AITA Analyzer | AI-Powered Reddit Post Analysis",
    description: "Get AI insights on AITA Reddit posts. Analyze moral dilemmas with advanced AI.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AITA Analyzer | AI-Powered Reddit Post Analysis",
    description: "Get AI insights on AITA Reddit posts. Analyze moral dilemmas with advanced AI.",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
