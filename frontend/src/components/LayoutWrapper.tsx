"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPostPage = pathname?.startsWith("/dish/");
  const isCreatePage = pathname === "/create";

  return (
    <>
      <div className="ambient-bg" />
      <Header />
      <main className="app-container" style={{ paddingBottom: (isPostPage || isCreatePage) ? "0" : "calc(var(--nav-height) + var(--safe-bottom))", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
