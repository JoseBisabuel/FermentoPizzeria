import type { Metadata, Viewport } from "next";
import "./globals.css";
import DialogProvider from "@/components/DialogProvider";

// Toda la app depende de sesión de usuario y datos en vivo de Supabase,
// así que no tiene sentido pre-renderizarla como estática en el build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fermento | Pizzería Artesanal",
  description: "Sistema de pedidos y mesas para Fermento Pizzería Artesanal Oculta",
};

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
