export function placeholderSVG(producto) {
  const label = producto.categoria
  const iniciales = producto.nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" viewBox="0 0 400 500">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f3eaf6"/>
          <stop offset="100%" stop-color="#fbf3d9"/>
        </linearGradient>
      </defs>
      <rect width="400" height="500" fill="url(#g)"/>
      <circle cx="200" cy="225" r="88" fill="#ffffff" opacity="0.85"/>
      <text x="200" y="245" font-family="Georgia, serif" font-size="54" fill="#4d1b5d" text-anchor="middle" font-weight="bold">${iniciales}</text>
      <text x="200" y="360" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#6f6a63" text-anchor="middle">${label}</text>
      <text x="200" y="390" font-family="Helvetica, Arial, sans-serif" font-size="12" fill="#c99212" text-anchor="middle">Coloca tu foto en /img</text>
    </svg>`
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg.trim())
}

export function imgSrc(producto) {
  return producto.imagen || placeholderSVG(producto)
}
