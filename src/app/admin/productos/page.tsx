"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useDialog } from "@/components/DialogProvider";
import type { Category, Product, ProductPrice } from "@/types/db";

type ProductWithPrices = Product & { product_prices: ProductPrice[] };

type PriceDraft = { id?: string; size_label: string; price: string };

export default function ProductosPage() {
  const supabase = createClient();
  const dialog = useDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductWithPrices | "new" | null>(null);

  const loadCategories = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data ?? []);
    if (data && data.length > 0 && !selectedCategory) {
      setSelectedCategory(data[0].id);
    }
  }, [supabase, selectedCategory]);

  const loadProducts = useCallback(async () => {
    if (!selectedCategory) return;
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*, product_prices(*)")
      .eq("category_id", selectedCategory)
      .order("sort_order");
    setProducts((data as ProductWithPrices[]) ?? []);
    setLoading(false);
  }, [supabase, selectedCategory]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    await supabase
      .from("categories")
      .insert({ name: newCategoryName.trim(), sort_order: categories.length + 1 });
    setNewCategoryName("");
    loadCategories();
  }

  async function deleteCategory(id: string) {
    const confirmed = await dialog.confirm({
      title: "Eliminar categoría",
      message: "¿Eliminar esta categoría? Debe estar vacía de productos.",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      await dialog.alert("No se pudo eliminar: mueve o elimina primero sus productos.");
    } else {
      dialog.toast("Categoría eliminada");
    }
    loadCategories();
  }

  async function toggleActive(product: ProductWithPrices) {
    await supabase.from("products").update({ active: !product.active }).eq("id", product.id);
    loadProducts();
  }

  async function deleteProduct(id: string) {
    const confirmed = await dialog.confirm({
      title: "Eliminar producto",
      message: "¿Eliminar este producto definitivamente?",
      confirmText: "Eliminar",
    });
    if (!confirmed) return;
    await supabase.from("products").delete().eq("id", id);
    dialog.toast("Producto eliminado");
    loadProducts();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-fermento-red mb-6">Productos</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Categorías */}
        <div className="md:col-span-1">
          <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-fermento-dark/60">
            Categorías
          </h2>
          <ul className="space-y-1 mb-4">
            {categories.map((cat) => (
              <li key={cat.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm ${
                    selectedCategory === cat.id
                      ? "bg-fermento-red text-white"
                      : "bg-white hover:bg-black/5"
                  }`}
                >
                  {cat.name}
                </button>
                <button
                  onClick={() => deleteCategory(cat.id)}
                  className="text-black/30 hover:text-fermento-red px-1"
                  title="Eliminar categoría"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nueva categoría"
              className="flex-1 border rounded-lg px-2 py-1 text-sm"
            />
            <button
              onClick={addCategory}
              className="bg-fermento-dark text-white text-sm px-3 rounded-lg"
            >
              +
            </button>
          </div>
        </div>

        {/* Productos */}
        <div className="md:col-span-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-fermento-dark/60">
              Productos
            </h2>
            <button
              disabled={!selectedCategory}
              onClick={() => setEditingProduct("new")}
              className="bg-fermento-red text-white text-sm px-4 py-2 rounded-lg disabled:opacity-40"
            >
              + Agregar producto
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-black/50">Cargando...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow p-3 flex flex-col gap-2">
                  <div className="w-full h-24 rounded-lg bg-black/5 overflow-hidden flex-shrink-0">
                    {p.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold truncate">{p.name}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.active ? "bg-green-100 text-green-700" : "bg-black/10 text-black/50"
                        }`}
                      >
                        {p.active ? "Activo" : "Oculto"}
                      </span>
                    </div>
                    <p className="text-xs text-black/50 line-clamp-2">{p.description}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.product_prices?.map((pr) => (
                        <span key={pr.id} className="text-xs bg-fermento-cream border px-1.5 py-0.5 rounded">
                          {pr.size_label}: ${Number(pr.price).toLocaleString("es-CO")}
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-2 text-xs">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="text-fermento-red font-medium"
                      >
                        Editar
                      </button>
                      <button onClick={() => toggleActive(p)} className="text-black/50">
                        {p.active ? "Ocultar" : "Activar"}
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="text-black/50">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <p className="text-sm text-black/40">No hay productos en esta categoría todavía.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {editingProduct && selectedCategory && (
        <ProductModal
          product={editingProduct === "new" ? null : editingProduct}
          categoryId={selectedCategory}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            loadProducts();
          }}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  categoryId,
  onClose,
  onSaved,
}: {
  product: ProductWithPrices | null;
  categoryId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const dialog = useDialog();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? "");
  const [prices, setPrices] = useState<PriceDraft[]>(
    product?.product_prices?.length
      ? product.product_prices.map((p) => ({ id: p.id, size_label: p.size_label, price: String(p.price) }))
      : [{ size_label: "Único", price: "" }]
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function updatePrice(index: number, field: keyof PriceDraft, value: string) {
    setPrices((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function addPriceRow() {
    setPrices((prev) => [...prev, { size_label: "", price: "" }]);
  }

  function removePriceRow(index: number) {
    setPrices((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } else {
      await dialog.alert("Error subiendo la imagen");
    }
    setUploading(false);
  }

  async function handleSave() {
    if (!name.trim() || prices.some((p) => !p.size_label.trim() || !p.price)) {
      await dialog.alert("Completa el nombre y todas las presentaciones con su precio.");
      return;
    }
    setSaving(true);

    let productId = product?.id;

    if (product) {
      await supabase
        .from("products")
        .update({ name, description, image_url: imageUrl || null, updated_at: new Date().toISOString() })
        .eq("id", product.id);
    } else {
      const { data, error } = await supabase
        .from("products")
        .insert({ category_id: categoryId, name, description, image_url: imageUrl || null })
        .select()
        .single();
      if (error || !data) {
        await dialog.alert("Error creando el producto");
        setSaving(false);
        return;
      }
      productId = data.id;
    }

    const existingIds = product?.product_prices?.map((p) => p.id) ?? [];
    const keptIds = prices.filter((p) => p.id).map((p) => p.id);
    const removedIds = existingIds.filter((id) => !keptIds.includes(id));
    if (removedIds.length > 0) {
      await supabase.from("product_prices").delete().in("id", removedIds);
    }

    for (const [i, p] of prices.entries()) {
      if (p.id) {
        await supabase
          .from("product_prices")
          .update({ size_label: p.size_label, price: Number(p.price), sort_order: i })
          .eq("id", p.id);
      } else {
        await supabase
          .from("product_prices")
          .insert({ product_id: productId, size_label: p.size_label, price: Number(p.price), sort_order: i });
      }
    }

    setSaving(false);
    dialog.toast(product ? "Producto actualizado" : "Producto creado");
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{product ? "Editar producto" : "Nuevo producto"}</h2>

        <label className="block text-sm font-medium mb-1">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3"
        />

        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3"
          rows={2}
        />

        <label className="block text-sm font-medium mb-1">Foto</label>
        <div className="flex items-center gap-3 mb-3">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="w-16 h-16 object-cover rounded-lg" />
          )}
          <input type="file" accept="image/*" onChange={handleImageChange} disabled={uploading} />
        </div>

        <label className="block text-sm font-medium mb-1">Presentaciones y precios</label>
        <div className="space-y-2 mb-2">
          {prices.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder="Ej: 20cm"
                value={p.size_label}
                onChange={(e) => updatePrice(i, "size_label", e.target.value)}
                className="flex-1 border rounded-lg px-2 py-1 text-sm"
              />
              <input
                placeholder="Precio"
                type="number"
                value={p.price}
                onChange={(e) => updatePrice(i, "price", e.target.value)}
                className="w-28 border rounded-lg px-2 py-1 text-sm"
              />
              <button onClick={() => removePriceRow(i)} className="text-black/40 px-2">
                ✕
              </button>
            </div>
          ))}
        </div>
        <button onClick={addPriceRow} className="text-xs text-fermento-red font-medium mb-4">
          + Agregar presentación
        </button>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-4 py-2 rounded-lg text-sm bg-fermento-red text-white disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
