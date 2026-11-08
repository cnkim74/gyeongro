// 댓글 (블로그 · 스토리 공용) — 서버 전용
//   블로그: blog_comments (supabase/migration_blog_comments.sql)
//   스토리: story_comments (supabase/migration_story_comments.sql)
//
// 공개 범위
//  - 공개 댓글: 누구나
//  - 비밀 댓글: 쓴 사람 · 글쓴이 · 관리자만. 다른 사람에게는 "비밀 댓글이에요"로만 보임
//  - 비밀 댓글에 달린 답글: 원댓글 쓴 사람 · 답글 쓴 사람 · 글쓴이 · 관리자만
// 답글은 한 단계만 (댓글 → 답글)

import { getSupabaseServiceClient } from "./supabase";
import { sendEmail } from "./email";
import { blogCommentEmail } from "./email-templates";
import { sendPushToUser } from "./web-push";
import { listAdminIds } from "./admin";

const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");

export type CommentKind = "blog" | "story";

export const COMMENT_TABLE: Record<CommentKind, string> = {
  blog: "blog_comments",
  story: "story_comments",
};

type Row = {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  content: string;
  is_private: boolean;
  is_deleted: boolean;
  created_at: string;
};

export type CommentAuthor = { name: string; image: string | null; isAdmin: boolean; isOwner: boolean };

export type BlogCommentView = {
  id: string;
  userId: string;
  author: CommentAuthor;
  /** 볼 수 없으면 null (비밀 댓글) */
  content: string | null;
  isPrivate: boolean;
  isDeleted: boolean;
  createdAt: string;
  mine: boolean;
  replies: BlogCommentView[];
};

/** 댓글이 달리는 글 정보 */
export type CommentTarget = {
  title: string;
  path: string;
  /** 글쓴이 (블로그: 작성 관리자, 없으면 관리자 전원 / 스토리: 쓴 회원) */
  ownerIds: string[];
  /** 공개된 글인지 */
  visible: boolean;
};

export async function commentTarget(kind: CommentKind, postId: string): Promise<CommentTarget | null> {
  const supabase = getSupabaseServiceClient();
  if (kind === "blog") {
    const { data } = await supabase.from("blog_posts").select("slug, title, author_id, is_published").eq("id", postId).maybeSingle();
    if (!data) return null;
    return {
      title: data.title,
      path: `/blog/${data.slug}`,
      ownerIds: data.author_id ? [data.author_id as string] : await listAdminIds(),
      visible: !!data.is_published,
    };
  }
  const { data } = await supabase.from("stories").select("id, title, user_id, is_published, is_deleted").eq("id", postId).maybeSingle();
  if (!data) return null;
  return {
    title: data.title,
    path: `/stories/${data.id}`,
    ownerIds: [data.user_id as string],
    visible: !!data.is_published && !data.is_deleted,
  };
}

type UserRow = { id: string; nickname?: string | null; name?: string | null; image?: string | null; custom_image?: string | null; role?: string | null };

async function usersById(ids: string[]): Promise<Map<string, UserRow>> {
  const map = new Map<string, UserRow>();
  if (ids.length === 0) return map;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.schema("next_auth").from("users").select("*").in("id", ids);
  for (const u of (data ?? []) as UserRow[]) map.set(u.id, u);
  // role 컬럼이 비어 있어도 admins 테이블에 있으면 관리자
  const { data: admins } = await supabase.from("admins").select("user_id").in("user_id", ids);
  for (const a of (admins ?? []) as { user_id: string }[]) {
    const u = map.get(a.user_id);
    if (u) u.role = "admin";
  }
  return map;
}

function displayName(u: UserRow | undefined): string {
  const n = (u?.nickname || u?.name || "").trim();
  return n || "여행자";
}

/** 글의 댓글 목록 (보는 사람 기준으로 비밀 댓글 가림). 테이블이 없으면 null */
export async function listComments(
  kind: CommentKind,
  postId: string,
  viewerId: string | null,
  viewerIsAdmin: boolean,
  ownerIds: string[]
): Promise<BlogCommentView[] | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from(COMMENT_TABLE[kind])
    .select("id, post_id, parent_id, user_id, content, is_private, is_deleted, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) return null;
  const rows = (data ?? []) as Row[];
  const users = await usersById([...new Set(rows.map((r) => r.user_id))]);
  const viewerIsOwner = !!viewerId && ownerIds.includes(viewerId);
  const privileged = viewerIsAdmin || viewerIsOwner;

  const view = (r: Row, visible: boolean): BlogCommentView => {
    const u = users.get(r.user_id);
    const isAdmin = u?.role === "admin";
    return {
      id: r.id,
      userId: r.user_id,
      author: {
        name: isAdmin ? "Pothos 에디터" : displayName(u),
        image: u?.custom_image ?? u?.image ?? null,
        isAdmin,
        isOwner: ownerIds.includes(r.user_id),
      },
      content: r.is_deleted ? null : visible ? r.content : null,
      isPrivate: r.is_private,
      isDeleted: r.is_deleted,
      createdAt: r.created_at,
      mine: !!viewerId && viewerId === r.user_id,
      replies: [],
    };
  };

  const tops = rows.filter((r) => !r.parent_id);
  const out: BlogCommentView[] = [];
  for (const t of tops) {
    const topVisible = !t.is_private || privileged || viewerId === t.user_id;
    const v = view(t, topVisible);
    v.replies = rows
      .filter((r) => r.parent_id === t.id && !r.is_deleted)
      .map((r) => {
        const priv = r.is_private || t.is_private;
        const visible = !priv || privileged || viewerId === r.user_id || viewerId === t.user_id;
        return { ...view(r, visible), isPrivate: priv };
      });
    // 지운 댓글은 답글이 없으면 아예 숨김
    if (t.is_deleted && v.replies.length === 0) continue;
    out.push(v);
  }
  return out;
}

/** 블로그 댓글 목록 (예전 이름 유지) */
export async function listBlogComments(postId: string, viewerId: string | null, viewerIsAdmin: boolean) {
  const target = await commentTarget("blog", postId);
  return listComments("blog", postId, viewerId, viewerIsAdmin, target?.ownerIds ?? []);
}

export function countVisible(list: BlogCommentView[]): number {
  return list.reduce((n, c) => n + (c.isDeleted ? 0 : 1) + c.replies.length, 0);
}

/**
 * 새 댓글·답글 알림 (푸시 + 이메일). 실패해도 throw 안 함
 *  - 글쓴이: 새 댓글, 그리고 글쓴이가 아닌 사람이 쓴 답글
 *  - 원댓글 쓴 사람: 자기 댓글에 달린 답글
 *  - 본인이 쓴 건 본인에게 알리지 않음
 */
export async function notifyComment(kind: CommentKind, commentId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const table = COMMENT_TABLE[kind];
    const { data: c } = await supabase
      .from(table)
      .select("id, post_id, parent_id, user_id, content, is_private")
      .eq("id", commentId)
      .maybeSingle();
    if (!c) return;
    const target = await commentTarget(kind, c.post_id);
    if (!target) return;
    let parent: { user_id: string; is_private: boolean } | null = null;
    if (c.parent_id) {
      const { data } = await supabase.from(table).select("user_id, is_private").eq("id", c.parent_id).maybeSingle();
      parent = data;
    }
    const owners = target.ownerIds;
    const writerIsOwner = owners.includes(c.user_id);

    const recipients = new Set<string>();
    if (!c.parent_id || !writerIsOwner) owners.forEach((id) => recipients.add(id));
    if (parent) recipients.add(parent.user_id);
    recipients.delete(c.user_id);
    if (recipients.size === 0) return;

    const users = await usersById([...recipients, c.user_id]);
    const writer = users.get(c.user_id);
    const authorName = writer?.role === "admin" ? "Pothos 에디터" : displayName(writer);
    const isReply = !!c.parent_id;
    const isPrivate = !!c.is_private || !!parent?.is_private;
    const anchor = `#c-${c.parent_id ?? c.id}`;
    const preview = String(c.content).replace(/\s+/g, " ").slice(0, 90);

    const { data: emails } = await supabase.schema("next_auth").from("users").select("id, email").in("id", [...recipients]);
    const emailOf = new Map(((emails ?? []) as { id: string; email: string | null }[]).map((u) => [u.id, u.email]));

    await Promise.all(
      [...recipients].map(async (uid) => {
        const pushed = await sendPushToUser(uid, {
          title: `${isPrivate ? "🔒 " : ""}${isReply ? "새 답글" : "새 댓글"} · ${authorName}`,
          body: `${target.title.slice(0, 30)} — ${preview}`,
          url: `${target.path}${anchor}`,
          tag: `${kind}-comment-${c.id}`,
        });
        const email = emailOf.get(uid);
        // 푸시를 받을 기기가 없으면 이메일로
        if (email && pushed === 0) {
          const tpl = blogCommentEmail({
            recipientName: displayName(users.get(uid)),
            authorName,
            postTitle: target.title,
            content: String(c.content),
            url: `${SITE}${target.path}${anchor}`,
            isReply,
            isPrivate,
            kind,
          });
          await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
        }
      })
    );
  } catch (e) {
    console.error("[notifyComment] 실패:", e);
  }
}
