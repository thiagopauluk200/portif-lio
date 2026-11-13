import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/auth-server";
import { isAuthConfigured } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await hasAdminSession()) redirect("/admin");
  return <LoginForm configured={isAuthConfigured()} />;
}
