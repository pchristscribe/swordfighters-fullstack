export function withCountShape(row) {
  const { productCount, ...rest } = row
  return { ...rest, _count: { products: Number(productCount ?? 0) } }
}
