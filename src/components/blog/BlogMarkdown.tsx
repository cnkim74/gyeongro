// 블로그 본문 (마크다운) — 서버·클라이언트(관리자 미리보기) 공용
// ## 제목 → 목차 앵커, 표·목록·이미지(설명 캡션)·외부 링크·인용(팁 박스), 유튜브 주소만 있는 줄 → 플레이어

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { extractYouTube } from "@/lib/youtube";
import { headingId } from "@/lib/blog-utils";

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function safeHref(href?: string): string | undefined {
  if (!href) return undefined;
  return /^(https?:\/\/|\/|#|mailto:)/i.test(href) ? href : undefined;
}

export default function BlogMarkdown({ content }: { content: string }) {
  return (
    <div className="blog-body text-[17px] leading-[1.85] text-slate-700">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h2: ({ children }) => (
            <h2
              id={headingId(textOf(children))}
              className="scroll-mt-24 text-2xl sm:text-[28px] font-extrabold tracking-tight text-slate-900 mt-14 mb-5"
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => <h3 className="text-xl font-bold text-slate-900 mt-9 mb-3">{children}</h3>,
          h4: ({ children }) => <h4 className="text-lg font-bold text-slate-900 mt-6 mb-2">{children}</h4>,
          p: ({ children }) => {
            // 유튜브 주소만 있는 문단 → 플레이어
            const text = textOf(children).trim();
            if (/^https?:\/\/\S+$/.test(text)) {
              const id = extractYouTube(text).videoIds[0];
              if (id) {
                return (
                  <div className="my-8">
                    <YouTubeEmbed id={id} />
                  </div>
                );
              }
            }
            return <p className="my-5">{children}</p>;
          },
          ul: ({ children }) => <ul className="my-5 pl-6 list-disc space-y-2 marker:text-blue-500">{children}</ul>,
          ol: ({ children }) => <ol className="my-5 pl-6 list-decimal space-y-2 marker:font-bold marker:text-blue-600">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
          a: ({ href, children }) => {
            const h = safeHref(href);
            if (!h) return <span>{children}</span>;
            const external = /^https?:\/\//i.test(h);
            return (
              <a
                href={h}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="font-semibold text-blue-600 underline underline-offset-4 decoration-blue-200 hover:decoration-blue-600"
              >
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-7 rounded-2xl bg-blue-50 border border-blue-100 px-5 py-1 text-slate-800 [&>p]:my-3">
              {children}
            </blockquote>
          ),
          img: ({ src, alt, title }) => {
            const s = typeof src === "string" ? safeHref(src) : undefined;
            if (!s) return null;
            const caption = title || alt;
            return (
              <span className="block my-9">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s} alt={alt ?? ""} loading="lazy" className="w-full rounded-2xl" />
                {caption && <span className="block mt-2 text-center text-sm text-slate-400">{caption}</span>}
              </span>
            );
          },
          table: ({ children }) => (
            <div className="my-7 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-[15px] border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50 text-slate-900">{children}</thead>,
          th: ({ children }) => <th className="text-left font-bold px-4 py-3 border-b border-slate-200 whitespace-nowrap">{children}</th>,
          td: ({ children }) => <td className="px-4 py-3 border-b border-slate-100 align-top">{children}</td>,
          hr: () => <hr className="my-12 border-slate-200" />,
          code: ({ children }) => <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[0.9em] text-slate-800">{children}</code>,
          pre: ({ children }) => <pre className="my-6 p-4 rounded-2xl bg-slate-900 text-slate-100 overflow-x-auto text-sm [&_code]:bg-transparent [&_code]:text-slate-100">{children}</pre>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
