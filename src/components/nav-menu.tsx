"use client";
import { useCashRegisterStore } from "@/stores/cash-register";
import Link from "next/link";

export default function Navbar() {
  const { session } = useCashRegisterStore();
  if (!session) return null;

  return (
    <nav className="flex items-center gap-4">
      <Link
        href={`/pos/${session.posName}`}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <span>Ver las ventas realizadas</span>
      </Link>
    </nav>
  );
}
