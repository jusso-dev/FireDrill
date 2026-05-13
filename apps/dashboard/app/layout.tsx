import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SideNav } from "@/components/nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FireDrill",
  description: "Self-hosted SRE incident simulation lab",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable} dark`}
    >
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen">
          <SideNav />
          <main className="flex-1 px-6 lg:px-10 py-8 mx-auto w-full max-w-[1400px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
