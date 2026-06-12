// ─── Helper Meta Pixel ────────────────────────────────────────
// Déclenche un événement standard Facebook si le pixel (fbq) est chargé.
// Sans danger si fbq est absent (ex. bloqueur de pub) : ne fait rien.
export const fbTrack = (event, data = {}) => {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    try {
      window.fbq("track", event, { currency: "TND", ...data });
    } catch {
      /* ignore */
    }
  }
};
