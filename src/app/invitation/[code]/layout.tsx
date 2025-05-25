// src/app/invitation/[code]/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rejoindre une organisation - PlanniKeeper",
  description:
    "Acceptez l'invitation et rejoignez une organisation dans PlanniKeeper",
};

export default function InvitationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#f9f3ec] via-[#f5f3ef] to-[#e8ebe0]/50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#beac93]/30 p-8">
        <div className="flex justify-center mb-6">
          <div className="text-3xl font-bold text-[#d9840d]">PlanniKeeper</div>
        </div>
        {children}
      </div>
    </div>
  );
}
