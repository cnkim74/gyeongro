import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserRole } from "@/lib/admin";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SponsorshipForm from "./SponsorshipForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "홍보 등록 - 경로",
};

export default async function NewSponsorshipPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/sponsor/new");
  const role = await getUserRole(session.user.id);
  if (role !== "business" && role !== "admin") redirect("/sponsor");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">새 홍보 등록</h1>
          <p className="text-gray-500 text-sm mb-6">
            등록한 홍보는 관리자 검토 후 여행자들에게 노출됩니다
          </p>
          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <SponsorshipForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
