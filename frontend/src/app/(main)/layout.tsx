import { BackgroundBlobs } from "@/components/feed/background-blobs";
import { BottomTabBar } from "@/components/feed/bottom-tab-bar";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BackgroundBlobs palette={DEFAULT_TWEAKS.palette} />
      {children}
      <BottomTabBar brand={DEFAULT_TWEAKS.brand} />
    </>
  );
}
