-- ============================================================
-- FERMENTO - Datos iniciales (categorías, productos y precios)
-- Ejecutar DESPUÉS de schema.sql
-- ============================================================

-- Categorías
insert into categories (name, sort_order) values
  ('Pizzas', 1),
  ('Panzerottis', 2),
  ('Lasañas', 3),
  ('Entradas', 4),
  ('Especiales', 5),
  ('Bebidas', 6);

-- Mesas (ajusta la cantidad a tu local)
insert into restaurant_tables (name, sort_order) values
  ('Mesa 1', 1), ('Mesa 2', 2), ('Mesa 3', 3), ('Mesa 4', 4),
  ('Mesa 5', 5), ('Mesa 6', 6), ('Mesa 7', 7), ('Mesa 8', 8),
  ('Domicilio', 99);

-- ---------- PIZZAS ----------
do $$
declare
  cat_id uuid;
  prod_id uuid;
begin
  select id into cat_id from categories where name = 'Pizzas';

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Hawaiana', 'Salsa Napolitana, Mozzarella, Piña, Tocineta', 1) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 17000, 1), (prod_id, '30cm', 34000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Tropical', 'Salsa Napolitana, Mozzarella, Piña, Ciruela pasa', 2) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 17000, 1), (prod_id, '30cm', 34000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Pollo y champiñón', 'Salsa Napolitana, Mozzarella, Pollo desmechado, Champiñón', 3) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 18000, 1), (prod_id, '30cm', 35000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Pepperoni', 'Salsa Napolitana, Mozzarella, Pepperoni', 4) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 19000, 1), (prod_id, '30cm', 36000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Salame', 'Salsa Napolitana, Mozzarella, Salame', 5) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 20000, 1), (prod_id, '30cm', 38000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, '3 Quesos', 'Salsa Napolitana, Mozzarella, Holandés, Pecorinno', 6) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 22000, 1), (prod_id, '30cm', 38000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Especial', 'Salsa Napolitana, Mozzarella, Pepperonni, Salame, Tocineta', 7) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 21000, 1), (prod_id, '30cm', 39000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Bolognesa', 'Salsa Napolitana, Mozzarella, Carne bolognesa', 8) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 22000, 1), (prod_id, '30cm', 42000, 2);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Fermento', 'Salsa Napolitana, Mozzarella, Carne de chorizo, peperonata, cebolla encurtida', 9) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, '20cm', 23000, 1), (prod_id, '30cm', 43000, 2);
end $$;

-- ---------- PANZEROTTIS (categoría propia, no un tamaño de pizza) ----------
do $$
declare
  cat_id uuid;
  prod_id uuid;
begin
  select id into cat_id from categories where name = 'Panzerottis';

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Hawaiano', 'Salsa Napolitana, Mozzarella, Piña, Tocineta', 1) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 18000, 1);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Tropical', 'Salsa Napolitana, Mozzarella, Piña, Ciruela pasa', 2) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 18000, 1);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Pollo y champiñón', 'Salsa Napolitana, Mozzarella, Pollo desmechado, Champiñón', 3) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 19000, 1);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Pepperoni', 'Salsa Napolitana, Mozzarella, Pepperoni', 4) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 20000, 1);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Salame', 'Salsa Napolitana, Mozzarella, Salame', 5) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 21000, 1);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Especial', 'Salsa Napolitana, Mozzarella, Pepperonni, Salame, Tocineta', 6) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 22000, 1);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Bolognesa', 'Salsa Napolitana, Mozzarella, Carne bolognesa', 7) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 23000, 1);

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Panzerotti Fermento', 'Salsa Napolitana, Mozzarella, Carne de chorizo, peperonata, cebolla encurtida', 8) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values (prod_id, 'Único', 24000, 1);
end $$;

-- ---------- BEBIDAS ----------
do $$
declare
  cat_id uuid;
  prod_id uuid;
begin
  select id into cat_id from categories where name = 'Bebidas';

  insert into products (category_id, name, description, sort_order) values
    (cat_id, 'Soda saborizada', 'Tamarindo, Rosas, Frutos Rojos, Naranja Piña, Manzana verde, Arándanos, Miel y Limón', 1) returning id into prod_id;
  insert into product_prices (product_id, size_label, price, sort_order) values
    (prod_id, 'Único', 12000, 1);
end $$;

-- Nota: Lasañas y Entradas quedaron como categorías vacías
-- listas para que el admin agregue los productos desde el panel.
