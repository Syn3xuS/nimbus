import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Header from "@/shared/ui/header/Header";
import Main from "@/shared/ui/main/Main";
import Footer from "@/shared/ui/footer/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nimbus | Cloud",
  description: "Nimbus - быстрое облако на коленке",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="page_background"></div>

      <html lang="ru">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased `}
        >
          <Header />
          <Main>{children}</Main>
          <Footer />
        </body>
      </html>
    </>
  );
}
