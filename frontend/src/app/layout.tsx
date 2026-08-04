import type { Metadata, Viewport } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-roboto",
  display: "swap",
});

// CSP с nonce работает только при рендере per-request: статические страницы
// генерятся при сборке без nonce, и их инлайн-скрипты Next блокируются политикой
// (ломается гидрация — форма логина/регистрации уходит нативным сабмитом).
// Форсируем динамический рендер всего приложения, чтобы nonce был на всех страницах.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Foody",
  description: "Делитесь впечатлениями о блюдах и открывайте новые рестораны вместе с друзьями",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning className={`${inter.variable} ${roboto.variable}`}>
      <body
        className={cn(
          "relative mx-auto h-dvh w-full overflow-hidden font-sans antialiased",
          // нейтральный цвет «полей» по бокам рамки на десктопе
          "bg-[#E7E9E7]",
          // рамка «телефона» на планшете; на десктопе (lg) — во всю ширину (под сайдбар)
          "md:max-w-[480px] md:shadow-[0_0_40px_rgba(0,0,0,0.12)] lg:max-w-none lg:shadow-none",
          // создаёт containing block для fixed-модалок (портал в body) → держит их в рамке
          "transform-gpu",
        )}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
