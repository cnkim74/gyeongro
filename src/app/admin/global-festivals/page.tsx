import { requireAdmin } from "@/lib/admin";
import { getSupabaseServiceClient } from "@/lib/supabase";
import type { GlobalFestivalRow } from "@/lib/global-festivals-db";
import GlobalFestivalManager from "./GlobalFestivalManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "축제·박람회 큐레이션 - Pothos" };

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
  // 박람회용 항목(kind) 이 있는지
  let expoReady = false;
  if (!tableMissing) {
    const { error } = await getSupabaseServiceClient().from("global_festivals").select("kind").limit(1);
    expoReady = !error;
  }
  return <GlobalFestivalManager initial={rows} tableMissing={tableMissing} expoReady={expoReady} />;
}
