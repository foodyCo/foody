"use client";

import { useState } from "react";
import { signOutAction } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Globe,
  LogOut,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { deleteAccount } from "@/app/actions/settings";
import { GlassSurface } from "@/components/feed/glass-surface";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SettingsFormProps = {
  user: any;
};

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-2 text-[11px] font-bold tracking-[0.18em] text-[#8A958E] uppercase">
        {label}
      </p>
      <GlassSurface className="rounded-[22px] border border-white/65 bg-white/50 overflow-hidden shadow-[0_8px_24px_rgba(20,40,28,0.10),0_2px_6px_rgba(20,40,28,0.06)]">
        <div className="divide-y divide-white/40">{children}</div>
      </GlassSurface>
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  value,
  onClick,
  danger,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  value?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Wrap = onClick ? "button" : "div";
  return (
    <Wrap
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left",
        onClick && "cursor-pointer hover:bg-white/35",
      )}
    >
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl border border-white/70 bg-white/60 backdrop-blur-[12px]",
          danger && "border-red-300/60 bg-red-50/60 text-red-600",
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-[15px] font-semibold text-[#15291C]",
            danger && "text-red-700",
          )}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-[12.5px] font-medium text-[#5C6B62]">{subtitle}</p>
        )}
      </div>
      {value !== undefined && (
        <span className="text-[13.5px] font-semibold text-[#5C6B62]">{value}</span>
      )}
      {onClick && !danger && (
        <ChevronRight className="size-4 text-[#8A958E]" strokeWidth={2.2} />
      )}
    </Wrap>
  );
}

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDeleteAccount() {
    // deleteAccount server action делает signOut+redirect внутри себя.
    await deleteAccount();
  }

  return (
    <main className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 flex flex-col pt-2">
        <header className="mb-2 flex items-center gap-3 px-5">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Назад"
            className="grid size-9 place-items-center rounded-full border border-white/65 bg-white/58 text-[#15291C] shadow-[0_8px_20px_rgba(20,40,28,0.14),inset_1px_1px_0_rgba(255,255,255,0.86)] backdrop-blur-[18px]"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={2.35} />
          </button>
          <h1 className="text-[22px] font-extrabold tracking-[-0.3px] text-[#15291C]">
            Настройки
          </h1>
        </header>

        <div className="hide-scroll flex-1 overflow-y-auto px-4 pb-25 pt-3">
          <div className="space-y-5">
            <Section label="Аккаунт">
              <Row
                icon={<UserIcon className="size-5 text-[#15291C]" strokeWidth={2} />}
                title="Личные данные"
                subtitle="Почта, пароль"
                onClick={() => router.push("/settings/account")}
              />
            </Section>

            <Section label="Приложение">
              <Row
                icon={<Globe className="size-5 text-[#15291C]" strokeWidth={2} />}
                title="Мой город"
                value={user?.city || "—"}
                onClick={() => router.push("/me/edit")}
              />
            </Section>

            <Section label="Опасная зона">
              <Row
                icon={<LogOut className="size-5 text-red-600" strokeWidth={2} />}
                title="Выйти из аккаунта"
                danger
                onClick={() => signOutAction()}
              />
              <Row
                icon={<Trash2 className="size-5 text-red-600" strokeWidth={2} />}
                title="Удалить аккаунт"
                danger
                onClick={() => setDeleteOpen(true)}
              />
            </Section>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить аккаунт?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Все ваши посты, лайки и подписки будут
              удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
