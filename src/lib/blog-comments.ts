// 블로그 댓글 — 서버 전용 (supabase/migration_blog_comments.sql)
//
// 공개 범위
//  - 공개 댓글: 누구나
//  - 비밀 댓글: 쓴 사람 · 관리자(글쓴이)만. 다른 사람에게는 "비밀 댓글이에요"로만 보임
//  - 비밀 댓글에 달린 답글: 원댓글 쓴 사람 · 답글 쓴 사람 · 관리자만
// 답글은 한 단계만 (댓글 → 답글)

import { getSupabaseServiceClient } from "./supabase";
import { sendEmail } from "./email";
import { blogCommentEmail } from "./email-templates";
import { sendPushToUser } from "./web-push";

const SITE = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://pothostravel.com").replace(/\/$/, "");

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

export type CommentAuthor = { name: string; image: string | null; isAdmin: boolean };

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

type UserRow = { id: string; nickname?: string | null; name?: string | null; image?: string | null; role?: string | null };

async function usersById(ids: string[]): Promise<Map<string, UserRow>> {
  const map = new Map<string, UserRow>();
  if (ids.length === 0) return map;
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase.schema("next_auth").from("users").select("id, nickname, name, image, role").in("id", ids);
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
export async function listBlogComments(postId: string, viewerId: string | null, viewerIsAdmin: boolean): Promise<BlogCommentView[] | null> {
  const { data, error } = await getSupabaseServiceClient()
    .from("blog_comments")
    .select("id, post_id, parent_id, user_id, content, is_private, is_deleted, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) return null;
  const rows = (data ?? []) as Row[];
  const users = await usersById([...new Set(rows.map((r) => r.user_id))]);

  const view = (r: Row, visible: boolean): BlogCommentView => {
    const u = users.get(r.user_id);
    const isAdmin = u?.role === "admin";
    return {
      id: r.id,
      userId: r.user_id,
      author: { name: isAdmin ? "Pothos 에디터" : displayName(u), image: u?.image ?? null, isAdmin },
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
    const topVisible = !t.is_private || viewerIsAdmin || viewerId === t.user_id;
    const v = view(t, topVisible);
    const replies = rows.filter((r) => r.parent_id === t.id);
    v.replies = replies
      .filter((r) => !r.is_deleted)
      .map((r) => {
        const priv = r.is_private || t.is_private;
        const visible = !priv || viewerIsAdmin || viewerId === r.user_id || viewerId === t.user_id;
        return { ...view(r, visible), isPrivate: priv };
      });
    // 지운 댓글은 답글이 없으면 아예 숨김
    if (t.is_deleted && v.replies.length === 0) continue;
    out.push(v);
  }
  return out;
}

export function countVisible(list: BlogCommentView[]): number {
  return list.reduce((n, c) => n + (c.isDeleted ? 0 : 1) + c.replies.length, 0);
}

async function adminIds(): Promise<string[]> {
  const supabase = getSupabaseServiceClient();
  const ids = new Set<string>();
  const { data } = await supabase.schema("next_auth").from("users").select("id").eq("role", "admin");
  for (const u of (data ?? []) as { id: string }[]) ids.add(u.id);
  const { data: admins } = await supabase.from("admins").select("user_id");
  for (const a of (admins ?? []) as { user_id: string }[]) ids.add(a.user_id);
  return [...ids];
}

/**
 * 새 댓글·답글 알림 (푸시 + 이메일). 실패해도 throw 안 함
 *  - 글쓴이(없으면 관리자 전원): 새 댓글, 그리고 관리자가 아닌 사람이 쓴 답글
 *  - 원댓글 쓴 사람: 자기 댓글에 달린 답글
 *  - 본인이 쓴 건 본인에게 알리지 않음
 */
export async function notifyBlogComment(commentId: string): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();
    const { data: c } = await supabase
      .from("blog_comments")
      .select("id, post_id, parent_id, user_id, content, is_private")
      .eq("id", commentId)
      .maybeSingle();
    if (!c) return;
    const { data: post } = await supabase.from("blog_posts").select("slug, title, author_id").eq("id", c.post_id).maybeSingle();
    if (!post) return;
    let parent: { user_id: string; is_private: boolean } | null = null;
    if (c.parent_id) {
      const { data } = await supabase.from("blog_comments").select("user_id, is_private").eq("id", c.parent_id).maybeSingle();
      parent = data;
    }
    const admins = await adminIds();
    const writerIsAdmin = admins.includes(c.user_id);
    const owners = post.author_id ? [post.author_id as string] : admins;

    const recipients = new Set<string>();
    if (!c.parent_id || !writerIsAdmin) owners.forEach((id) => recipients.add(id));
    if (parent) recipients.add(parent.user_id);
    recipients.delete(c.user_id);
    if (recipients.size === 0) return;

    const users = await usersById([...recipients, c.user_id]);
    const writer = users.get(c.user_id);
    const authorName = writerIsAdmin ? "Pothos 에디터" : displayName(writer);
    const isReply = !!c.parent_id;
    const isPrivate = !!c.is_private || !!parent?.is_private;
    const url = `${SITE}/blog/${post.slug}#c-${c.parent_id ?? c.id}`;
    const preview = String(c.content).replace(/\s+/g, " ").slice(0, 90);

    // 이메일 주소는 next_auth.users 에서
    const { data: emails } = await supabase.schema("next_auth").from("users").select("id, email").in("id", [...recipients]);
    const emailOf = new Map(((emails ?? []) as { id: string; email: string | null }[]).map((u) => [u.id, u.email]));

    await Promise.all(
      [...recipients].map(async (uid) => {
        const pushed = await sendPushToUser(uid, {
          title: `${isPrivate ? "🔒 " : ""}${isReply ? "새 답글" : "새 댓글"} · ${authorName}`,
          body: `${post.title.slice(0, 30)} — ${preview}`,
          url: `/blog/${post.slug}#c-${c.parent_id ?? c.id}`,
          tag: `blog-comment-${c.id}`,
        });
        const email = emailOf.get(uid);
        // 푸시를 받을 기기가 없으면 이메일로
        if (email && pushed === 0) {
          const tpl = blogCommentEmail({
            recipientName: owners.includes(uid) ? null : displayName(users.get(uid)),
            authorName,
            postTitle: post.title,
            content: String(c.content),
            url,
            isReply,
            isPrivate,
          });
          await sendEmail({ to: email, subject: tpl.subject, html: tpl.html });
        }
      })
    );
  } catch (e) {
    console.error("[notifyBlogComment] 실패:", e);
  }
}
