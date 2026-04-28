import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ActivitiesClient from "./ActivitiesClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "액티비티·투어 - Pothos",
};

export default function ActivitiesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            현지 액티비티·투어
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            KKday · Klook · GetYourGuide 동시 비교 — 푸드 투어, 입장권, 공항
            픽업, 이심까지.
          </p>
          <ActivitiesClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
