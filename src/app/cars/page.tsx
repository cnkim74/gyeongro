import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CarsClient from "./CarsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "렌트카 검색 - Pothos",
};

export default function CarsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            렌트카 검색
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Trip.com · Rentalcars.com · DiscoverCars 동시 비교 — 국제면허증
            안내 포함.
          </p>
          <CarsClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
