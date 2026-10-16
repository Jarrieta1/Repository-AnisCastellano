/* Servicio centralizado de productos.
   La conversión de CSV a JSON ocurre en el backend (api/index.js);
   el frontend solo consume el JSON de /api/productos. */
export async function cargarProductos() {
  const res = await fetch('/api/productos')
  if (!res.ok) throw new Error(`API /api/productos respondió ${res.status}`)
  const datos = await res.json()
  if (!Array.isArray(datos) || !datos.length)
    throw new Error('La API devolvió un catálogo vacío')
  return datos
}
