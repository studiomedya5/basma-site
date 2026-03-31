import "@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const BASMA_EMAIL = "basmaonlyshop51@gmail.com";
const FROM_EMAIL = "Basma Only Shop <commandes@basmaonlyshop.tn>";
const SITE = "https://basmaonlyshop.tn";
const LOGO = `${SITE}/images/logo.png`;

Deno.serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
      },
    });
  }

  try {
    const order = await req.json();
    const {
      customer_name,
      customer_phone,
      customer_email,
      product_name,
      product_image,
      product_price,
      size,
      quantity,
      total_price,
      address,
      governorate,
      color_label,
    } = order;

    const imgUrl = product_image || `${SITE}/images/logo.png`;
    const priceUnit = product_price || total_price;
    const deliveryFree = Number(total_price) >= 100;
    const deliveryNote = deliveryFree ? "✓ Livraison gratuite" : "Frais de livraison : 8 DT";
    const deliveryBg = deliveryFree ? "#f0faf4" : "#fdf6ec";
    const deliveryBorder = deliveryFree ? "#c3e6cb" : "#f0d9b5";
    const deliveryColor = deliveryFree ? "#2e7d32" : "#8B6914";

    // ══════════════════════════════════════════════════════
    // 1. EMAIL À BASMA (toujours)
    // ══════════════════════════════════════════════════════
    const basmaHtml = `
    <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;">
      <!-- Header -->
      <div style="background:#2C2A20;padding:20px 28px;display:flex;align-items:center;">
        <img src="${LOGO}" alt="Basma" width="36" height="36" style="border-radius:50%;margin-right:14px;" />
        <div>
          <h1 style="color:#C9A84C;font-size:18px;font-weight:400;margin:0;letter-spacing:1px;">NOUVELLE COMMANDE</h1>
          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:4px 0 0;">basmaonlyshop.tn</p>
        </div>
      </div>

      <div style="padding:24px 28px;">
        <!-- Produit avec image -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="width:100px;vertical-align:top;padding-right:16px;">
              <img src="${imgUrl}" alt="${product_name}" width="100" height="130" style="border-radius:8px;object-fit:cover;border:1px solid #EDE8E0;display:block;" />
            </td>
            <td style="vertical-align:top;">
              <p style="color:#C9A84C;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px;">Produit commandé</p>
              <h2 style="color:#2C2A20;font-size:18px;font-weight:600;margin:0 0 8px;">${product_name}</h2>
              <table style="border-collapse:collapse;">
                <tr><td style="color:#999;font-size:12px;padding:2px 12px 2px 0;">Taille</td><td style="font-size:13px;font-weight:600;color:#2C2A20;">${size}</td></tr>
                <tr><td style="color:#999;font-size:12px;padding:2px 12px 2px 0;">Couleur</td><td style="font-size:13px;color:#2C2A20;">${color_label || "—"}</td></tr>
                <tr><td style="color:#999;font-size:12px;padding:2px 12px 2px 0;">Quantité</td><td style="font-size:13px;font-weight:600;color:#2C2A20;">${quantity}</td></tr>
                <tr><td style="color:#999;font-size:12px;padding:2px 12px 2px 0;">Prix unitaire</td><td style="font-size:13px;color:#2C2A20;">${priceUnit} DT</td></tr>
              </table>
              <div style="margin-top:10px;background:#C9A84C;display:inline-block;padding:6px 16px;border-radius:4px;">
                <span style="color:white;font-size:16px;font-weight:700;">${total_price} DT</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Séparateur -->
        <div style="border-top:2px solid #EDE8E0;margin:16px 0;"></div>

        <!-- Infos client -->
        <p style="color:#C9A84C;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;">Informations client</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;color:#666;font-size:13px;width:120px;">👤 Nom</td>
            <td style="padding:6px 0;font-weight:600;font-size:14px;color:#2C2A20;">${customer_name}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;font-size:13px;">📱 Téléphone</td>
            <td style="padding:6px 0;font-size:14px;"><a href="tel:${customer_phone}" style="color:#C9A84C;text-decoration:none;font-weight:600;">${customer_phone}</a></td>
          </tr>
          ${customer_email ? `
          <tr>
            <td style="padding:6px 0;color:#666;font-size:13px;">📧 Email</td>
            <td style="padding:6px 0;font-size:14px;"><a href="mailto:${customer_email}" style="color:#C9A84C;text-decoration:none;">${customer_email}</a></td>
          </tr>` : ""}
          <tr>
            <td style="padding:6px 0;color:#666;font-size:13px;">📍 Adresse</td>
            <td style="padding:6px 0;font-size:14px;color:#2C2A20;">${address}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#666;font-size:13px;">🏛️ Gouvernorat</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#2C2A20;">${governorate}</td>
          </tr>
        </table>

        <!-- Livraison -->
        <div style="background:${deliveryBg};border:1px solid ${deliveryBorder};padding:10px 16px;margin-top:16px;border-radius:6px;text-align:center;">
          <span style="font-size:13px;color:${deliveryColor};font-weight:500;">🚚 ${deliveryNote}</span>
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f5f1ec;padding:14px 28px;text-align:center;border-top:1px solid #EDE8E0;">
        <p style="color:#999;font-size:11px;margin:0;">Reçu automatiquement — basmaonlyshop.tn</p>
      </div>
    </div>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [BASMA_EMAIL],
        subject: `🛍️ Nouvelle commande - ${product_name} — ${customer_name}`,
        html: basmaHtml,
      }),
    });

    // ══════════════════════════════════════════════════════
    // 2. EMAIL AU CLIENT (si email fourni)
    // ══════════════════════════════════════════════════════
    if (customer_email) {
      const clientHtml = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAF9F6;">
        <!-- Header avec logo -->
        <div style="background:#2C2A20;padding:24px 32px;text-align:center;">
          <img src="${LOGO}" alt="Basma Only Shop" width="48" height="48" style="border-radius:50%;margin-bottom:10px;border:2px solid #C9A84C;" />
          <h1 style="color:#C9A84C;font-size:20px;font-weight:400;margin:0;letter-spacing:3px;">BASMA ONLY SHOP</h1>
          <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:6px 0 0;">Mode Élégante — Tunisie</p>
        </div>

        <!-- Merci -->
        <div style="padding:32px 32px 0;text-align:center;">
          <div style="width:50px;height:50px;border-radius:50%;background:#f0faf4;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:24px;">✓</span>
          </div>
          <h2 style="color:#2C2A20;font-size:22px;font-weight:400;margin:0 0 6px;">
            Merci <strong style="color:#C9A84C;">${customer_name}</strong> !
          </h2>
          <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">
            Votre commande a été confirmée avec succès.
          </p>
        </div>

        <div style="padding:28px 32px;">
          <!-- Produit avec image -->
          <div style="background:white;border:1px solid #EDE8E0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="width:120px;vertical-align:top;">
                  <img src="${imgUrl}" alt="${product_name}" width="120" height="150" style="object-fit:cover;display:block;" />
                </td>
                <td style="vertical-align:top;padding:16px 18px;">
                  <p style="color:#C9A84C;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 6px;">Votre article</p>
                  <h3 style="color:#2C2A20;font-size:16px;font-weight:600;margin:0 0 12px;line-height:1.3;">${product_name}</h3>
                  <table style="border-collapse:collapse;width:100%;">
                    <tr>
                      <td style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:4px 0;">Taille</td>
                      <td style="text-align:right;font-size:13px;color:#2C2A20;padding:4px 0;">${size}</td>
                    </tr>
                    <tr>
                      <td style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:4px 0;">Couleur</td>
                      <td style="text-align:right;font-size:13px;color:#2C2A20;padding:4px 0;">${color_label || "—"}</td>
                    </tr>
                    <tr>
                      <td style="color:#999;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding:4px 0;">Quantité</td>
                      <td style="text-align:right;font-size:13px;color:#2C2A20;padding:4px 0;">${quantity}</td>
                    </tr>
                  </table>
                  <div style="border-top:1px solid #f0ebe4;margin-top:10px;padding-top:10px;text-align:right;">
                    <span style="font-size:20px;font-weight:700;color:#C9A84C;">${total_price} DT</span>
                  </div>
                </td>
              </tr>
            </table>
          </div>

          <!-- Livraison -->
          <div style="background:${deliveryBg};border:1px solid ${deliveryBorder};padding:12px 16px;margin-bottom:20px;border-radius:8px;text-align:center;">
            <span style="font-size:14px;color:${deliveryColor};font-weight:500;">🚚 ${deliveryNote}</span>
          </div>

          <!-- Adresse de livraison -->
          <div style="background:white;border:1px solid #EDE8E0;border-radius:8px;padding:16px 20px;margin-bottom:20px;">
            <p style="color:#C9A84C;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">📍 Livraison à</p>
            <p style="color:#2C2A20;font-size:14px;margin:0;line-height:1.6;">
              <strong>${customer_name}</strong><br/>
              ${address}<br/>
              <strong>${governorate}</strong>
            </p>
          </div>

          <!-- Prochaines étapes -->
          <div style="background:white;border:1px solid #EDE8E0;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
            <p style="color:#C9A84C;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Prochaine étape</p>
            <p style="color:#2C2A20;font-size:14px;line-height:1.8;margin:0;">
              Nous vous contacterons sous <strong>24h</strong><br/>
              au <strong style="color:#C9A84C;">${customer_phone}</strong><br/>
              pour confirmer votre livraison.
            </p>
          </div>

          <!-- Séparateur doré -->
          <div style="text-align:center;margin:24px 0;">
            <div style="width:60px;height:2px;background:#C9A84C;margin:0 auto;border-radius:1px;"></div>
          </div>

          <!-- Contact -->
          <div style="text-align:center;">
            <p style="color:#999;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;">Besoin d'aide ?</p>
            <table style="margin:0 auto;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 16px;">
                  <a href="https://wa.me/21629930212" style="color:#2C2A20;text-decoration:none;font-size:13px;">
                    📱 <span style="color:#C9A84C;font-weight:500;">WhatsApp</span><br/>
                    <span style="color:#999;font-size:11px;">+216 29 930 212</span>
                  </a>
                </td>
                <td style="padding:6px 16px;border-left:1px solid #EDE8E0;">
                  <a href="https://www.instagram.com/basma_onlyshop/" style="color:#2C2A20;text-decoration:none;font-size:13px;">
                    📸 <span style="color:#C9A84C;font-weight:500;">Instagram</span><br/>
                    <span style="color:#999;font-size:11px;">@basma_onlyshop</span>
                  </a>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#2C2A20;padding:20px 32px;text-align:center;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0 0 4px;">
            Merci d'avoir choisi Basma Only Shop ♥
          </p>
          <p style="color:rgba(255,255,255,0.25);font-size:10px;margin:0;">
            © 2026 Basma Only Shop — Tous droits réservés
          </p>
        </div>
      </div>`;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [customer_email],
          subject: `✅ Commande confirmée — ${product_name}`,
          html: clientHtml,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
