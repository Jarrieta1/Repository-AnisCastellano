# Anis Castellano Tienda Cosmetic

Catálogo de productos capilares con HTML + CSS + JS y servidor **Express**.

## Requisitos

- Node.js 20 o superior

## Correr en local

```bash
npm install
npm start
```

Abre http://localhost:3000

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Estructura

```
├── index.html              # Página principal
├── styles.css              # Estilos (paleta del logo)
├── main.js                 # Lógica del catálogo, carrito y filtros
├── api/index.js            # Servidor Express + API /api/productos
├── productos_capilares.csv # Fuente de productos
├── img/                    # Fotos de productos (opcionales)
└── vercel.json             # Configuración de Vercel
```

## Productos

Los productos se cargan desde `productos_capilares.csv` con columnas:
`Título, Descripción, Precio`.

- **API**: `GET /api/productos` devuelve el catálogo en JSON (Express lo parsea).
- **Fallback**: si no hay API, el navegador lee el CSV directamente.

### Imágenes

Coloca tus fotos en `img/` con el *slug* del nombre en minúsculas y sin tildes:

| Producto | Archivo |
|---|---|
| Kit Capilar Energy - Naissant | `img/kit-capilar-energy-naissant.webp` |

Si falta la imagen, se genera un placeholder automático.

## Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. Importa el repo en [vercel.com/new](https://vercel.com/new).
3. Framework: **Other**, sin build command.
4. Deploy.

Con el CLI:

```bash
npx vercel
npx vercel --prod
```
