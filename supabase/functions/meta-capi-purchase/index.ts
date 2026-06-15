import "@supabase/functions-js/edge-runtime.d.ts";
import { buildPurchaseEvent, type OrderRow } from "./lib.ts";

// ────────────────────────────────────────────────────────────────
// Conversions API Meta — event "Purchase" côté serveur.
// Déclenché par un Database Webhook Supabase quand une commande passe
// à "confirmée" (ou via le bouton backfill qui repositionne capi_resend_at).
//
// Sécurité : on exige un secret partagé (x-webhook-secret) → impossible
// d'injecter un faux Purchase depuis l'extérieur. De plus, value/PII sont
// TOUJOURS relus depuis la base avec le SERVICE_ROLE_KEY (jamais le body).
//
// Secrets/env (jamais hardcodés, jamais loggés) :
//   META_CAPI_TOKEN, META_PIXEL_ID, META_WEBHOOK_SECRET,
//   META_TEST_EVENT_CODE (vide en prod), META_CAPI_ENABLED ("true"/"false"),
//   GRAPH_API_VERSION (défaut récent, surchargeable)
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (fournis automatiquement)
// ────────────────────────────────────────────────────────────────

const PIXEL_ID = Deno.env.get("META_PIXEL_ID") ?? "";
const CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN") ?? "";
const WEBHOOK_SECRET = Deno.env.get("META_WEBHOOK_SECRET") ?? "";
const TEST_EVENT_CODE = Deno.env.get("META_TEST_EVENT_CODE") ?? "";
const CAPI_ENABLED = (Deno.env.get("META_CAPI_ENABLED") ?? "true").toLowerCase() === "true";
const GRAPH_VERSION = Deno.env.get("GRAPH_API_VERSION") ?? "v23.0"; // surchargeable sans toucher au code
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://basmaonlyshop.tn";
const CONFIRMED = "confirmée"; // valeur exacte de l'enum order_status (avec accent)

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** En-têtes PostgREST avec la clé service role (jamais exposée au client). */
function dbHeaders(extra: Record<string, string> = {}) {
  return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", ...extra };
}

/**
 * Claim atomique : pose capi_sent_at=now() UNIQUEMENT si la commande est
 * "confirmée" ET pas encore envoyée. Renvoie la ligne claimée, ou null.
 * Grâce au filtre `capi_sent_at=is.null`, deux exécutions concurrentes ne
 * peuvent pas envoyer deux fois (PostgreSQL sérialise les UPDATE par ligne).
 */
async function claimOrder(orderId: number | string): Promise<OrderRow | null> {
  const url = `${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(String(orderId))}` +
    `&status=eq.${encodeURIComponent(CONFIRMED)}&capi_sent_at=is.null`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: dbHeaders({ Prefer: "return=representation" }),
    body: JSON.stringify({ capi_sent_at: new Date().toISOString() }),
  });
  if (!res.ok) return null;
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] as OrderRow : null;
}

/** Repose capi_sent_at=null pour permettre un réessai/backfill ultérieur. */
async function releaseOrder(orderId: number | string) {
  await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(String(orderId))}`, {
    method: "PATCH",
    headers: dbHeaders(),
    body: JSON.stringify({ capi_sent_at: null }),
  }).catch(() => {});
}

/** POST vers la Graph API avec retry sur erreurs transitoires (timeout/5xx). */
async function postToMeta(payload: unknown): Promise<{ ok: boolean; status: number; fbtrace_id?: string }> {
  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`;
  let lastStatus = 0, lastTrace: string | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      lastStatus = res.status;
      const data = await res.json().catch(() => ({}));
      lastTrace = data?.fbtrace_id;
      if (res.ok) return { ok: true, status: res.status, fbtrace_id: lastTrace };
      // 4xx (token/payload invalides) → inutile de réessayer
      if (res.status >= 400 && res.status < 500) return { ok: false, status: res.status, fbtrace_id: lastTrace };
      // 5xx → on réessaie
    } catch (_e) {
      lastStatus = 0; // erreur réseau → transitoire
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 600));
  }
  return { ok: false, status: lastStatus, fbtrace_id: lastTrace };
}

Deno.serve(async (req) => {
  // 1) Sécurité : secret partagé obligatoire (posé par le Database Webhook).
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });
  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return json(401, { error: "unauthorized" });
  }

  // 2) Flag d'activation globale.
  if (!CAPI_ENABLED) return json(200, { skipped: "capi_disabled" });
  if (!PIXEL_ID || !CAPI_TOKEN) {
    console.error("[capi] configuration manquante (pixel_id/token)");
    return json(200, { skipped: "missing_config" });
  }

  // 3) Récupère l'ID de commande (payload webhook OU backfill manuel).
  let body: any = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  const orderId = body?.record?.id ?? body?.order_id;
  if (orderId == null) return json(200, { skipped: "no_order_id" });

  // 4) Claim atomique (idempotence) : pose capi_sent_at si confirmée + non envoyée.
  const order = await claimOrder(orderId);
  if (!order) {
    // Déjà envoyé, ou commande non "confirmée" → on ne fait rien (idempotent).
    return json(200, { skipped: "already_sent_or_not_confirmed", order_id: orderId });
  }

  // 5) Construit le payload (value/PII relus depuis la base, PII hashées).
  const event = await buildPurchaseEvent(order, {
    eventTime: Math.floor(Date.now() / 1000),
    sourceUrl: `${SITE}/produit`,
  });
  const payload: Record<string, unknown> = { data: [event] };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE; // uniquement hors prod

  // 6) Envoi vers Meta (avec retry). Ne bloque jamais la commande : on est
  //    déjà découplé (appel serveur asynchrone via webhook).
  const result = await postToMeta(payload);

  if (result.ok) {
    // Log SANS token ni PII : juste l'id commande + trace Meta.
    console.log(`[capi] Purchase OK order=${order.id} event_id=purchase_${order.id} fbtrace=${result.fbtrace_id ?? "-"}`);
    return json(200, { sent: true, order_id: order.id, event_id: `purchase_${order.id}` });
  }

  // Échec → on libère capi_sent_at pour permettre un réessai/backfill.
  await releaseOrder(order.id);
  console.error(`[capi] Purchase ECHEC order=${order.id} http=${result.status} fbtrace=${result.fbtrace_id ?? "-"}`);
  // 5xx/réseau → 500 (le webhook peut réessayer) ; 4xx → 200 (inutile de réessayer).
  return json(result.status >= 500 || result.status === 0 ? 500 : 200, {
    sent: false, order_id: order.id, http: result.status,
  });
});
