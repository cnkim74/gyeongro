import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { GlobalFestivalRow } from "@/lib/global-festivals-db";
import GlobalFestivalManager from "./GlobalFestivalManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "해외 축제 큐레이션 - Pothos" };

export default async function AdminGlobalFestivalsPage() {
  await requireAdmin();
  let rows: GlobalFestivalRow[] = [];
  let tableMissing = false;
  try {
    const { data, error } = await getSupabaseServiceClient()
      .from("global_festivals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) tableMissing = true;
    rows = (data ?? []) as GlobalFestivalRow[];
  } catch {
    tableMissing = true;
  }
  return <GlobalFestivalManager initial={rows} tableMissing={tableMissing} />;
}
