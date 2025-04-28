"use client";

import Link from "next/link";
import { VT323 } from "next/font/google";
import Switch from "@/app/components/ui/switchmode";

const vt323 = VT323({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-vt323",
});

export default function Navbar() {
  return (
    <nav
      className="w-full border-b px-4 py-2 flex justify-between items-center relative z-50"
      style={{
        background: "var(--background)",
        borderColor: "var(--border)",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <Link
        href="/dashboard"
        className={`text-4xl font-bold text-[color:var(--foreground)] ${vt323.className}`}
        style={{
          transition: "color 0.3s",
        }}
      >
        PlanniKeeper
      </Link>
      <div>
        <Switch />
      </div>
    </nav>
  );
}
