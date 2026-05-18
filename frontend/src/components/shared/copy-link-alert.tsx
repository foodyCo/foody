"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const COPY_LINK_ALERT_DURATION_MS = 1800;

type CopyLinkAlertProps = {
  showKey: number;
  className?: string;
};

export function CopyLinkAlert({ showKey, className }: CopyLinkAlertProps) {
  if (showKey <= 0) {
    return null;
  }

  return (
    <motion.div
      key={showKey}
      className={cn(
        "pointer-events-none fixed right-4 bottom-[6.25rem] left-4 z-[100]",
        className
      )}
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.98, 1, 1, 0.98],
        y: [14, 0, 0, 10],
      }}
      transition={{
        duration: COPY_LINK_ALERT_DURATION_MS / 1000,
        ease: [0.22, 1, 0.36, 1],
        times: [0, 0.12, 0.84, 1],
      }}
    >
      <Alert className="mx-auto max-w-[23rem] rounded-[18px] border border-white/70 bg-white/86 px-4 py-3 text-[#15291C] shadow-[0_12px_24px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.8)] backdrop-blur-[20px]">
        <CheckCircle2
          className="size-4.5 text-[#1B7F45]"
          strokeWidth={2.35}
        />
        <p className="text-[13px] leading-tight font-extrabold tracking-[0px]">
          Ссылка скопирована успешно
        </p>
      </Alert>
    </motion.div>
  );
}
