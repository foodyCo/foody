import type { ReactNode } from "react";

type SectionHeaderProps = {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
};

export function SectionHeader({ icon, title, action }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-[7px]">
        <span className="inline-flex text-[#3A4A40]">{icon}</span>
        <span className="text-[17px] font-bold tracking-[-0.2px] text-[#15291C]">
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}
