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
