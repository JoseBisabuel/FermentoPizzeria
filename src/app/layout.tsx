import type { Metadata } from "next";
import "./globals.css";

// Toda la app depende de sesión de usuario y datos en vivo de Supabase,
// así que no tiene sentido pre-renderizarla como estática en el build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fermento | Pizzería Artesanal",
  description: "Sistema de pedidos y mesas para Fermento Pizzería Artesanal Oculta",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
