import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token && verifySession(token)) {
    redirect("/admin/projects");
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <LoginForm />
    </div>
  );
}
