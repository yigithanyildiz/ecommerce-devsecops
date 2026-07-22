import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  helper?: string;
};

export function StatCard({ title, value, icon: Icon, helper }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(26,26,26,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#444748]">{title}</p>
          <p className="mt-3 text-3xl font-bold text-[#1c1b1b]">{value}</p>
          {helper && <p className="mt-2 text-xs text-[#747878]">{helper}</p>}
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f7f3f2] text-[#1c1b1b]">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}