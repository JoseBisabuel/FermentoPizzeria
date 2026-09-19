"use client";

export default function Footer() {
  const whatsapp = "573193034610";
  const link = `https://wa.me/${whatsapp}`;

  return (
    <footer className="text-center text-xs text-black/40 py-6">
      Desarrollado por{" "}
      <span className="font-semibold text-black/60">Nova Studio</span> ·{" "}
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
