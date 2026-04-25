import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "프로필 - 경로",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const supabase = getSupabaseServiceClient();
  const { data: user } = await supabase
    .schema("next_auth")
    .from("users")
    .select("id, name, email, image, custom_image")
    .eq("id", session.user.id)
    .single();

  const displayImage = user?.custom_image ?? user?.image ?? null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필</h1>
          <p className="text-gray-500 text-sm mb-8">
            프로필 사진과 정보를 관리하세요
          </p>

          <div className="bg-white rounded-3xl border border-gray-100 p-8">
            <ProfileForm
              userId={session.user.id}
              name={user?.name ?? null}
              email={user?.email ?? null}
              currentImage={displayImage}
              hasCustomImage={!!user?.custom_image}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
