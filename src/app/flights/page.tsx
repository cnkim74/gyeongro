import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FlightsClient from "./FlightsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "항공권 검색 - Pothos",
};

export default function FlightsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            항공권 검색
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Trip.com과 Skyscanner에서 동시에 가격 비교 — 최저가 항공편을 찾아드려요.
          </p>
          <FlightsClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
