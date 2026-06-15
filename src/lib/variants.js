// ─── Variantes par couleur (stock + tailles disponibles) ─────
// Chaque variante correspond à une photo (couleur) du produit.
// Format en base : [{ stock: 2, sizes: ["S","M","L"] }, ...]
// Compatibilité : un ancien format (nombre) = stock seul, toutes tailles dispo.

export const normVariants = (raw, allSizes = []) => {
  if (!Array.isArray(raw)) return null;
  return raw.map((v) => {
    if (v == null || v === "") return { stock: 0, sizes: allSizes };
    if (typeof v === "number" || typeof v === "string") return { stock: Number(v) || 0, sizes: allSizes };
    return {
      stock: Number(v.stock) || 0,
      sizes: Array.isArray(v.sizes) ? v.sizes : allSizes,
    };
  });
};
