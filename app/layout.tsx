import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Timekeeping & Leave Management",
  description: "Modern timekeeping and leave management app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen">

        {/* 🌄 BACKGROUND IMAGE */}
        <div
          className="fixed inset-0 bg-cover bg-center scale-110"
          style={{
            backgroundImage: "url('/bg.webp')",
          }}
        />

        {/* 🌫 REAL BLUR LAYER (ITO TALAGA YUNG EFFECT) */}
        <div className="fixed inset-0 backdrop-blur-lg bg-white/30" />

        {/* 📦 CONTENT */}
        <div className="relative z-10">
          {children}
        </div>

      </body>
    </html>
  );
}