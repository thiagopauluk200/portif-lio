import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/auth-server";
import { getContent, getSettings, listMessages } from "@/lib/store";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Defesa em profundidade: o middleware já bloqueia, mas validamos de novo no servidor.
  if (!(await hasAdminSession())) redirect("/admin/login");

  const [content, messages, settings] = await Promise.all([getContent(), listMessages(), getSettings()]);
  return (
    <AdminDashboard
      initialSettings={{ avatar: settings.avatar, status: content.profile.status! }}
      initialProjects={content.projects}
      initialExperiences={content.experiences}
      initialMessages={messages}
    />
  );
}
