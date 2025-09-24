import { PosNameSetup } from "@/components/pos-name-setup";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Globe, ShoppingCart, List } from "lucide-react";
import { CashRegisterStatus } from "@/components/cash-register-status";
import "./globals.css";
import { CashRegisterManager } from "@/components/cash-register-manager";
import { CashRegisterProvider } from "@/components/cash-register-provider";
import Image from "next/image";
import Navbar from "@/components/nav-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Food Truck POS",
  description: "Point of Sale system for a Food Truck",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50/90`}
      >
        <CashRegisterProvider>
          <div className="min-h-screen">
            <header className="flex items-center justify-between px-6 border-b bg-white">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <Image
                    src="/dato-logo.png"
                    alt="Logo Dato del Maestro"
                    width={100}
                    height={100}
                  />
                  <h1 className="text-lg font-black text-green-600">
                    Dato del Maestro
                  </h1>
                </Link>
              </div>
              <Navbar />
              <div className="space-x-2">
                <CashRegisterStatus />
                <CashRegisterManager />
              </div>
            </header>
            <main>{children}</main> <PosNameSetup />
          </div>
        </CashRegisterProvider>
      </body>
    </html>
  );
}
