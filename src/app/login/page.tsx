"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("settings")
      .select("logo_url")
      .eq("id", 1)
      .single()
      .then(({ data }) => setLogoUrl(data?.logo_url ?? null));
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const email = `${username.trim().toLowerCase()}@fermento.local`;

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    router.push(profile?.role === "admin" ? "/admin" : "/mesas");
    router.refresh();
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-fermento-dark px-4 overflow-hidden">
      {/* Fondo animado */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="login-blob-1 absolute -top-24 -left-20 w-72 h-72 rounded-full bg-fermento-red/30 blur-3xl" />
        <div className="login-blob-2 absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-fermento-red/20 blur-3xl" />
        <div className="login-blob-3 absolute -bottom-24 left-1/4 w-64 h-64 rounded-full bg-fermento-cream/10 blur-3xl" />
      </div>

      <div className="login-card-enter relative w-full max-w-sm bg-fermento-cream/95 backdrop-blur rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="login-logo-float w-20 h-20 rounded-full bg-fermento-dark flex items-center justify-center border-4 border-fermento-red mb-3 overflow-hidden">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Fermento" className="w-full h-full object-cover" />
            ) : (
              <span className="text-fermento-cream font-bold text-2xl">F</span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-fermento-red tracking-tight">FERMENTO</h1>
          <p className="text-xs uppercase tracking-widest text-fermento-dark/60">
            Pizzería Artesanal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fermento-red"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fermento-red"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-sm text-fermento-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-fermento-red text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
      <div className="mt-4">
        <Footer variant="light" />
      </div>
    </div>
  );
}
