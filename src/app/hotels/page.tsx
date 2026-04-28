import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HotelsClient from "./HotelsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "호텔 검색 - Pothos",
};

export default function HotelsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            호텔 검색
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Trip.com · Booking.com · Agoda 동시 비교 — 같은 날짜·도시 최저가를 한 번에.
          </p>
          <HotelsClient />
        </div>
      </main>
      <Footer />
    </div>
  );
}
