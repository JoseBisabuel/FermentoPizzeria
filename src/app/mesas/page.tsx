"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RestaurantTable } from "@/types/db";

export default function MesasPage() {
  const supabase = createClient();
  const router = useRouter();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.from("restaurant_tables").select("*").order("sort_order");
    setTables(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("tables-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "restaurant_tables" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  async function openTable(table: RestaurantTable) {
    if (table.status === "libre") {
      await supabase.from("restaurant_tables").update({ status: "ocupada" }).eq("id", table.id);
      await supabase.from("orders").insert({ table_id: table.id, status: "abierta" });
    }
    router.push(`/mesas/${table.id}`);
  }

  if (loading) return <p className="text-sm text-black/50">Cargando mesas...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-fermento-red mb-6">Mesas</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {tables.map((t) => (
          <button
            key={t.id}
            onClick={() => openTable(t)}
            className={`rounded-2xl p-6 text-center shadow transition ${
              t.status === "libre"
                ? "bg-white hover:bg-green-50 border-2 border-green-200"
                : "bg-fermento-red text-white hover:opacity-90"
            }`}
          >
            <p className="font-bold text-lg">{t.name}</p>
            <p className="text-xs mt-1 uppercase tracking-wide opacity-80">
              {t.status === "libre" ? "Libre" : "Ocupada"}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
