import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Header from "@/components/Header";
import PartnerForm from "./PartnerForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "동료 모집 - 경로",
};

export default async function NewPartnerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/partners/new");

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            여행 동료 모집
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            함께 떠날 사람을 찾는 글을 작성해주세요
          </p>
          <div className="bg-white rounded-3xl border border-slate-100 p-8">
            <PartnerForm />
          </div>
        </div>
      </main>
    </div>
  );
}
