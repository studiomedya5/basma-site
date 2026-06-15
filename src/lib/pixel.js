// ─── Helper de suivi (Meta Pixel + Google Analytics 4) ──────────
// Déclenche un événement standard sur Facebook (fbq) ET sur GA4 (gtag).
// Sans danger si l'un des deux est absent (ex. bloqueur de pub) : ne fait rien.

// Correspondance entre les événements Meta et les événements e-commerce GA4
const GA4_MAP = {
  ViewContent:       "view_item",
  AddToCart:         "add_to_cart",
  InitiateCheckout:  "begin_checkout",
  Purchase:          "purchase",
};

export const fbTrack = (event, data = {}) => {
  // ── Meta Pixel ──
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", event, { currency: "TND", ...data });
    } catch {
      /* ignore */
    }
  }

  // ── Google Analytics 4 ──
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    try {
      const ga4Event = GA4_MAP[event] ?? event;
      // Construit un payload e-commerce GA4 (value, currency, items)
      const payload = { currency: "TND" };
      if (data.value != null) payload.value = data.value;
      if (data.content_name) {
        payload.items = [{
          item_name: data.content_name,
          item_category: data.content_category,
          price: data.value,
        }];
      }
      window.gtag("event", ga4Event, payload);
    } catch {
      /* ignore */
    }
  }
};
