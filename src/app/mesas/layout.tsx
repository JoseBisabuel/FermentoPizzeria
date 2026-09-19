import LogoutButton from "@/components/LogoutButton";
import Footer from "@/components/Footer";

export default function MesasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-fermento-cream">
      <header className="bg-fermento-dark text-fermento-cream">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-extrabold text-fermento-red text-lg tracking-tight">FERMENTO</span>
          <LogoutButton />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      <Footer />
    </div>
  );
}
