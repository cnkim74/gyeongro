import { auth } from "@/lib/auth";
import HeaderClient from "./HeaderClient";

export default async function Header() {
  const session = await auth();
  return <HeaderClient user={session?.user ?? null} />;
}
