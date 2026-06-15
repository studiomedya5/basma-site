// ────────────────────────────────────────────────────────────────
// Helpers PURS et testables pour la Conversions API Meta (Purchase).
// Aucune dépendance réseau ici → facile à tester avec `deno test`.
// Règle d'or : aucune PII ne sort en clair — email/téléphone/nom/ville
// sont normalisés PUIS hashés en SHA-256. value/currency/order_id NON hashés.
// ────────────────────────────────────────────────────────────────

/** SHA-256 → hexadécimal minuscule (format attendu par Meta). */
export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Normalise un numéro tunisien (formats mixtes) vers E.164 SANS "+".
 * Ex : "98302719" → "21698302719" · "+21629972171" → "21629972171"
 *      "0021629972171" → "21629972171" · "029972171" → "21629972171"
 * Retire espaces/séparateurs, "+", "00", "0" initial ; préfixe "216" si absent.
 * Renvoie null si le résultat n'est pas plausible (< 11 chiffres).
 */
export function normalizePhoneTN(raw: unknown): string | null {
  if (raw == null) return null;
  let d = String(raw).replace(/\D/g, ""); // ne garde que les chiffres (retire +, espaces, etc.)
  d = d.replace(/^00/, "");               // préfixe international 00
  if (!d.startsWith("216")) {
    d = d.replace(/^0+/, "");             // 0 initial éventuel
    d = "216" + d;
  }
  return d.length >= 11 ? d : null;       // 216 + 8 chiffres = 11
}

/** minuscule + trim (email, noms). */
export function normText(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/** ville / état : minuscule, trim, sans espaces ni ponctuation (normalisation Meta). */
export function normCityState(v: unknown): string {
  return String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Sépare "Mehdy Jelassy" → { first:"mehdy", last:"jelassy" }. */
export function splitName(full: unknown): { first: string; last: string } {
  const parts = String(full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export interface OrderRow {
  id: number | string;
  product_id?: number | string | null;
  product_name?: string | null;
  quantity?: number | null;
  total_price?: number | string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  governorate?: string | null;
  delegation?: string | null;
}

/**
 * Construit user_data (tous les champs HASHÉS). N'inclut que ce qui est présent.
 * em=email, ph=téléphone(E.164 sans +), fn/ln=prénom/nom, ct=ville(délégation),
 * st=état(gouvernorat), country="tn".
 */
export async function buildUserData(order: OrderRow): Promise<Record<string, string[]>> {
  const ud: Record<string, string[]> = {};
  const put = async (key: string, normalized: string) => {
    if (normalized) ud[key] = [await sha256Hex(normalized)];
  };

  const email = normText(order.customer_email);
  if (email) await put("em", email);

  const phone = normalizePhoneTN(order.customer_phone);
  if (phone) await put("ph", phone);

  const { first, last } = splitName(order.customer_name);
  if (first) await put("fn", normText(first));
  if (last) await put("ln", normText(last));

  const city = normCityState(order.delegation);
  if (city) await put("ct", city);

  const state = normCityState(order.governorate);
  if (state) await put("st", state);

  await put("country", "tn"); // toujours la Tunisie (COD)

  return ud;
}

/** custom_data : value/currency/order_id NON hashés (montant réel en TND). */
export function buildCustomData(order: OrderRow) {
  const qty = Number(order.quantity) || 1;
  const value = Number(order.total_price) || 0;
  const productId = String(order.product_id ?? order.product_name ?? order.id);
  const unit = Math.round((value / qty) * 1000) / 1000;
  return {
    currency: "TND",                 // jamais reconverti : Meta convertit côté compte USD
    value,                           // total réel de la commande en TND
    order_id: String(order.id),
    content_type: "product",
    content_ids: [productId],
    contents: [{ id: productId, quantity: qty, item_price: unit }],
    num_items: qty,
  };
}

/**
 * Événement Purchase complet pour le tableau "data".
 * event_id déterministe = "purchase_{id}" → déduplication + idempotence.
 */
export async function buildPurchaseEvent(
  order: OrderRow,
  opts: { eventTime?: number; sourceUrl?: string } = {},
) {
  return {
    event_name: "Purchase",
    event_time: opts.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: `purchase_${order.id}`,
    action_source: "website",
    event_source_url: opts.sourceUrl ?? "https://basmaonlyshop.tn",
    user_data: await buildUserData(order),
    custom_data: buildCustomData(order),
  };
}
