"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDialog } from "@/components/DialogProvider";
import type { Order, OrderItem, RestaurantTable } from "@/types/db";

type OrderWithExtras = Order & {
  restaurant_tables: Pick<RestaurantTable, "name"> | null;
  order_items: OrderItem[];
};

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // el navegador puede bloquear audio sin interacción previa; se ignora
  }
}

function elapsedLabel(fromISO: string) {
  const mins = Math.floor((Date.now() - new Date(fromISO).getTime()) / 60000);
  if (mins < 1) return "recién llegó";
  if (mins === 1) return "1 min";
  return `${mins} min`;
}

export default function DespachoPage() {
  const supabase = createClient();
  const dialog = useDialog();
  const [orders, setOrders] = useState<OrderWithExtras[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const seenItemIds = useRef<Set<string> | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, restaurant_tables(name), order_items(*)")
      .eq("status", "abierta")
      .eq("archivada_cocina", false);

    const list = ((data as OrderWithExtras[] | null) ?? [])
      .map((o) => ({ ...o, order_items: o.order_items.filter((i) => i.status === "enviado") }))
      .filter((o) => o.order_items.length > 0)
      .sort((a, b) => {
        const aMin = Math.min(...a.order_items.map((i) => new Date(i.sent_at ?? a.opened_at).getTime()));
        const bMin = Math.min(...b.order_items.map((i) => new Date(i.sent_at ?? b.opened_at).getTime()));
        return aMin - bMin;
      });

    const currentIds = new Set(list.flatMap((o) => o.order_items.map((i) => i.id)));
    if (seenItemIds.current) {
      const newIds = [...currentIds].filter((id) => !seenItemIds.current!.has(id));
      if (newIds.length > 0) {
        dialog.toast("Nuevo pedido para preparar");
        playBeep();
      }
    }
    seenItemIds.current = currentIds;

    setOrders(list);
    setLoading(false);
  }, [supabase, dialog]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("despacho-order-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  async function toggleItem(item: OrderItem, checked: boolean, tableName: string) {
    const now = new Date().toISOString();
    await supabase
      .from("order_items")
      .update({ despachado: checked, despachado_at: checked ? now : null })
      .eq("id", item.id);

    if (checked) {
      const { data: remaining } = await supabase
        .from("order_items")
        .select("despachado")
        .eq("order_id", item.order_id)
        .eq("status", "enviado");
      const allDone = !!remaining?.length && remaining.every((r) => r.despachado);
      if (allDone) {
        const wantsArchive = await dialog.confirm({
          title: "Archivar mesa",
          message: `Ya despachaste todos los productos de ${tableName}. ¿Archivar mesa?`,
          confirmText: "Sí, archivar",
          cancelText: "Aún no",
        });
        if (wantsArchive) {
          await supabase
            .from("orders")
            .update({ archivada_cocina: true, archivada_cocina_at: now })
            .eq("id", item.order_id);
        }
      }
    }
    load();
  }

  async function archiveOrder(order: OrderWithExtras) {
    await supabase
      .from("orders")
      .update({ archivada_cocina: true, archivada_cocina_at: new Date().toISOString() })
      .eq("id", order.id);
    load();
  }

  if (loading) return <p className="text-sm text-black/50">Cargando pedidos...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-fermento-red mb-6">Despacho</h1>

      {orders.length === 0 && (
        <p className="text-sm text-black/40">No hay pedidos pendientes por preparar.</p>
      )}

      <div className="space-y-3">
        {orders.map((order) => {
          const tableName = order.restaurant_tables?.name ?? "Mesa";
          const startedAt = order.order_items.reduce(
            (min, i) => (i.sent_at && i.sent_at < min ? i.sent_at : min),
            order.order_items[0]?.sent_at ?? order.opened_at
          );
          const allDone = order.order_items.every((i) => i.despachado);
          const isOpen = expanded === order.id;

          return (
            <div key={order.id} className="bg-white rounded-2xl shadow overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : order.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <p className="font-bold">{tableName}</p>
                  <p className="text-xs text-black/40">
                    Lleva {elapsedLabel(startedAt)} · {order.order_items.length} producto
                    {order.order_items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {allDone && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                      Todo listo
                    </span>
                  )}
                  <span className="text-black/30">{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-2">
                  {order.order_items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 text-sm ${item.despachado ? "opacity-50" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={item.despachado}
                        disabled={!item.requiere_preparacion}
                        onChange={(e) => toggleItem(item, e.target.checked, tableName)}
                        className="w-5 h-5"
                      />
                      <span className={item.despachado ? "line-through" : ""}>
                        {item.product_name} ({item.size_label}) x{item.quantity}
                      </span>
                      {!item.requiere_preparacion && (
                        <span className="text-xs text-black/30">auto</span>
                      )}
                    </label>
                  ))}

                  {allDone && (
                    <button
                      onClick={() => archiveOrder(order)}
                      className="mt-2 bg-fermento-dark text-white text-sm px-4 py-2 rounded-lg"
                    >
                      Archivar mesa
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
