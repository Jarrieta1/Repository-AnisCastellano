export function stars(rating) {
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  return (
    '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0))
  )
}
