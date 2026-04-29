import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "이용약관 - Pothos",
  description: "Pothos 서비스 이용약관",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              이용약관
            </h1>
            <p className="text-sm text-slate-500">
              시행일: 2026년 4월 28일 · 최종 개정: 2026년 4월 28일
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed">
            <Section title="제1조 (목적)">
              <p>
                본 약관은 Pothos(이하 &lsquo;회사&rsquo;)가 제공하는 여행 플래너,
                셰르파 매칭, 메타서치 정보 제공 등 인터넷 관련 서비스(이하
                &lsquo;서비스&rsquo;)를 이용함에 있어 회사와 이용자 간의 권리·
                의무 및 책임사항을 규정함을 목적으로 합니다.
              </p>
            </Section>

            <Section title="제2조 (정의)">
              <ul className="list-disc list-inside space-y-1.5">
                <li>
                  <strong>&lsquo;서비스&rsquo;</strong>란 AI 여행 플래너, 셰르파
                  매칭, 항공·호텔·액티비티·렌트카 가격 비교, 의료관광 정보,
                  커뮤니티·후기 등 회사가 제공하는 모든 서비스를 의미합니다.
                </li>
                <li>
                  <strong>&lsquo;이용자&rsquo;</strong>란 본 약관에 따라 회사가
                  제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
                </li>
                <li>
                  <strong>&lsquo;여행자&rsquo;</strong>란 일반 회원으로 가입해
                  서비스를 이용하는 사용자를 말합니다.
                </li>
                <li>
                  <strong>&lsquo;셰르파&rsquo;</strong>란 현지 가이드·통역·
                  의료동행 등의 전문 서비스를 제공하기 위해 가입한 회원을
                  말합니다. 셰르파의 활동은 운영팀의 검수·승인 후 가능합니다.
                </li>
                <li>
                  <strong>&lsquo;파트너&rsquo;</strong>란 클리닉·여행사·항공사·
                  렌탈 업체 등 기업회원을 말합니다.
                </li>
                <li>
                  <strong>&lsquo;메타서치&rsquo;</strong>란 항공·호텔·액티비티·
                  렌트카의 가격 비교 정보 및 외부 제휴 사이트로 연결되는
                  서비스를 말합니다.
                </li>
              </ul>
            </Section>

            <Section title="제3조 (약관의 효력 및 변경)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게
                  공지함으로써 효력이 발생합니다.
                </li>
                <li>
                  회사는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은
                  공지 후 7일이 경과한 시점부터 효력이 발생합니다. 이용자에게
                  불리한 변경의 경우 30일 전 공지합니다.
                </li>
                <li>
                  변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고
                  탈퇴할 수 있으며, 변경 약관 효력 발생일 이후에도 서비스를
                  계속 이용하는 경우 변경에 동의한 것으로 간주합니다.
                </li>
              </ol>
            </Section>

            <Section title="제4조 (회원가입)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  이용자는 회사가 정한 양식에 따라 회원정보를 기입하고 본
                  약관에 동의함으로써 회원가입을 신청할 수 있습니다.
                </li>
                <li>
                  회사는 다음의 경우 회원가입을 거절하거나 사후 해지할 수
                  있습니다:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>실명이 아니거나 타인의 명의를 도용한 경우</li>
                    <li>허위 정보를 기재한 경우</li>
                    <li>이전에 회원자격을 상실한 적이 있는 경우</li>
                    <li>기타 회사가 정한 가입 요건을 충족하지 못한 경우</li>
                  </ul>
                </li>
                <li>
                  셰르파·파트너 등급으로의 가입 또는 전환은 별도 검수 절차를
                  거쳐 승인됩니다.
                </li>
              </ol>
            </Section>

            <Section title="제5조 (서비스 제공 및 책임 제한)">
              <ol className="list-decimal list-inside space-y-2">
                <li>
                  <strong>AI 여행 플래너:</strong> 회사가 제공하는 AI 일정은
                  학습된 정보를 기반으로 한 추천이며, 영업시간·가격·예약
                  가능 여부·휴무일 등 실시간 정보는 부정확할 수 있습니다.
                  최종 확인은 이용자가 외부 사이트(Google, Naver 등)에서
                  진행하시기 바랍니다.
                </li>
                <li>
                  <strong>메타서치(항공·호텔·액티비티·렌트카):</strong> 회사는
                  항공권·호텔·액티비티·렌트카를 직접 판매하지 않으며, 외부 제휴
                  사이트(Trip.com, Booking.com, Skyscanner, KKday, Klook,
                  GetYourGuide, Rentalcars, DiscoverCars 등)로 정보 제공 및
                  연결만 합니다. 결제·예약·환불·고객 응대는 모두 해당 외부
                  사이트의 정책에 따르며, 회사는 이에 대한 책임을 지지 않습니다.
                </li>
                <li>
                  <strong>셰르파 매칭:</strong> 회사는 셰르파와 여행자 간 만남을
                  중개하는 플랫폼이며, 셰르파 본인이 제공하는 서비스의 품질·
                  안전·계약 이행에 대한 직접적 책임을 지지 않습니다. 단,
                  중대한 위반이 확인되는 경우 셰르파 자격을 정지·박탈할 수
                  있습니다.
                </li>
                <li>
                  <strong>의료관광 정보:</strong> 회사는 의료관광 통역·동행
                  서비스에 대한 정보 제공 플랫폼이며 의료기관이 아닙니다.
                  진료·시술의 결과는 해당 의료기관의 책임이며, 회사는 이를
                  보증하지 않습니다.
                </li>
                <li>
                  회사는 천재지변, 전쟁, 테러, 시스템 점검·장애, 정전, 통신
                  장애, 외부 API 제공자(LLM·지도·결제·메타서치)의 장애 등
                  불가항력으로 인한 서비스 중단·정확도 저하에 대해 책임을 지지
                  않습니다.
                </li>
              </ol>
            </Section>

            <Section title="제6조 (이용자의 의무)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  이용자는 서비스 이용 시 다음 행위를 해서는 안 됩니다:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li>타인의 정보 도용 또는 허위 정보 등록</li>
                    <li>회사의 서비스 운영을 방해하는 일체의 행위</li>
                    <li>다른 이용자에게 위해를 가하는 행위</li>
                    <li>서비스를 통해 음란·폭력·차별·혐오 콘텐츠를 게시하는 행위</li>
                    <li>저작권·초상권 등 제3자의 권리를 침해하는 행위</li>
                    <li>
                      서비스를 이용해 불법 의료 알선·환자 유인·무자격 가이드
                      활동 등 관련 법령을 위반하는 행위
                    </li>
                  </ul>
                </li>
                <li>
                  이용자는 자신의 계정 정보를 안전하게 관리할 책임이 있으며,
                  계정 도용으로 인한 손해는 이용자가 부담합니다.
                </li>
              </ol>
            </Section>

            <Section title="제7조 (셰르파·파트너의 추가 의무)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  셰르파는 자국 또는 활동 국가의 관광·통역·의료 통역 관련
                  자격을 보유해야 하며, 무자격 활동에 대한 책임은 본인에게
                  있습니다.
                </li>
                <li>
                  파트너(클리닉·여행사 등)는 자국의 사업자등록·인허가 요건을
                  충족해야 하며, 이를 회사에 사전 고지할 의무가 있습니다.
                </li>
                <li>
                  셰르파·파트너의 위반 행위에 대해 회사는 자격 정지·박탈,
                  관계 당국 신고 등의 조치를 취할 수 있습니다.
                </li>
              </ol>
            </Section>

            <Section title="제8조 (수수료 및 결제)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  서비스 이용은 기본적으로 무료입니다. AI 사용량 한도, 셰르파
                  Pro 등의 유료 서비스는 별도 가격 정책에 따릅니다.
                </li>
                <li>
                  셰르파 매칭 거래에 대한 플랫폼 수수료는 별도로 고지합니다.
                </li>
                <li>
                  메타서치를 통한 외부 사이트 결제는 해당 사이트의 결제·환불
                  정책을 따릅니다.
                </li>
              </ol>
            </Section>

            <Section title="제9조 (지적재산권)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  서비스 내 모든 콘텐츠(UI, 디자인, 코드, AI 생성 일정 등)에
                  대한 권리는 회사 또는 정당한 권리자에게 있습니다.
                </li>
                <li>
                  이용자가 서비스에 게시한 콘텐츠(후기·스토리 등)에 대한
                  저작권은 이용자에게 있으며, 이용자는 회사가 서비스 운영·홍보
                  목적으로 해당 콘텐츠를 활용할 수 있는 비독점적 권리를
                  부여합니다.
                </li>
              </ol>
            </Section>

            <Section title="제10조 (회원 탈퇴 및 자격 상실)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  이용자는 언제든 서비스 내 설정에서 회원 탈퇴를 신청할 수
                  있습니다.
                </li>
                <li>
                  회사는 이용자가 본 약관을 위반한 경우 사전 통지 후 자격을
                  제한·정지·상실시킬 수 있습니다.
                </li>
              </ol>
            </Section>

            <Section title="제11조 (분쟁 해결)">
              <ol className="list-decimal list-inside space-y-1.5">
                <li>
                  회사와 이용자 간 분쟁은 우선 상호 협의를 통해 해결합니다.
                </li>
                <li>
                  협의가 이루어지지 않을 경우 대한민국 법령을 준거법으로 하며,
                  서울중앙지방법원을 1심 관할 법원으로 합니다.
                </li>
              </ol>
            </Section>

            <Section title="제12조 (개인정보 보호)">
              <p>
                회사는 이용자의 개인정보를 별도의{" "}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  개인정보처리방침
                </Link>
                에 따라 처리합니다.
              </p>
            </Section>

            <Section title="문의">
              <p>
                약관 관련 문의는 운영팀 이메일을 통해 접수할 수 있습니다.
                (이메일 주소는 추후 공개)
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-900 mb-3 tracking-tight">
        {title}
      </h2>
      <div className="text-slate-700">{children}</div>
    </section>
  );
}
