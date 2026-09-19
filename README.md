# Fermento — Sistema de pedidos y mesas

Aplicación web para la pizzería **Fermento**: gestión de productos con fotos y precios por
presentación, mesas con carrito por categorías, comanda a impresora térmica, factura opcional
al cerrar mesa, y reportes de ventas por día. Dos perfiles: **Admin** y **Mesas (servicio)**.

Construido con **Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase**, listo para
desplegar en **Vercel**.

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (elige la región más
   cercana a Colombia, ej. `sa-east-1`).
2. En **Project Settings → API** copia:
   - `Project URL` → variable `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → variable `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. En **SQL Editor**, ejecuta en este orden:
   1. El contenido de [`supabase/schema.sql`](supabase/schema.sql) (tablas, roles, seguridad).
   2. El contenido de [`supabase/seed.sql`](supabase/seed.sql) (menú inicial de Fermento).

## 2. Crear los dos usuarios (Admin y Servicio/Mesas)

Ve a **Authentication → Users → Add user** y crea manualmente (marca "Auto Confirm User"):

| Usuario (login en la app) | Email real en Supabase        | Password       | Rol final |
|---------------------------|--------------------------------|----------------|-----------|
| `adminfermento`            | `adminfermento@fermento.local` | `admin2026&`    | admin     |
| `serviciofermento`         | `serviciofermento@fermento.local` | `servicio2026$` | mesero |

> La app internamente arma el correo como `usuario@fermento.local`, así el mesero solo
> escribe `serviciofermento` en la pantalla de login, no un correo.

Al crear cada usuario, un trigger crea automáticamente su fila en `profiles` con rol `mesero`
por defecto. Para dejar el usuario admin como administrador, corre en el SQL Editor:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'adminfermento@fermento.local');
```

El usuario `serviciofermento` queda como `mesero` (rol correcto por defecto, no puede crear,
editar ni eliminar productos, ni ver reportes).

### Usuario de cocina/despacho (opcional)

Existe un tercer rol, `cocina`, que solo ve `/despacho`: la cola de pedidos enviados a cocina,
para marcarlos como despachados sin acceso a mesas ni al panel admin. Si el proyecto ya
existía antes de esta función, primero corre la migración al final de
[`supabase/schema.sql`](supabase/schema.sql) (el bloque "MIGRACIÓN: cola de despacho / cocina").

Para crear el usuario: repite el paso de **Authentication → Users → Add user** (ej.
`cocinafermento@fermento.local`) y luego:

```sql
update profiles set role = 'cocina'
where id = (select id from auth.users where email = 'cocinafermento@fermento.local');
```

## 3. Variables de entorno locales

Copia `.env.local.example` a `.env.local` y completa con tus datos del paso 1:

```bash
cp .env.local.example .env.local
```

## 4. Instalar y correr en desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — te llevará a `/login`.

## 5. Cargar el logo y las fotos de los productos

- Entra como **admin** → **Ajustes** → sube el logo de Fermento (queda visible en el login,
  en el panel admin y en la vista de mesas).
- Entra como **admin** → **Productos** → edita cada producto para subirle su foto real,
  ajustar descripción y precios. El menú inicial ya trae las categorías **Pizzas**,
  **Panzerottis**, **Lasañas**, **Entradas**, **Especiales** y **Bebidas** con los productos
  de la carta que enviaste (Panzerottis, Lasañas y Entradas quedaron vacías, listas para
  que agregues sus productos y fotos).

## 6. Impresión de comanda y factura

- Al **confirmar** productos en una mesa, se abre el diálogo de impresión del navegador con
  un ticket que solo trae: nombre del producto, presentación, cantidad, mesa y hora
  (sin precios ni descripciones), listo para tu impresora térmica.
- Al **cerrar mesa**, se pregunta "¿Desea imprimir factura?"; si aceptas, se imprime un
  comprobante simple con los productos, precios y total.
- Esta primera versión imprime usando el diálogo de impresión del navegador (`window.print`),
  apuntando por defecto a la impresora térmica que tengas configurada como predeterminada en
  Windows (58mm/80mm). Si tu impresora térmica es de red (ESC/POS) o USB directo y quieres
  impresión 100% automática sin diálogo, es un ajuste adicional que podemos hacer después
  (te lo señalé como pendiente a resolver con la impresora real).

## 7. Reportes

**Admin → Reportes**: elige un rango de fechas y genera el listado de productos vendidos
(cantidad, precio unitario y total por producto/presentación), con total general. Se basa en
los productos que fueron **confirmados/enviados a cocina**.

## 8. Subir a Git y desplegar en Vercel

```bash
git init
git add .
git commit -m "Fermento: sistema de pedidos y mesas"
```

Sube el repo a GitHub y luego en [vercel.com](https://vercel.com):

1. **Add New Project** → importa el repositorio.
2. En **Environment Variables** agrega `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (los mismos del paso 1).
3. Deploy.

## Estructura del proyecto

```
src/app/login          → pantalla de login (admin / mesas)
src/app/admin          → panel admin: productos, mesas, reportes, ajustes
src/app/mesas          → vista de mesas y pantalla de pedido por mesa
src/app/despacho       → cola de pedidos para cocina (rol cocina)
supabase/schema.sql    → tablas, roles y seguridad (RLS)
supabase/seed.sql      → menú inicial de Fermento
```

---
Desarrollado por **Nova Studio**.
