import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";
import AccountSettingsForm from "./AccountSettingsForm";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = (await auth()) as any;
  if (!session?.user?.accessToken) {
    redirect("/login");
  }

  // Только подставляем текущую почту для отображения. Сохранение пока не
  // подключено к бэкенду (UI-заготовка).
  let email: string = session.user.email || "";
  try {
    const me = await apiRequest("/users/me/", {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    });
    email = me?.email || email;
  } catch {
    /* оставляем email из сессии */
  }

  return <AccountSettingsForm initialEmail={email} />;
}
