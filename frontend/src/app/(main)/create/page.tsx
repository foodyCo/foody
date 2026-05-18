import { NewReviewForm } from "@/components/review/new-review-form";
import { DEFAULT_TWEAKS } from "@/lib/tweaks";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCategories } from "@/app/actions/post";

export default async function CreatePage() {
  const session = (await auth()) as any;
  if (!session?.user?.accessToken) {
    redirect("/login");
  }

  const categories = await getCategories(session.user.accessToken);
  const categoryNames: string[] = (categories || [])
    .map((c: any) => (typeof c === "string" ? c : c?.name))
    .filter(Boolean);

  return <NewReviewForm brand={DEFAULT_TWEAKS.brand} categories={categoryNames} />;
}
