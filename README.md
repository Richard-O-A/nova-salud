# Botica Nova Salud

Sistema web de gestión de inventario y ventas para la botica "Nova Salud".
Trabajo final del curso Fullstack Developer Software (SENATI).

**Autor:** Richard Orejon Antezana · PIAD-527 · HT-04

## Módulos

- **Almacén:** registro de productos, ingreso de mercadería y alertas de stock bajo.
- **Ventas:** registro de ventas con descuento automático del stock.
- **Kardex:** historial de entradas y salidas de cada producto, con su saldo.
- **Resumen:** ingresos por ventas, unidades que entran y salen, productos más vendidos y alertas de reposición.

## Tecnologías

Front-end: JavaScript (Vite, CSS) · Back-end: Node.js + Express · Base de datos: PostgreSQL (Supabase) · Seguridad: inicio de sesión con JWT y contraseñas cifradas (bcrypt).

## Estructura

```
index.html          página base
src/                front-end (api.js, components/, pages/, css/)
server/             back-end (app.js, routes/, controllers/, middleware/)
database/schema.sql tablas de la base de datos
```

## Ejecutar en local

1. Instalar dependencias: `npm install`
2. Crear la base de datos: ejecutar `database/schema.sql` en el SQL Editor de Supabase.
3. Crear el archivo `.env` (guía en `.env.example`) con `DATABASE_URL` y `JWT_SECRET`.
4. Cargar datos de ejemplo y el usuario administrador: `npm run seed`
5. Iniciar el sistema: `npm run dev` y abrir http://localhost:5173

Usuario de prueba: `admin@novasalud.com` / `admin123`

## Publicación

`npm run build` genera la carpeta `dist`, y `npm start` hace que el mismo servidor Node.js entregue la página y la API (listo para publicar en Render).
