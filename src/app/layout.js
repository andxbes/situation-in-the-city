'use client';

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/footer";
import Providers from "./providers";
import MatrixBackground from "./components/MatrixBackground";
import ParticlesBackground from "./components/ParticlesBackground";
import OilBlobsBackground from "./components/OilBlobsBackground";
import SnowfallBackground from "./components/SnowfallBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadata is now static as this is a client component
// You can move it to a metadata object if needed for SEO, but for this functionality, we need a client component.

export default function RootLayout({ children }) {
  const backgroundOptions = ['matrix', 'particles', 'oil', 'snow'];
  const [background, setBackground] = useState(backgroundOptions[0]);

  // При монтировании компонента на клиенте, проверяем localStorage
  useEffect(() => {
    const savedBackground = localStorage.getItem('background-theme');
    // Убедимся, что сохраненное значение валидно
    if (savedBackground && backgroundOptions.includes(savedBackground)) {
      setBackground(savedBackground);
    }
  }, []); // Пустой массив зависимостей гарантирует, что эффект выполнится один раз

  const toggleBackground = () => {
    const currentIndex = backgroundOptions.indexOf(background);
    const nextIndex = (currentIndex + 1) % backgroundOptions.length;
    const newBackground = backgroundOptions[nextIndex];

    setBackground(newBackground);
    // Сохраняем выбор в localStorage
    localStorage.setItem('background-theme', newBackground);
  };

  return (
    <html className="h-full" lang="en">
      <head>
        <title>Situation in the city</title>
        <meta name="description" content="" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}  antialiased h-full`}>
        <Providers>
          <div className="flex flex-col min-h-screen relative">
            <div onClick={toggleBackground} className="absolute top-0 left-0 w-full h-full cursor-pointer z-0">
              {background === 'matrix' && <MatrixBackground color='#00FFFF' />}
              {background === 'particles' && <ParticlesBackground color='#00FF00' />}
              {background === 'oil' && <OilBlobsBackground />}
              {background === 'snow' && <SnowfallBackground />}
            </div>
            <main className="z-10 px-4 flex grow flex-col h-full gap-[32px] justify-center place-items-center items-center sm:items-start  container w-full text-center mx-auto">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
