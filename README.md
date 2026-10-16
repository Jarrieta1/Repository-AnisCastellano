# Anis Castellano Tienda Cosmetic

Catálogo de productos capilares con **Vue 3 + Vite** y servidor **Express**.

## Requisitos

- Node.js 20 o superior

## Correr en local

La API y las imágenes se sirven en el puerto 3000; el frontend de desarrollo en el 5173 (con proxy hacia la API).

```bash
npm install            # dependencias de la API (raíz)
cd frontend-vue && npm install   # dependencias del frontend
```

Terminal 1 (API + imágenes):

```bash
npm start              # http://localhost:3000
```

Terminal 2 (frontend con recarga automática):

```bash
cd frontend-vue
npm run dev            # http://localhost:5173
```

Abre **http://localhost:5173**.

### Como producción (un solo puerto)

Compila el frontend y deja que Express lo sirva:

```bash
cd frontend-vue && npm run build
cd .. && npm start     # http://localhost:3000 (frontend + API + imágenes)
```

## Estructura

```
├── frontend-vue/               # Frontend Vue 3 + Vite
│   ├── src/
│   │   ├── components/         # Navbar, tarjetas, filtros, modal, carrito, pie
│   │   ├── services/           # productService.js (GET /api/productos)
│   │   ├── utils/              # formato de precio, placeholder, estrellas
│   │   ├── assets/styles.css   # Estilos (paleta del logo)
│   │   ├── App.vue             # Estado y vistas
│   │   └── main.js
│   ├── public/favicon.svg      # Logo AC de la tienda
│   └── vite.config.js          # Proxy de /api e /img hacia :3000
├── api/index.js                # Servidor Express + API /api/productos
├── productos_capilares.csv     # Fuente de productos
├── img/                        # Fotos de productos (WebP)
└── vercel.json                 # Configuración de Vercel (build de Vite + lambda)
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
3. Framework: **Other**; build command ya definido en `vercel.json`
   (`cd frontend-vue && npm ci && npm run build`).
4. Deploy. Todo el tráfico (frontend, `/api` e `/img`) pasa por la lambda de Express.

Con el CLI:

```bash
npx vercel
npx vercel --prod
```
