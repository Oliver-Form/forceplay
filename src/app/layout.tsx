import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Roboto } from 'next/font/google';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "ForcePlay",
  description: "A simple, interactive physics sandbox to visualise mechanics problems.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={roboto.variable}>
      <body
        className="font-roboto bg-[#1E1E2F] text-white"
      >
        <div id="modal-root"></div>
        {children}
      </body>
    </html>
  );
}
