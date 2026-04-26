import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import BoardManager from "./BoardManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "게시판 관리 - 경로",
};

export default async function AdminBoardsPage() {
  await requireAdmin();
  const supabase = getSupabaseServiceClient();
  const { data: boards } = await supabase
    .from("boards")
    .select("*")
    .order("display_order")
    .order("created_at");

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">게시판 관리</h1>
      <p className="text-sm text-gray-500 mb-6">
        커뮤니티 게시판을 만들고 순서, 공개 여부를 관리합니다.
      </p>
      <BoardManager initialBoards={boards ?? []} />
    </div>
  );
}
