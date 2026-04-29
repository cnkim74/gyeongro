import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "개인정보처리방침 - Pothos",
  description: "Pothos 개인정보 수집·이용·보관 방침",
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2 tracking-tight">
              개인정보처리방침
            </h1>
            <p className="text-sm text-slate-500">
              시행일: 2026년 4월 28일 · 최종 개정: 2026년 4월 28일
            </p>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed">
            <Section title="1. 개인정보 수집 항목">
              <p className="mb-3">Pothos는 다음 정보를 수집합니다:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>
                  <strong>회원가입 시 (필수)</strong>: 이메일, 비밀번호(해시
                  저장), 닉네임, 휴대폰 번호
                </li>
                <li>
                  <strong>OAuth 로그인 시 (선택)</strong>: Google·카카오·네이버
                  계정의 이름·이메일·프로필 이미지
                </li>
                <li>
                  <strong>셰르파 가입 시 추가</strong>: 자기소개, 활동 도시·국가,
                  언어, 전문 분야, 시간당 요금, 자격 증빙 자료
                </li>
                <li>
                  <strong>파트너(기업) 가입 시 추가</strong>: 사업체명, 사업
                  분야
                </li>
                <li>
                  <strong>서비스 이용 시 자동 수집</strong>: IP, User-Agent,
                  접속 일시, 클릭·이동 로그, 쿠키, 디바이스 식별자
                </li>
                <li>
                  <strong>AI 사용 데이터</strong>: 입력한 여행 조건(목적지·기간
                  ·예산·테마), 생성된 일정 결과
                </li>
              </ul>
            </Section>

            <Section title="2. 수집 목적">
              <ul className="list-disc list-inside space-y-1.5">
                <li>회원 식별 및 인증, 계정 관리</li>
                <li>서비스 제공: AI 일정 생성, 셰르파 매칭, 메타서치 결과 표시</li>
                <li>예약 안내·알림 메일·DM 등 서비스 운영 커뮤니케이션</li>
                <li>이용 통계 분석 및 서비스 개선</li>
                <li>부정 이용 방지, 보안 점검</li>
                <li>법령상 의무 이행</li>
              </ul>
            </Section>

            <Section title="3. 보관 기간">
              <ul className="list-disc list-inside space-y-1.5">
                <li>
                  회원 정보: 회원 탈퇴 시 즉시 삭제 (단, 관련 법령에 따라 일정
                  기간 보관 필요한 항목은 분리 보관 후 폐기)
                </li>
                <li>전자상거래법: 계약·결제 기록 5년</li>
                <li>통신비밀보호법: 접속 로그 3개월</li>
                <li>AI 사용 데이터: 통계 목적 익명화 후 영구 보관 가능</li>
              </ul>
            </Section>

            <Section title="4. 제3자 제공">
              <p className="mb-3">
                Pothos는 원칙적으로 이용자의 개인정보를 외부에 제공하지
                않습니다. 단, 다음의 경우 제한적으로 제공됩니다:
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>이용자가 사전에 동의한 경우</li>
                <li>법령에 의해 요구되는 경우</li>
                <li>
                  셰르파·여행자 매칭이 성사되었을 때 상호 연락처 등 최소 정보
                  공유
                </li>
              </ul>
            </Section>

            <Section title="5. 처리 위탁">
              <p className="mb-3">
                Pothos는 서비스 운영을 위해 다음 외부 서비스에 데이터 처리를
                위탁합니다:
              </p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>
                  <strong>Supabase (Inc., 미국)</strong> — 데이터베이스 및 인증
                </li>
                <li>
                  <strong>Vercel (Inc., 미국)</strong> — 웹 호스팅
                </li>
                <li>
                  <strong>Groq (Inc., 미국)</strong> — AI 일정 생성
                </li>
                <li>
                  <strong>Google Maps Platform (미국)</strong> — 지도·경로 표시
                </li>
                <li>
                  <strong>Resend (Inc., 미국)</strong> — 알림 이메일 발송
                </li>
                <li>
                  <strong>제휴 메타서치사</strong> (Trip.com·Booking.com·
                  Skyscanner·KKday·Klook·GetYourGuide·Rentalcars 등) — 검색
                  쿼리·클릭 추적
                </li>
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                각 서비스 제공자는 해당 국가의 개인정보 보호 법령을 준수합니다.
              </p>
            </Section>

            <Section title="6. 쿠키 및 추적 기술">
              <p>
                Pothos는 로그인 상태 유지, 언어 설정, 사용 분석을 위해 쿠키를
                사용합니다. 이용자는 브라우저 설정에서 쿠키를 거부할 수 있으나,
                일부 기능(로그인 등)이 제한될 수 있습니다.
              </p>
            </Section>

            <Section title="7. 이용자의 권리">
              <p className="mb-3">이용자는 언제든 다음 권리를 행사할 수 있습니다:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>개인정보 열람 (내 프로필 페이지)</li>
                <li>정정 요청 (프로필 수정)</li>
                <li>삭제 요청 (회원 탈퇴)</li>
                <li>처리 정지 요청 (운영팀 이메일)</li>
                <li>동의 철회 (회원 탈퇴 또는 알림 설정 변경)</li>
              </ul>
            </Section>

            <Section title="8. 개인정보 안전 조치">
              <ul className="list-disc list-inside space-y-1.5">
                <li>비밀번호는 단방향 해시(bcrypt)로 저장</li>
                <li>HTTPS 전송 암호화</li>
                <li>접근 권한 통제 및 정기 감사</li>
                <li>로그 모니터링 및 침해사고 대응 절차</li>
              </ul>
            </Section>

            <Section title="9. 14세 미만 아동의 개인정보">
              <p>
                Pothos는 14세 미만 아동의 회원가입을 받지 않습니다. 14세 미만의
                개인정보가 수집된 사실이 확인되는 즉시 해당 정보를 삭제합니다.
              </p>
            </Section>

            <Section title="10. 개인정보 보호 책임자">
              <p>
                Pothos 운영팀이 개인정보 보호 책임자 역할을 수행합니다.
                관련 문의는 서비스 내 문의 채널 또는 운영팀 이메일을 통해
                접수할 수 있습니다. (이메일 주소는 추후 공개)
              </p>
            </Section>

            <Section title="11. 방침 변경">
              <p>
                본 방침이 변경되는 경우 시행일 7일 전 서비스 내 공지를 통해
                고지합니다. 중요한 변경사항은 30일 전 별도 안내합니다.
              </p>
            </Section>

            <Section title="관련 문서">
              <p>
                서비스 이용에 관한 일반적인 권리·의무는{" "}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  이용약관
                </Link>
                을 참고해주세요.
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
