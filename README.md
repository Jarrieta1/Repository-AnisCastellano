# Anis Castellano Tienda Cosmetic

Catálogo de productos capilares con **Vue 3 + Vite** y servidor **Express**.

## Requisitos

- Node.js 20 o superior

## Correr en local

Instala las dependencias una sola vez:

```bash
npm install
```

Terminal 1 (API + imágenes, puerto 3000):

```bash
npm run dev:api
```

Terminal 2 (frontend con recarga automática, puerto 5173):

```bash
npm run dev
```

Abre **http://localhost:5173**.

### Como producción (un solo puerto)

```bash
npm run build     # compila el frontend en dist/
npm start         # http://localhost:3000 (frontend + API + imágenes)
```

## Estructura

```
├── src/                    # Frontend Vue 3
│   ├── components/         # Navbar, tarjetas, filtros, modal, carrito, pie
│   ├── services/           # productService.js (GET /api/productos)
│   ├── utils/              # formato de precio, placeholder, estrellas
│   ├── assets/styles.css   # Estilos (paleta del logo)
│   ├── App.vue             # Estado y vistas
│   └── main.js
├── public/favicon.svg      # Logo AC de la tienda
├── index.html              # Punto de entrada de Vite
├── vite.config.js          # Proxy de /api e /img hacia :3000
├── api/index.js            # Servidor Express + API /api/productos
├── productos_capilares.csv # Fuente de productos
├── img/                    # Fotos de productos (WebP)
└── vercel.json             # Configuración de Vercel (build de Vite + lambda)
```

## Productos

Los productos se cargan desde `productos_capilares.csv` con columnas:
`Título, Descripción, Precio`.

- **API**: `GET /api/productos` devuelve el catálogo en JSON (Express lo parsea).

### Imágenes

Coloca tus fotos en `img/` con el *slug* del nombre en minúsculas y sin tildes:

| Producto | Archivo |
|---|---|
| Kit Capilar Energy - Naissant | `img/kit-capilar-energy-naissant.webp` |

Si falta la imagen, se genera un placeholder automático.

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. Importa el repo en [vercel.com/new](https://vercel.com/new).
3. Framework: **Other**; build y salida ya definidos en `vercel.json`
   (`npm run build` → carpeta `dist/`).
4. Deploy. El frontend se sirve desde la red de Vercel; `/api` e `/img`
   pasan por la lambda de Express.

Con el CLI:

```bash
npx vercel
npx vercel --prod
```
