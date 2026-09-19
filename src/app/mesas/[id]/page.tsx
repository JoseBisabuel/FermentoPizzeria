"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDialog } from "@/components/DialogProvider";
import type { Category, Product, ProductPrice, RestaurantTable, Order, OrderItem } from "@/types/db";

type ProductWithPrices = Product & { product_prices: ProductPrice[] };

export default function TableOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const dialog = useDialog();

  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [printMode, setPrintMode] = useState<"comanda" | "factura" | null>(null);
  const [printPayload, setPrintPayload] = useState<OrderItem[]>([]);
  const [flashingPriceId, setFlashingPriceId] = useState<string | null>(null);

  const loadTableAndOrder = useCallback(async () => {
    const { data: t } = await supabase.from("restaurant_tables").select("*").eq("id", id).single();
    setTable(t);

    const { data: ord } = await supabase
      .from("orders")
      .select("*")
      .eq("table_id", id)
      .eq("status", "abierta")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setOrder(ord);

    if (ord) {
      const { data: its } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", ord.id)
        .order("created_at");
      setItems(its ?? []);
    } else {
      setItems([]);
    }
  }, [supabase, id]);

  useEffect(() => {
    loadTableAndOrder();
  }, [loadTableAndOrder]);

  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setCategories(data ?? []);
        if (data && data.length > 0) setActiveCategory(data[0].id);
      });
  }, [supabase]);

  useEffect(() => {
    if (!activeCategory) return;
    supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("category_id", activeCategory)
      .eq("active", true)
      .order("sort_order")
      .then(({ data }) => setProducts((data as ProductWithPrices[]) ?? []));
  }, [supabase, activeCategory]);

  // Realtime: refleja cambios hechos desde otro dispositivo en la misma mesa
  useEffect(() => {
    if (!order) return;
    const channel = supabase
      .channel(`order-items-${order.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_items", filter: `order_id=eq.${order.id}` },
        loadTableAndOrder
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, order, loadTableAndOrder]);

  const pendingItems = useMemo(() => items.filter((i) => i.status === "pendiente"), [items]);
  const sentItems = useMemo(() => items.filter((i) => i.status === "enviado"), [items]);
  const total = useMemo(
    () => items.reduce((acc, i) => acc + Number(i.unit_price) * i.quantity, 0),
    [items]
  );

  async function addToCart(product: ProductWithPrices, price: ProductPrice) {
    if (!order) return;
    const existing = pendingItems.find(
      (i) => i.product_id === product.id && i.size_label === price.size_label
    );
    if (existing) {
      await supabase
        .from("order_items")
        .update({ quantity: existing.quantity + 1 })
        .eq("id", existing.id);
    } else {
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        size_label: price.size_label,
        unit_price: price.price,
        quantity: 1,
        status: "pendiente",
      });
    }
    loadTableAndOrder();
  }

  function handleAddClick(product: ProductWithPrices, price: ProductPrice) {
    addToCart(product, price);
    setFlashingPriceId(price.id);
    setTimeout(() => {
      setFlashingPriceId((current) => (current === price.id ? null : current));
    }, 450);
  }

  async function changeQuantity(item: OrderItem, delta: number) {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await supabase.from("order_items").delete().eq("id", item.id);
    } else {
      await supabase.from("order_items").update({ quantity: newQty }).eq("id", item.id);
    }
    loadTableAndOrder();
  }

  async function removeItem(item: OrderItem) {
    await supabase.from("order_items").delete().eq("id", item.id);
    loadTableAndOrder();
  }

  async function confirmAndPrint() {
    if (pendingItems.length === 0) return;
    const now = new Date().toISOString();
    await supabase
      .from("order_items")
      .update({ status: "enviado", sent_at: now })
      .in(
        "id",
        pendingItems.map((i) => i.id)
      );
    setPrintPayload(pendingItems);
    setPrintMode("comanda");
    dialog.toast("Pedido enviado a cocina");
    await loadTableAndOrder();
  }

  async function closeTable() {
    if (!order) return;
    if (pendingItems.length > 0) {
      await dialog.alert({
        title: "Productos pendientes",
        message: "Confirma los productos pendientes antes de cerrar la mesa.",
      });
      return;
    }
    const wantsInvoice = await dialog.confirm({
      title: "Cerrar mesa",
      message: "¿Desea imprimir factura?",
      confirmText: "Sí, imprimir",
      cancelText: "No",
    });
    if (wantsInvoice) {
      setPrintPayload(items);
      setPrintMode("factura");
    }
    await supabase
      .from("orders")
      .update({ status: "cerrada", closed_at: new Date().toISOString(), invoice_printed: wantsInvoice })
      .eq("id", order.id);
    await supabase.from("restaurant_tables").update({ status: "libre" }).eq("id", id);
    if (!wantsInvoice) {
      dialog.toast("Mesa cerrada");
      router.push("/mesas");
    }
  }

  useEffect(() => {
    if (!printMode) return;
    const handleAfterPrint = () => {
      setPrintMode(null);
      if (table?.status === "libre") router.push("/mesas");
    };
    window.addEventListener("afterprint", handleAfterPrint);
    const t = setTimeout(() => window.print(), 150);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printMode]);

  if (!table) return <p className="text-sm text-black/50">Cargando mesa...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <button onClick={() => router.push("/mesas")} className="text-sm text-black/50 mb-1">
            ← Volver a mesas
          </button>
          <h1 className="text-2xl font-bold text-fermento-red">{table.name}</h1>
        </div>
        <button
          onClick={closeTable}
          className="bg-fermento-dark text-white text-sm px-4 py-2 rounded-lg"
        >
          Cerrar mesa
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menú */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium ${
                  activeCategory === c.id
                    ? "bg-fermento-red text-white"
                    : "bg-white text-black/70"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow p-3 flex flex-col gap-2">
                <div className="w-full h-24 rounded-lg bg-black/5 overflow-hidden flex-shrink-0">
                  {p.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <p className="text-xs text-black/50 line-clamp-2 mb-1">{p.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {p.product_prices?.map((price) => (
                      <button
                        key={price.id}
                        onClick={() => handleAddClick(p, price)}
                        className={`text-xs bg-fermento-cream border border-fermento-red/30 rounded-lg px-2 py-1 ${
                          flashingPriceId === price.id ? "tap-flash" : ""
                        }`}
                      >
                        {price.size_label} · ${Number(price.price).toLocaleString("es-CO")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-black/40">No hay productos activos en esta categoría.</p>
            )}
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white rounded-2xl shadow p-4 mb-8 h-fit lg:sticky lg:top-4">
          <h2 className="font-bold mb-3">Pedido</h2>

          {pendingItems.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase text-fermento-red font-semibold mb-1">Por confirmar</p>
              {pendingItems.map((item) => (
                <CartRow key={item.id} item={item} onChange={changeQuantity} onRemove={removeItem} />
              ))}
            </div>
          )}

          {sentItems.length > 0 && (
            <div className="mb-3">
              <p className="text-xs uppercase text-black/40 font-semibold mb-1">Enviado a cocina</p>
              {sentItems.map((item) => (
                <CartRow key={item.id} item={item} onChange={changeQuantity} onRemove={removeItem} muted />
              ))}
            </div>
          )}

          {items.length === 0 && <p className="text-sm text-black/40">Aún no hay productos.</p>}

          <div className="flex justify-between font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span>${total.toLocaleString("es-CO")}</span>
          </div>

          <button
            onClick={confirmAndPrint}
            disabled={pendingItems.length === 0}
            className="w-full mt-4 bg-fermento-red text-white font-semibold py-2.5 rounded-lg disabled:opacity-40"
          >
            Confirmar y enviar a cocina
          </button>
        </div>
      </div>

      {/* Comprobantes de impresión (ocultos en pantalla, visibles solo al imprimir) */}
      {printMode === "comanda" && (
        <div className="print-only font-mono text-black p-2" style={{ width: "72mm" }}>
          <p className="text-center font-bold text-base">FERMENTO</p>
          <p className="text-center text-xs">COMANDA COCINA</p>
          <p className="text-xs">Mesa: {table.name}</p>
          <p className="text-xs">Hora: {new Date().toLocaleString("es-CO")}</p>
          <hr className="my-1 border-black" />
          {printPayload.map((item) => (
            <p key={item.id} className="text-sm">
              {item.product_name} {item.size_label} x{item.quantity}
            </p>
          ))}
        </div>
      )}

      {printMode === "factura" && (
        <div className="print-only font-mono text-black p-2" style={{ width: "72mm" }}>
          <p className="text-center font-bold text-base">FERMENTO</p>
          <p className="text-center text-xs">Pizzería Artesanal Oculta</p>
          <p className="text-center text-xs">FACTURA DE VENTA</p>
          <p className="text-xs">Mesa: {table.name}</p>
          <p className="text-xs">Fecha: {new Date().toLocaleString("es-CO")}</p>
          <hr className="my-1 border-black" />
          {printPayload.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.product_name} {item.size_label} x{item.quantity}
              </span>
              <span>${(Number(item.unit_price) * item.quantity).toLocaleString("es-CO")}</span>
            </div>
          ))}
          <hr className="my-1 border-black" />
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL</span>
            <span>
              ${printPayload
                .reduce((acc, i) => acc + Number(i.unit_price) * i.quantity, 0)
                .toLocaleString("es-CO")}
            </span>
          </div>
          <p className="text-center text-xs mt-2">¡Gracias por su visita!</p>
        </div>
      )}
    </div>
  );
}

function CartRow({
  item,
  onChange,
  onRemove,
  muted,
}: {
  item: OrderItem;
  onChange: (item: OrderItem, delta: number) => void;
  onRemove: (item: OrderItem) => void;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 py-1 text-sm ${muted ? "opacity-60" : ""}`}>
      <div className="min-w-0">
        <p className="truncate">
          {item.product_name} <span className="text-black/50">({item.size_label})</span>
        </p>
        <p className="text-xs text-black/40">
          ${Number(item.unit_price).toLocaleString("es-CO")} c/u
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onChange(item, -1)} className="w-6 h-6 rounded bg-black/5">
          −
        </button>
        <span className="w-5 text-center">{item.quantity}</span>
        <button onClick={() => onChange(item, 1)} className="w-6 h-6 rounded bg-black/5">
          +
        </button>
        <button onClick={() => onRemove(item)} className="ml-1 text-black/30 hover:text-fermento-red">
          ✕
        </button>
      </div>
    </div>
  );
}
