export type UserRole = "admin" | "mesero";

export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type ProductPrice = {
  id: string;
  product_id: string;
  size_label: string;
  price: number;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  active: boolean;
  sort_order: number;
  product_prices?: ProductPrice[];
};

export type TableStatus = "libre" | "ocupada";

export type RestaurantTable = {
  id: string;
  name: string;
  status: TableStatus;
  sort_order: number;
};

export type OrderStatus = "abierta" | "cerrada";

export type Order = {
  id: string;
  table_id: string;
  status: OrderStatus;
  opened_at: string;
  closed_at: string | null;
  invoice_printed: boolean;
};

export type ItemStatus = "pendiente" | "enviado";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  size_label: string;
  unit_price: number;
  quantity: number;
  status: ItemStatus;
  sent_at: string | null;
  created_at: string;
};

export type Settings = {
  id: number;
  logo_url: string | null;
  whatsapp_number: string | null;
  business_name: string | null;
};
