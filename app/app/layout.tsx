"use client";

import "./globals.css";
import { Inter, Roboto_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import {
  AptosWalletAdapterProvider,
  useWallet,
} from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { MartianWallet } from "@martianwallet/aptos-wallet-adapter";
import { Toaster } from "@/components/ui/toaster";
import localFont from "next/font/local";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRightIcon,
  PlusCircledIcon,
  PlusIcon,
} from "@radix-ui/react-icons";
import WalletSelector from "@/components/walletSelector";
import StreamRateIndicator from "@/components/StreamRateIndicator";
import { useRouter } from "next/router";

// List of supported wallets to be used by the AptosWalletAdapterProvider below.
//
// NOTE: Each wallet is a plugin that implements the Aptos wallet standard.
const wallets = [new PetraWallet(), new MartianWallet()];

const cal = localFont({
  src: "./cal.woff2",
  display: "swap",
  variable: "--font-cal",
});

const matter = localFont({
  src: [
    {
      path: "./Matter-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Matter-Medium.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Matter-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-matter",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${cal.variable} ${matter.variable} ${inter.className}`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* 
            This is the provider from the Aptos wallet adapter. Anything inside of this provider can 
            use the useWallet hook to access the wallet.
          */}
          <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
            <div className="fixed flex flex-row justify-center items-center px-6 bg-neutral-500 shadow shadow-neutral-300 h-24 lg:h-16 z-30 top-0 left-0 right-0">
              <div className="flex flex-col gap-2 lg:flex-row items-center justify-between max-w-6xl w-full">
                <div className="flex flex-row justify-center gap-6 items-center">
                  <Link
                    href="/"
                    className="flex flex-row space-x-3 items-center"
                  >
                    <Image
                      src="/overmind-icon.svg"
                      alt="Overmind Logo"
                      width={24}
                      height={24}
                    />
                    <p className="font-mono font-light">X</p>
                    <Image
                      src="/aptos-icon.svg"
                      alt="Aptos Logo"
                      width={24}
                      height={24}
                    />
                    <p className="text-xl font-medium font-matter">Payments</p>
                  </Link>
                  <div className="w-px h-6 bg-neutral-300 rounded" />
                  <Link
                    href="/payments"
                    className="bg-neutral-300 font-medium text-white flex flex-row space-x-2 items-center h-9 px-3 rounded text-sm hover:bg-neutral-200 font-matter"
                  >
                    <p>Real-Time Payments</p>
                  </Link>
                </div>
                <div className="flex flex-row justify-center gap-3">
                  <StreamRateIndicator />
                  <WalletSelector />
                </div>
              </div>
            </div>

            <div className="w-full h-16" />

            {children}
            <Toaster />
          </AptosWalletAdapterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
