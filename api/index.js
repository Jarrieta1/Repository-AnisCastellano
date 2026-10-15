import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CSV_PATH = path.join(ROOT, "productos_capilares.csv");

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- Parser de CSV (respeta campos entre comillas) ---------- */
function parseCSV(texto) {
  texto = texto.replace(/^\uFEFF/, "");
  const filas = [];
  let fila = [];
  let campo = "";
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && texto[i + 1] === "\n") i++;
      fila.push(campo);
      campo = "";
      if (fila.some((f) => f.trim() !== "")) filas.push(fila);
      fila = [];
    } else {
      campo += c;
    }
  }
  if (campo !== "" || fila.length) {
    fila.push(campo);
    if (fila.some((f) => f.trim() !== "")) filas.push(fila);
  }
  return filas;
}

const normalizar = (s) =>
  s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const slugify = (s) =>
  normalizar(s).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const parsePrecio = (s) => Number(String(s).replace(/[^0-9]/g, "")) || 0;

function csvAProductos(filas) {
  if (filas.length < 2) return [];
  const headers = filas[0].map(normalizar);
  const iTitulo = headers.findIndex(
    (h) => h.startsWith("titulo") || h === "nombre",
  );
  const iDesc = headers.findIndex((h) => h.startsWith("descripcion"));
  const iPrecio = headers.findIndex((h) => h.startsWith("precio"));
  const iImagen = headers.findIndex((h) => h.startsWith("imagen"));
  const iCategoria = headers.findIndex((h) => h.startsWith("categoria"));

  if (iTitulo < 0 || iPrecio < 0) return [];

  return filas
    .slice(1)
    .map((fila, i) => {
      const nombre = (fila[iTitulo] || "").trim();
      const slug = slugify(nombre);
      const imagenCol = iImagen >= 0 ? (fila[iImagen] || "").trim() : "";
      return {
        id: i + 1,
        nombre,
        categoria:
          iCategoria >= 0 && fila[iCategoria]
            ? fila[iCategoria].trim()
            : "Cabello",
        precio: parsePrecio(fila[iPrecio]),
        precioAntes: null,
        imagen: imagenCol
          ? imagenCol.startsWith("img/")
            ? imagenCol
            : `img/${imagenCol}`
          : `img/${slug}.webp`,
        destacado: false,
        nuevo: false,
        descuento: 0,
        rating: null,
        resenas: null,
        descripcion: iDesc >= 0 ? (fila[iDesc] || "").trim() : "",
        especificaciones: null,
      };
    })
    .filter((p) => p.nombre && p.precio > 0);
}

/* ---------- API ---------- */
app.get("/api/productos", (req, res) => {
  try {
    const texto = fs.readFileSync(CSV_PATH, "utf8");
    const productos = csvAProductos(parseCSV(texto));
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(productos);
  } catch (err) {
    console.error("No se pudo leer el CSV:", err.message);
    res.status(500).json({ error: "No se pudo cargar el catálogo" });
  }
});

/* ---------- Archivos estáticos (HTML, CSS, JS, imágenes, CSV) ---------- */
app.use(express.static(ROOT));

/* ---------- Inicio local (Vercel exporta la app y maneja el ciclo) ---------- */
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Anis Castellano Tienda Cosmetic → http://localhost:${PORT}`);
  });
}

export default app;
