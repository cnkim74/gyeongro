import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PlannerClient from "./PlannerClient";

export const metadata = {
  title: "AI 여행 플래너 - Pothos",
};

export default function PlannerPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <PlannerClient />
      <Footer />
    </div>
  );
}
