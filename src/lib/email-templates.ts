// 이메일 HTML 템플릿 (브랜드 톤앤매너 적용)

interface TemplateOptions {
  recipientName?: string | null;
  url?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pothos</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;box-shadow:0 1px 2px rgba(15,23,42,.06);overflow:hidden;">
        <tr><td style="padding:32px 40px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:middle;">
                <div style="display:inline-block;width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#2563eb,#4f46e5);text-align:center;line-height:36px;color:#fff;font-weight:700;font-size:18px;letter-spacing:-.02em;">P</div>
              </td>
              <td style="padding-left:10px;vertical-align:middle;">
                <span style="font-size:18px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">Pothos</span>
                <span style="font-size:12px;color:#94a3b8;margin-left:6px;">먼 곳을 향한 동경</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <tr><td style="padding:24px 40px 40px;">
          ${content}
        </td></tr>

        <tr><td style="padding:20px 40px 32px;border-top:1px solid #f1f5f9;">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
            이 메일은 Pothos에서 자동 발송되었습니다.<br>
            문의는 <a href="${BASE_URL}" style="color:#2563eb;text-decoration:none;">pothostravel.com</a> 으로 회신해주세요.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buttonHtml(label: string, url: string, color = "#2563eb"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;"><tr><td style="border-radius:9999px;background:${color};">
    <a href="${url}" style="display:inline-block;padding:12px 24px;color:#fff;text-decoration:none;font-weight:700;font-size:14px;border-radius:9999px;">${label}</a>
  </td></tr></table>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ========== Sherpa ==========

export function sherpaApprovedEmail(opts: TemplateOptions): {
  subject: string;
  html: string;
} {
  const name = opts.recipientName ?? "셰르파";
  const dashboardUrl = `${BASE_URL}/sherpa/dashboard`;
  return {
    subject: "[Pothos] 셰르파 신청이 승인됐어요 🎉",
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Sherpa Approved</span>
      <h1 style="margin:16px 0 12px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(name)} 셰르파, 환영합니다!
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        셰르파 신청이 운영팀 검수를 통과했습니다.
        이제 여행자가 Pothos에서 회원님의 프로필을 보고 매칭을 신청할 수 있어요.
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#475569;">
        대시보드에서 받은 예약·내 제안·프로필을 한 번에 관리하세요.
        공개된 여행 일정에 직접 제안을 보내실 수도 있어요.
      </p>
      ${buttonHtml("대시보드로 가기", dashboardUrl, "#10b981")}
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
        활동을 일시 중지하고 싶을 땐 대시보드 → 프로필 → 일시 중지를 눌러주세요.
      </p>
    `),
  };
}

export function sherpaRejectedEmail(
  opts: TemplateOptions & { reason?: string | null }
): { subject: string; html: string } {
  const name = opts.recipientName ?? "신청자";
  return {
    subject: "[Pothos] 셰르파 신청 결과 안내",
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Application Update</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(name)} 님께,
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        제출해주신 셰르파 신청이 이번 검수에서 승인되지 않았습니다.
      </p>
      ${
        opts.reason
          ? `<div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #94a3b8;border-radius:8px;"><p style="margin:0;font-size:13px;color:#475569;line-height:1.6;"><strong style="color:#0f172a;">검수 사유:</strong><br>${escapeHtml(opts.reason)}</p></div>`
          : ""
      }
      <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#475569;">
        프로필을 보강해 다시 신청하실 수 있습니다. 자세한 안내가 필요하시면 회신 주세요.
      </p>
      ${buttonHtml("다시 신청하기", `${BASE_URL}/sherpa/become`, "#64748b")}
    `),
  };
}

// ========== Clinic ==========

export function clinicApprovedEmail(opts: {
  clinicName: string;
  slug: string;
}): { subject: string; html: string } {
  const url = `${BASE_URL}/medical/clinic/${opts.slug}`;
  return {
    subject: `[Pothos] ${opts.clinicName} 클리닉 등록이 승인됐어요`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#fdf2f8;color:#db2777;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Clinic Published</span>
      <h1 style="margin:16px 0 12px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.clinicName)} 등록 승인
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        제출해주신 클리닉 정보가 운영팀 검수를 통과해 Pothos 의료관광 페이지에 게시되었습니다.
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#475569;">
        여행자가 클리닉 상세 페이지에서 정보를 확인하고 상담 요청을 보낼 수 있습니다.
        상담 요청은 운영팀이 검토 후 안내드립니다.
      </p>
      ${buttonHtml("공개 페이지 보기", url, "#e11d48")}
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;">
        정보 수정이 필요하시면 회신해주세요.
      </p>
    `),
  };
}

export function clinicRejectedEmail(opts: {
  clinicName: string;
  reason?: string | null;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] ${opts.clinicName} 클리닉 등록 결과 안내`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Application Update</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.clinicName)} 등록 결과
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        제출해주신 클리닉 등록 신청이 이번 검수에서 승인되지 않았습니다.
      </p>
      ${
        opts.reason
          ? `<div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-left:3px solid #94a3b8;border-radius:8px;"><p style="margin:0;font-size:13px;color:#475569;line-height:1.6;"><strong style="color:#0f172a;">검수 사유:</strong><br>${escapeHtml(opts.reason)}</p></div>`
          : ""
      }
      <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#475569;">
        Pothos는 의료법(§27 영리 알선·유인 금지) 및 외국인환자 유치업 관련 법령 준수를
        검수 기준으로 합니다. 보완 후 재신청해주세요.
      </p>
      ${buttonHtml("다시 신청하기", `${BASE_URL}/medical/register`, "#64748b")}
    `),
  };
}

// ========== Booking (Path A) ==========

function bookingDetailsHtml(opts: {
  destinationCity: string;
  startDate: string;
  endDate: string;
  partySize: number;
  durationLabel: string;
  estimatedPriceKrw?: number | null;
}): string {
  const priceLine = opts.estimatedPriceKrw
    ? `<tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;">예상 비용</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${opts.estimatedPriceKrw.toLocaleString("ko-KR")}원</td></tr>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 16px;background:#f8fafc;border-radius:12px;padding:14px 16px;">
    <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;">도시</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${escapeHtml(opts.destinationCity)}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;">기간</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${opts.startDate} ~ ${opts.endDate}</td></tr>
    <tr><td style="padding:6px 0;color:#94a3b8;font-size:12px;">인원·시간</td><td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${opts.partySize}명 · ${escapeHtml(opts.durationLabel)}</td></tr>
    ${priceLine}
  </table>`;
}

export function bookingReceivedEmail(opts: {
  sherpaName: string;
  travelerName: string;
  destinationCity: string;
  startDate: string;
  endDate: string;
  partySize: number;
  durationLabel: string;
  notes: string;
  estimatedPriceKrw?: number | null;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] ${opts.travelerName} 님이 예약을 요청했어요`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">New Booking</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.sherpaName)} 셰르파, 새 예약 요청이 도착했어요
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        <strong>${escapeHtml(opts.travelerName)}</strong> 님이 매칭을 요청했습니다.
      </p>
      ${bookingDetailsHtml(opts)}
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;font-weight:600;">요청 사항</p>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#334155;white-space:pre-line;">${escapeHtml(opts.notes)}</p>
      ${buttonHtml("대시보드에서 응답하기", `${BASE_URL}/sherpa/dashboard`, "#10b981")}
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
        평균 응답 시간 내에 수락/거절 응답을 부탁드립니다.
      </p>
    `),
  };
}

export function bookingAcceptedEmail(opts: {
  sherpaName: string;
  travelerName: string;
  message?: string | null;
  destinationCity: string;
  startDate: string;
  endDate: string;
  partySize: number;
  durationLabel: string;
  estimatedPriceKrw?: number | null;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] ${opts.sherpaName} 셰르파가 예약을 수락했어요 🎉`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Booking Accepted</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.travelerName)} 님, 매칭이 성사됐어요!
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        <strong>${escapeHtml(opts.sherpaName)}</strong> 셰르파가 예약 요청을 수락했습니다.
      </p>
      ${bookingDetailsHtml(opts)}
      ${
        opts.message
          ? `<p style="margin:0 0 4px;font-size:12px;color:#94a3b8;font-weight:600;">셰르파 메시지</p><div style="margin:0 0 12px;padding:12px 14px;background:#ecfdf5;border-left:3px solid #10b981;border-radius:8px;font-size:13px;line-height:1.6;color:#334155;white-space:pre-line;">${escapeHtml(opts.message)}</div>`
          : ""
      }
      ${buttonHtml("내 여행 보기", `${BASE_URL}/my-trips`, "#10b981")}
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
        결제는 셰르파와 직접 협의해주세요. (현재 MVP — 추후 안전결제 도입 예정)
      </p>
    `),
  };
}

export function bookingDeclinedEmail(opts: {
  sherpaName: string;
  travelerName: string;
  reason?: string | null;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] 예약 응답: ${opts.sherpaName} 셰르파`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#fef2f2;color:#dc2626;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Booking Declined</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.travelerName)} 님께,
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        아쉽게도 <strong>${escapeHtml(opts.sherpaName)}</strong> 셰르파가 이번 예약을 받기 어렵다고 응답했어요.
      </p>
      ${
        opts.reason
          ? `<div style="margin:12px 0;padding:12px 14px;background:#f8fafc;border-left:3px solid #94a3b8;border-radius:8px;font-size:13px;color:#475569;line-height:1.6;">${escapeHtml(opts.reason)}</div>`
          : ""
      }
      <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#475569;">
        다른 셰르파를 둘러보거나, 매칭을 공개해서 자동으로 제안을 받아보세요.
      </p>
      ${buttonHtml("다른 셰르파 보기", `${BASE_URL}/sherpa`, "#64748b")}
    `),
  };
}

export function bookingCompletedEmail(opts: {
  sherpaName: string;
  travelerName: string;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] ${opts.sherpaName} 셰르파와의 여행은 어떠셨어요?`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#fef3c7;color:#b45309;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Trip Completed</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.travelerName)} 님, 여행은 어떠셨나요? ⭐
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        <strong>${escapeHtml(opts.sherpaName)}</strong> 셰르파와의 매칭이 완료됐습니다.
        솔직한 후기를 남겨주시면 다음 여행자에게 큰 도움이 됩니다.
      </p>
      ${buttonHtml("후기 남기기", `${BASE_URL}/my-trips`, "#f59e0b")}
    `),
  };
}

// ========== Proposal (Path B) ==========

export function proposalReceivedEmail(opts: {
  travelerName: string;
  sherpaName: string;
  tripTitle: string;
  proposedPriceKrw: number;
  proposedScope: string;
  message: string;
  tripId: string;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] ${opts.sherpaName} 셰르파가 제안을 보냈어요`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#eef2ff;color:#4f46e5;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">New Proposal</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.travelerName)} 님, 새 제안이 도착했어요
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        <strong>${escapeHtml(opts.sherpaName)}</strong> 셰르파가 <em>${escapeHtml(opts.tripTitle)}</em> 여행에 제안을 보냈습니다.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 16px;background:#eef2ff;border-radius:12px;padding:16px 18px;">
        <tr><td style="font-size:12px;color:#6366f1;font-weight:600;">제안 가격</td>
            <td style="font-size:18px;color:#4f46e5;font-weight:700;text-align:right;">${opts.proposedPriceKrw.toLocaleString("ko-KR")}원</td></tr>
        <tr><td colspan="2" style="padding-top:8px;font-size:12px;color:#6366f1;font-weight:600;">제안 범위</td></tr>
        <tr><td colspan="2" style="font-size:13px;color:#334155;line-height:1.6;">${escapeHtml(opts.proposedScope)}</td></tr>
      </table>
      <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;font-weight:600;">메시지</p>
      <p style="margin:0 0 12px;font-size:13px;line-height:1.6;color:#334155;white-space:pre-line;">${escapeHtml(opts.message)}</p>
      ${buttonHtml("제안 검토하기", `${BASE_URL}/my-trips/${opts.tripId}`, "#4f46e5")}
    `),
  };
}

export function proposalAcceptedEmail(opts: {
  sherpaName: string;
  tripTitle: string;
  travelerName: string;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] 제안이 수락됐어요 🎉`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Proposal Accepted</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.sherpaName)} 셰르파, 매칭이 성사됐어요!
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        <strong>${escapeHtml(opts.travelerName)}</strong> 님이 <em>${escapeHtml(opts.tripTitle)}</em> 여행에서 회원님의 제안을 수락했습니다.
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#475569;">
        대시보드에서 여행자와 직접 연락처를 주고받고, 결제·일정을 협의해주세요.
      </p>
      ${buttonHtml("대시보드 가기", `${BASE_URL}/sherpa/dashboard`, "#10b981")}
    `),
  };
}

export function proposalDeclinedEmail(opts: {
  sherpaName: string;
  tripTitle: string;
  reason?: string | null;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] 제안 응답: ${opts.tripTitle}`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#f8fafc;color:#64748b;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Proposal Declined</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.sherpaName)} 셰르파께,
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        제출하신 제안이 <em>${escapeHtml(opts.tripTitle)}</em> 여행의 매칭으로 선택되지 않았어요.
      </p>
      ${
        opts.reason
          ? `<div style="margin:12px 0;padding:12px 14px;background:#f8fafc;border-left:3px solid #94a3b8;border-radius:8px;font-size:13px;color:#475569;line-height:1.6;">${escapeHtml(opts.reason)}</div>`
          : ""
      }
      <p style="margin:0 0 8px;font-size:14px;line-height:1.7;color:#475569;">
        다른 공개 여행에 새로운 제안을 보내보세요.
      </p>
      ${buttonHtml("공개 여행 보기", `${BASE_URL}/sherpa/open-trips`, "#64748b")}
    `),
  };
}

// ========== Reviews ==========

export function reviewReceivedEmail(opts: {
  sherpaName: string;
  travelerName: string;
  rating: number;
  comment: string;
  sherpaSlug: string;
}): { subject: string; html: string } {
  const stars = "⭐".repeat(opts.rating) + "☆".repeat(5 - opts.rating);
  return {
    subject: `[Pothos] 새 후기를 받았어요 (${stars})`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#fef3c7;color:#b45309;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">New Review</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.sherpaName)} 셰르파, 후기가 도착했어요
      </h1>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#334155;">
        <strong>${escapeHtml(opts.travelerName)}</strong> 님이 후기를 남겼습니다.
      </p>
      <div style="margin:12px 0;padding:14px 16px;background:#fffbeb;border-radius:12px;border:1px solid #fde68a;">
        <p style="margin:0 0 8px;font-size:18px;color:#f59e0b;letter-spacing:0.05em;">${stars}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#334155;white-space:pre-line;">${escapeHtml(opts.comment)}</p>
      </div>
      ${buttonHtml("답글 작성하러 가기", `${BASE_URL}/sherpa/dashboard`, "#f59e0b")}
      <p style="margin:16px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
        답글은 후기 아래에 함께 게시됩니다. 공개 페이지: <a href="${BASE_URL}/sherpa/${opts.sherpaSlug}" style="color:#2563eb;text-decoration:none;">${BASE_URL}/sherpa/${opts.sherpaSlug}</a>
      </p>
    `),
  };
}

export function reviewReplyEmail(opts: {
  travelerName: string;
  sherpaName: string;
  reply: string;
  sherpaSlug: string;
}): { subject: string; html: string } {
  return {
    subject: `[Pothos] ${opts.sherpaName} 셰르파가 답글을 남겼어요`,
    html: layout(`
      <span style="display:inline-block;padding:4px 10px;border-radius:9999px;background:#ecfdf5;color:#059669;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">Sherpa Reply</span>
      <h1 style="margin:16px 0 12px;font-size:22px;font-weight:700;color:#0f172a;letter-spacing:-.02em;">
        ${escapeHtml(opts.travelerName)} 님, 답글이 도착했어요
      </h1>
      <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#334155;">
        남기신 후기에 <strong>${escapeHtml(opts.sherpaName)}</strong> 셰르파가 답글을 달았습니다.
      </p>
      <div style="margin:12px 0;padding:12px 14px;background:#ecfdf5;border-left:3px solid #10b981;border-radius:8px;">
        <p style="margin:0;font-size:13px;line-height:1.6;color:#334155;white-space:pre-line;">${escapeHtml(opts.reply)}</p>
      </div>
      ${buttonHtml("공개 페이지에서 보기", `${BASE_URL}/sherpa/${opts.sherpaSlug}`, "#10b981")}
    `),
  };
}
