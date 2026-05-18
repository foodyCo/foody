import { BackgroundBlobs } from "@/components/feed/background-blobs";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundBlobs palette={DEFAULT_TWEAKS.palette} />
      {children}
    </>
  );
}
