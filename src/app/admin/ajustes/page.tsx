"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDialog } from "@/components/DialogProvider";
import type { Settings } from "@/types/db";

const SOPORTE_WHATSAPP = "573193034610";

export default function AjustesPage() {
  const supabase = createClient();
  const dialog = useDialog();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .single()
      .then(({ data }) => {
        if (data) {
          setSettings(data);
          setBusinessName(data.business_name ?? "");
        }
      });
  }, [supabase]);

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("settings").update({ logo_url: data.publicUrl }).eq("id", 1);
      setSettings((prev) => (prev ? { ...prev, logo_url: data.publicUrl } : prev));
    } else {
      await dialog.alert("Error subiendo el logo");
    }
    setUploading(false);
  }

  async function saveSettings() {
    setSaving(true);
    await supabase.from("settings").update({ business_name: businessName }).eq("id", 1);
    setSaving(false);
    dialog.toast("Ajustes guardados");
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-fermento-red mb-6">Ajustes</h1>

      <label className="block text-sm font-medium mb-1">Logo</label>
      <div className="flex items-center gap-3 mb-4">
        {settings?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={settings.logo_url} alt="Logo" className="w-16 h-16 object-cover rounded-full border" />
        )}
        <input type="file" accept="image/*" onChange={handleLogoChange} disabled={uploading} />
      </div>

      <label className="block text-sm font-medium mb-1">Nombre del negocio</label>
      <input
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="w-full border rounded-lg px-3 py-2 mb-4"
      />

      <button
        onClick={saveSettings}
        disabled={saving}
        className="bg-fermento-red text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar ajustes"}
      </button>

      <div className="mt-8 bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-1">Soporte</h2>
        <p className="text-sm text-black/60 mb-3">
          ¿Tienes un problema con el sistema o necesitas un ajuste? Escríbenos directo por WhatsApp.
        </p>
        <a
          href={`https://wa.me/${SOPORTE_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-fermento-dark text-white text-sm px-4 py-2 rounded-lg hover:opacity-90"
        >
          Contactar soporte (Nova Studio)
        </a>
      </div>
    </div>
  );
}
