"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/types/db";

export default function AjustesPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [whatsapp, setWhatsapp] = useState("");
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
          setWhatsapp(data.whatsapp_number ?? "");
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
      alert("Error subiendo el logo");
    }
    setUploading(false);
  }

  async function saveSettings() {
    setSaving(true);
    await supabase
      .from("settings")
      .update({ whatsapp_number: whatsapp, business_name: businessName })
      .eq("id", 1);
    setSaving(false);
    alert("Ajustes guardados");
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

      <label className="block text-sm font-medium mb-1">WhatsApp de contacto (código país + número)</label>
      <input
        value={whatsapp}
        onChange={(e) => setWhatsapp(e.target.value)}
        placeholder="573193034610"
        className="w-full border rounded-lg px-3 py-2 mb-4"
      />

      <button
        onClick={saveSettings}
        disabled={saving}
        className="bg-fermento-red text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Guardar ajustes"}
      </button>
    </div>
  );
}
