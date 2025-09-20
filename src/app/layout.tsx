import { PosNameSetup } from "@/components/pos-name-setup";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Globe, ShoppingCart, List } from "lucide-react";
import { CashRegisterStatus } from "@/components/cash-register-status";
import "./globals.css";

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
        <div className="min-h-screen">
          <header className="flex items-center justify-between h-16 px-6 border-b bg-white">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Globe />
                <h1 className="text-lg font-semibold">Food Truck POS</h1>
              </Link>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black">
                <ShoppingCart className="h-5 w-5" />
                <span>POS</span>
              </Link>
              <Link href="/sales" className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black">
                <List className="h-5 w-5" />
                <span>Ventas</span>
              </Link>
            </nav>
            <CashRegisterStatus />
          </header>
          <main>{children}</main>
          <PosNameSetup />
        </div>
      </body>
    </html>
  );
}
