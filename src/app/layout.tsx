import type { Metadata } from "next";
import { Crimson_Pro, Playfair_Display } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";
import Snowflakes from "@/components/Snowflakes";
import IllusionProvider from "@/components/IllusionProvider";

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KIKI Christmas Event 2025",
  description: "Join us for the KIKI Christmas Event - an unforgettable celebration!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${crimsonPro.variable} ${playfair.variable} antialiased`}
      >
        <SessionProvider>
          <IllusionProvider>
            <Snowflakes />
            <Navbar />
            <main className="relative z-10 min-h-[calc(100vh-4rem)]">
              {children}
            </main>
          </IllusionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
