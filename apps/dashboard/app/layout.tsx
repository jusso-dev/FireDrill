import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Saira_Stencil_One } from "next/font/google";
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
const stencil = Saira_Stencil_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-stencil",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FireDrill — Station Control",
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
      className={`${inter.variable} ${mono.variable} ${stencil.variable} dark`}
    >
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          <SideNav />
          <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1480px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
