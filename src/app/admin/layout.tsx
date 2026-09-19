import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import Footer from "@/components/Footer";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-fermento-cream">
      <header className="bg-fermento-dark text-fermento-cream">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-extrabold text-fermento-red text-lg tracking-tight">FERMENTO</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin/productos" className="hover:text-fermento-red transition">
                Productos
              </Link>
              <Link href="/admin/mesas" className="hover:text-fermento-red transition">
                Mesas
              </Link>
              <Link href="/admin/reportes" className="hover:text-fermento-red transition">
                Reportes
              </Link>
              <Link href="/admin/ajustes" className="hover:text-fermento-red transition">
                Ajustes
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
