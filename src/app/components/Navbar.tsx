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
    <nav className="w-full bg-background border-b border-border px-4 py-2 flex justify-between items-center relative z-50">
      <Link
        href="/dashboard"
        className={`text-4xl font-bold ${vt323.className} text-primary-foreground`}
      >
        PlanniKeeper
      </Link>
      <div>
        <Switch />
      </div>
    </nav>
  );
}
