import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function DespachoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <div className="min-h-dvh bg-fermento-cream flex flex-col">
      <header className="bg-fermento-dark text-fermento-cream">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-fermento-red text-lg tracking-tight">FERMENTO</span>
            {isAdmin && (
              <Link href="/admin" className="text-sm hover:text-fermento-red transition">
                Panel admin
              </Link>
            )}
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 pt-6 pb-12 flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
