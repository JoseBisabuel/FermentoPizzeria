import type { Metadata, Viewport } from "next";
import "./globals.css";
import DialogProvider from "@/components/DialogProvider";
import { createClient } from "@/lib/supabase/server";

// Toda la app depende de sesión de usuario y datos en vivo de Supabase,
// así que no tiene sentido pre-renderizarla como estática en el build.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("logo_url").eq("id", 1).single();

  return {
    title: "Fermento | Pizzería Artesanal",
    description: "Sistema de pedidos y mesas para Fermento Pizzería Artesanal Oculta",
    icons: data?.logo_url ? { icon: data.logo_url } : undefined,
  };
}

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
