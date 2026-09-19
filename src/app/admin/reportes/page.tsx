"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx";

type ReportRow = {
  product_name: string;
  size_label: string;
  quantity: number;
  unit_price: number;
  total: number;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const supabase = createClient();
  const [from, setFrom] = useState(todayStr());
  const [to, setTo] = useState(todayStr());
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);

  async function runReport() {
    setLoading(true);
    const fromDate = new Date(`${from}T00:00:00`).toISOString();
    const toDate = new Date(`${to}T23:59:59`).toISOString();

    const { data, error } = await supabase
      .from("order_items")
      .select("product_name, size_label, unit_price, quantity, status, created_at")
      .eq("status", "enviado")
      .gte("created_at", fromDate)
      .lte("created_at", toDate);

    if (error || !data) {
      setLoading(false);
      setSearched(true);
      setRows([]);
      return;
    }

    const grouped = new Map<string, ReportRow>();
    for (const item of data) {
      const key = `${item.product_name}__${item.size_label}__${item.unit_price}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total += item.quantity * Number(item.unit_price);
      } else {
        grouped.set(key, {
          product_name: item.product_name,
          size_label: item.size_label,
          unit_price: Number(item.unit_price),
          quantity: item.quantity,
          total: item.quantity * Number(item.unit_price),
        });
      }
    }

    const list = Array.from(grouped.values()).sort((a, b) =>
      a.product_name.localeCompare(b.product_name)
    );
    setRows(list);
    setGrandTotal(list.reduce((acc, r) => acc + r.total, 0));
    setLoading(false);
    setSearched(true);
  }

  function exportToExcel() {
    const data = rows.map((r) => ({
      Producto: r.product_name,
      Presentación: r.size_label,
      Cantidad: r.quantity,
      "Precio unidad": r.unit_price,
      Total: r.total,
    }));
    data.push({
      Producto: "TOTAL GENERAL",
      Presentación: "",
      Cantidad: "" as unknown as number,
      "Precio unidad": "" as unknown as number,
      Total: grandTotal,
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `fermento-reporte-${from}_a_${to}.xlsx`);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-fermento-red mb-6">Reportes de ventas</h1>

      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium mb-1">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={runReport}
          disabled={loading}
          className="bg-fermento-red text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? "Consultando..." : "Generar reporte"}
        </button>
        {rows.length > 0 && (
          <button
            onClick={exportToExcel}
            className="bg-fermento-dark text-white px-4 py-2 rounded-lg text-sm hover:opacity-90"
          >
            Descargar Excel
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-fermento-dark text-fermento-cream">
              <tr>
                <th className="text-left px-4 py-2">Producto</th>
                <th className="text-left px-4 py-2">Presentación</th>
                <th className="text-right px-4 py-2">Cantidad</th>
                <th className="text-right px-4 py-2">Precio unidad</th>
                <th className="text-right px-4 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{r.product_name}</td>
                  <td className="px-4 py-2">{r.size_label}</td>
                  <td className="px-4 py-2 text-right">{r.quantity}</td>
                  <td className="px-4 py-2 text-right">${r.unit_price.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    ${r.total.toLocaleString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-fermento-cream font-bold">
                <td className="px-4 py-2" colSpan={4}>
                  Total general
                </td>
                <td className="px-4 py-2 text-right">${grandTotal.toLocaleString("es-CO")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {!loading && searched && rows.length === 0 && (
        <p className="text-sm text-black/50">No hay ventas registradas en ese rango de fechas.</p>
      )}

      {!loading && !searched && (
        <p className="text-sm text-black/40">Selecciona un rango de fechas y genera el reporte.</p>
      )}
    </div>
  );
}
