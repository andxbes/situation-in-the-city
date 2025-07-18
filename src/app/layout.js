import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/footer";
import Providers from "./providers";
import MatrixBackground from "./components/MatrixBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Situation in the city",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html className="h-full" lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}  antialiased h-full`}>
        <MatrixBackground color='#00FFFF' />
        <Providers>
          <div className="flex flex-col min-h-screen relative z-10">
            <main className="flex grow flex-col h-full gap-[32px] justify-center place-items-center items-center sm:items-start px-4 max-w-full text-center mx-auto">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
