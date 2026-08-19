import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (token && verifySession(token)) {
    redirect("/admin/matrix");
  }
  return (
    <div className="admin flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <LoginForm />
    </div>
  );
}
