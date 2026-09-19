"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDialog } from "@/components/DialogProvider";
import type { RestaurantTable } from "@/types/db";

export default function AdminMesasPage() {
  const supabase = createClient();
  const dialog = useDialog();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [newName, setNewName] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.from("restaurant_tables").select("*").order("sort_order");
    setTables(data ?? []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function addTable() {
    if (!newName.trim()) return;
    await supabase
      .from("restaurant_tables")
      .insert({ name: newName.trim(), sort_order: tables.length + 1 });
    setNewName("");
    load();
  }

  async function removeTable(id: string) {
    const confirmed = await dialog.confirm({
      title: "Eliminar mesa",
      message: "¿Eliminar esta mesa?",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) {
      await dialog.alert("No se puede eliminar una mesa con pedidos asociados.");
    } else {
      dialog.toast("Mesa eliminada");
    }
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-fermento-red mb-6">Mesas</h1>

      <div className="flex gap-2 mb-6 max-w-sm">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej: Mesa 9"
          className="flex-1 border rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={addTable} className="bg-fermento-red text-white px-4 rounded-lg text-sm">
          Agregar
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tables.map((t) => (
          <div key={t.id} className="bg-white rounded-xl shadow p-3 text-center">
            <p className="font-semibold">{t.name}</p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                t.status === "libre" ? "bg-green-100 text-green-700" : "bg-fermento-red/10 text-fermento-red"
              }`}
            >
              {t.status === "libre" ? "Libre" : "Ocupada"}
            </span>
            <button
              onClick={() => removeTable(t.id)}
              className="block mx-auto mt-2 text-xs text-black/40 hover:text-fermento-red"
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
