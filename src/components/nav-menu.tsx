"use client";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center gap-4">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <span>POS</span>
      </Link>
      <Link
        href="/sales"
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <span>Ventas</span>
      </Link>
    </nav>
  );
}
