"use client";

import { useState } from "react";
import { AlertTriangle, Clock, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ModerationBannerProps = {
  status: "pending" | "rejected";
  rejectionReason?: string | null;
};

/**
 * Плашка статуса модерации над постом. Сдвинута ниже шапки, чтобы не
 * перекрывать кнопку «Назад», и её можно закрыть крестиком.
 */
export function ModerationBanner({ status, rejectionReason }: ModerationBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const isPending = status === "pending";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-14 z-30 px-3">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-[640px] items-start gap-2.5 rounded-2xl border px-3.5 py-2.5 text-[12.5px] font-semibold backdrop-blur-[12px]",
          isPending
            ? "border-amber-200/80 bg-amber-50/95 text-amber-900 shadow-[0_8px_20px_rgba(160,110,20,0.18)]"
            : "border-red-200/80 bg-red-50/95 text-red-900 shadow-[0_8px_20px_rgba(180,40,40,0.18)]"
        )}
      >
        {isPending ? (
          <Clock className="mt-px size-4 shrink-0" strokeWidth={2.3} />
        ) : (
          <AlertTriangle className="mt-px size-4 shrink-0" strokeWidth={2.3} />
        )}

        <div className="min-w-0 flex-1 leading-snug">
          {isPending ? (
            <>
              <div className="font-bold">Пост на модерации</div>
              <div className="font-medium text-amber-800/85">
                Виден только вам. После одобрения модератором появится в общей ленте.
              </div>
            </>
          ) : (
            <>
              <div className="font-bold">Пост отклонён модератором</div>
              {rejectionReason ? (
                <div className="font-medium text-red-800/85">
                  Причина: {rejectionReason}
                </div>
              ) : (
                <div className="font-medium text-red-800/70">Причина не указана.</div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => setDismissed(true)}
          className={cn(
            "grid size-6 shrink-0 place-items-center rounded-full transition-colors",
            isPending
              ? "bg-amber-100/70 text-amber-900 hover:bg-amber-200/70"
              : "bg-red-100/70 text-red-900 hover:bg-red-200/70"
          )}
        >
          <X className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
