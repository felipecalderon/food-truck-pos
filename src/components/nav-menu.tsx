"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [posName, setPosName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const localPos = localStorage.getItem("pos_name");
      setPosName(localPos);
    }
  }, []);
  if (!posName) return null;

  return (
    <nav className="flex items-center gap-4">
      <Link
        href={`/pos/${posName}`}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
      >
        <span>Ver las ventas realizadas</span>
      </Link>
    </nav>
  );
}
