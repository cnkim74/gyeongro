import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TravelEssentials from "@/components/TravelEssentials";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "여행 준비물 - 경로",
};

export default function PreparationsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mb-4 shadow-lg">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">여행 준비물</h1>
            <p className="text-gray-500">
              놓치기 쉬운 필수 아이템을 한 번에 준비하세요
            </p>
          </div>
          <TravelEssentials />
        </div>
      </main>
      <Footer />
    </div>
  );
}
