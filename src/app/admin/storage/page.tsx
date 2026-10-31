import { requireAdmin } from "@/lib/admin";
import { getMigrationStatus } from "@/lib/storage-migration";
import StorageMigration from "./StorageMigration";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "저장소 이전 - Pothos",
};

export default async function AdminStoragePage() {
  await requireAdmin();
  let initial = null;
  let initialError: string | null = null;
  try {
    initial = await getMigrationStatus();
  } catch (e) {
    initialError = e instanceof Error ? e.message : "점검 실패";
  }
  return <StorageMigration initial={initial} initialError={initialError} />;
}
