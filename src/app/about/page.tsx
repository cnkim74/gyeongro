import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LogoMark } from "@/components/Logo";
import { ArrowRight, Compass, Heart, Sparkles, Quote } from "lucide-react";

export const metadata = {
  title: "About · Pothos · 먼 곳을 향한 동경",
  description:
    "Pothos는 그리스 신화 속 '먼 곳을 향한 동경의 신'에서 영감을 받았습니다. 여행의 시작은 늘 그리움에서 비롯됩니다.",
};

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />

      {/* Hero with the Greek word */}
      <section className="relative pt-32 pb-24 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-8">
            <LogoMark size={28} className="text-white" />
          </div>

          <p className="text-sm font-semibold tracking-[0.3em] text-blue-300 mb-6 uppercase">
            About Pothos
          </p>

          <h1
            className="font-bold tracking-tight mb-8 leading-none"
            style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}
          >
            Πόθος
          </h1>

          <p className="text-2xl sm:text-3xl text-white/80 font-light italic max-w-2xl mx-auto leading-snug">
            먼 곳을 향한 동경.
          </p>
          <p className="text-base text-white/50 mt-4 italic">
            Wherever you long for.
          </p>
        </div>
      </section>

      {/* Etymology */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-sm font-semibold tracking-wider text-blue-600 mb-3 uppercase">
            Etymology · 어원
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-8 leading-tight">
            도달할 수 없는 것을
            <br />
            그리워하는 마음
          </h2>

          <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed space-y-6">
            <p className="text-lg">
              <strong className="text-slate-900">Pothos (Πόθος)</strong>는 고대 그리스
              신화에 등장하는{" "}
              <span className="font-semibold text-slate-900">
                "먼 곳을 향한 동경의 신"
              </span>
              입니다.
            </p>

            <p className="text-lg">
              사랑의 신 <em>에로스(Eros)</em>, 욕망의 신{" "}
              <em>히메로스(Himeros)</em>와 함께{" "}
              <strong>에로테스(Erotes)</strong>라 불리는 작은 날개 달린 신들 중 하나로,
              세 신은 각각 다른 결의 갈망을 관장했습니다. 그중 <em>Pothos</em>는 가장
              섬세한 감정 — <strong className="text-slate-900">"지금 여기에 없는 것, 멀리 있는 것에 대한 그리움"</strong>을
              상징했습니다.
            </p>
          </div>

          <blockquote className="my-12 pl-8 border-l-4 border-blue-500 text-slate-700">
            <Quote className="w-8 h-8 text-blue-500 mb-3" />
            <p className="text-xl italic leading-relaxed mb-3">
              "Pothos는 보이지 않는 아름다움을 향한 영혼의 갈망이다.
              <br />
              채워질 수 없기에 더 강렬해지는 마음."
            </p>
            <footer className="text-sm text-slate-500 not-italic">
              — 플라톤 (Plato), 『크라틸로스』에서
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Why this name */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-sm font-semibold tracking-wider text-blue-600 mb-3 uppercase">
            Why Pothos · 왜 이 이름인가
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-12 leading-tight">
            여행의 시작은
            <br />
            언제나 동경입니다.
          </h2>

          <div className="space-y-8 text-lg text-slate-700 leading-relaxed">
            <p>
              화면 속 누군가의 사진. 어린 시절 본 영화의 한 장면. 친구가 들려준 이야기.
              거기서 마음이 시작됩니다.
            </p>
            <p>
              가본 적 없는 도시의 거리를 걷는 상상, 멀리 있어서 더 그리워지는 풍경, 언젠가
              꼭 가보겠다고 마음에 적어둔 한 줄.{" "}
              <strong className="text-slate-900">그 모든 것이 Pothos입니다.</strong>
            </p>
            <p className="pt-4 border-t border-slate-200">
              저희는 이 동경을 <strong className="text-slate-900">길</strong>로
              만드는 일을 합니다. AI는 막연한 그리움을 구체적인 일정으로 바꾸고, 같은
              곳을 향하는 사람들이 동료가 되어 함께 떠납니다. 그리고 다녀온 이의
              스토리는 누군가의 새로운 동경이 됩니다.
            </p>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-sm font-semibold tracking-wider text-blue-600 mb-3 uppercase text-center">
            Our Promise · 우리의 약속
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight mb-16 text-center leading-tight">
            동경을 길로 만드는 세 가지
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Compass,
                title: "방향을 짓다",
                eng: "Direction",
                desc: "AI가 막연한 갈망을 구체적인 코스로 바꿉니다. 30초 만에 당신만을 위한 동선이 그려집니다.",
              },
              {
                icon: Heart,
                title: "동료를 만나다",
                eng: "Companionship",
                desc: "혼자보다 둘이 좋은 순간이 있습니다. 같은 곳을 향하는 사람과 만나 함께 떠나세요.",
              },
              {
                icon: Sparkles,
                title: "이야기를 남기다",
                eng: "Stories",
                desc: "다녀온 길은 누군가의 새로운 동경이 됩니다. 당신의 여행이 다른 이의 시작이 되는 곳.",
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="group bg-slate-50 hover:bg-blue-50 rounded-3xl p-8 transition-colors"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold tracking-wider text-blue-600 uppercase mb-1">
                    {p.eng}
                  </p>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-32 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-2xl sm:text-3xl font-light italic leading-relaxed mb-12 text-white/80">
            "여행은 도착이 아니라
            <br />
            <span className="text-white">동경에서 시작됩니다.</span>"
          </p>

          <Link
            href="/planner"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-slate-950 font-semibold hover:bg-blue-50 transition-all hover:-translate-y-0.5"
          >
            <Compass className="w-5 h-5" />
            나만의 여정 시작하기
            <ArrowRight className="w-5 h-5" />
          </Link>

          <p className="text-xs text-white/40 mt-12 tracking-[0.3em] uppercase">
            Pothos · Wherever you long for
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
