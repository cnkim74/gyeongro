import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import Header from "@/components/Header";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();
  if (!session) redirect("/");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-1 pt-16">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
