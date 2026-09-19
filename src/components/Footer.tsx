"use client";

export default function Footer({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const whatsapp = "573193034610";
  const link = `https://wa.me/${whatsapp}`;

  const textClass = variant === "light" ? "text-fermento-cream/50" : "text-black/40";
  const nameClass = variant === "light" ? "text-fermento-cream/80" : "text-black/60";

  return (
    <footer className={`text-center text-xs py-6 ${textClass}`}>
      Desarrollado por <span className={`font-semibold ${nameClass}`}>Nova Studio</span> ·{" "}
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-fermento-red font-medium hover:underline"
      >
        Contáctanos
      </a>
    </footer>
  );
}
