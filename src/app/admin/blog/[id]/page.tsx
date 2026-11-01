import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { BlogPost } from "@/lib/blog";
import BlogEditor from "../BlogEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "블로그 글 수정 - Pothos" };

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const { data } = await getSupabaseServiceClient().from("blog_posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return <BlogEditor initial={data as BlogPost} />;
}
