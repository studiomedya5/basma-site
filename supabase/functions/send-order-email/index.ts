import "@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const BASMA_EMAIL = "basmaonlyshop51@gmail.com";
const FROM_EMAIL = "Basma Only Shop <commandes@basmaonlyshop.tn>";

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
      size,
      quantity,
      total_price,
      address,
      governorate,
      color_label,
    } = order;

    const deliveryNote =
      Number(total_price) >= 100
        ? "Livraison gratuite ✓"
        : "Frais de livraison : 8 DT";

    // ── 1. Email à Basma (toujours) ──
    const basmaHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#C9A84C;border-bottom:2px solid #C9A84C;padding-bottom:10px;">
          🛍️ Nouvelle commande
        </h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px 0;color:#666;width:140px;">👤 Client</td><td style="padding:8px 0;font-weight:600;">${customer_name}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">📱 Téléphone</td><td style="padding:8px 0;">${customer_phone}</td></tr>
          ${customer_email ? `<tr><td style="padding:8px 0;color:#666;">📧 Email</td><td style="padding:8px 0;">${customer_email}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#666;">📦 Produit</td><td style="padding:8px 0;font-weight:600;">${product_name}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">🎨 Couleur</td><td style="padding:8px 0;">${color_label || "—"}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">📏 Taille</td><td style="padding:8px 0;">${size}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">🔢 Quantité</td><td style="padding:8px 0;">${quantity}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">💰 Total</td><td style="padding:8px 0;font-weight:700;color:#C9A84C;font-size:18px;">${total_price} DT</td></tr>
          <tr><td style="padding:8px 0;color:#666;">🚚 Livraison</td><td style="padding:8px 0;">${deliveryNote}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">📍 Adresse</td><td style="padding:8px 0;">${address}, ${governorate}</td></tr>
        </table>
      </div>
    `;

    const basmaRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [BASMA_EMAIL],
        subject: `🛍️ Nouvelle commande - ${customer_name}`,
        html: basmaHtml,
      }),
    });

    const basmaResult = await basmaRes.json();
    console.log("Email Basma:", JSON.stringify(basmaResult));

    // ── 2. Email au client (si email fourni) ──
    if (customer_email) {
      const clientHtml = `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAF9F6;">
          <div style="background:#2C2A20;padding:28px 32px;text-align:center;">
            <h1 style="color:#C9A84C;font-size:24px;font-weight:400;margin:0;letter-spacing:2px;">
              BASMA ONLY SHOP
            </h1>
          </div>

          <div style="padding:36px 32px;">
            <h2 style="color:#C9A84C;font-size:20px;font-weight:400;margin:0 0 8px;">
              Merci ${customer_name} pour votre commande !
            </h2>
            <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 28px;">
              Votre commande a bien été enregistrée. Voici le récapitulatif :
            </p>

            <div style="background:white;border:1px solid #EDE8E0;padding:20px 24px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Produit</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;text-align:right;font-weight:600;color:#2C2A20;">${product_name}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Taille</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;text-align:right;color:#2C2A20;">${size}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Couleur</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;text-align:right;color:#2C2A20;">${color_label || "—"}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Quantité</td>
                  <td style="padding:10px 0;border-bottom:1px solid #f0ebe4;text-align:right;color:#2C2A20;">${quantity}</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;color:#999;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Total</td>
                  <td style="padding:10px 0;text-align:right;font-weight:700;color:#C9A84C;font-size:20px;">${total_price} DT</td>
                </tr>
              </table>
            </div>

            <div style="background:${Number(total_price) >= 100 ? "#f0faf4" : "#fdf6ec"};border:1px solid ${Number(total_price) >= 100 ? "#c3e6cb" : "#f0d9b5"};padding:12px 16px;margin-bottom:24px;text-align:center;">
              <span style="font-size:14px;">🚚 ${deliveryNote}</span>
            </div>

            <div style="background:white;border:1px solid #EDE8E0;padding:20px 24px;margin-bottom:28px;text-align:center;">
              <p style="color:#2C2A20;font-size:14px;line-height:1.8;margin:0;">
                Nous vous contacterons sous <strong>24h</strong> pour confirmer la livraison.<br/>
                📍 Livraison à : <strong>${address}, ${governorate}</strong>
              </p>
            </div>

            <div style="text-align:center;margin:28px 0;">
              <div style="width:60px;height:1px;background:#C9A84C;margin:0 auto;"></div>
            </div>

            <div style="text-align:center;">
              <p style="color:#999;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">
                Nous contacter
              </p>
              <p style="margin:0;font-size:14px;line-height:2;">
                <a href="https://wa.me/21629930212" style="color:#C9A84C;text-decoration:none;">📱 WhatsApp : +216 29 930 212</a><br/>
                <a href="https://www.instagram.com/basma_onlyshop/" style="color:#C9A84C;text-decoration:none;">📸 Instagram : @basma_onlyshop</a>
              </p>
            </div>
          </div>

          <div style="background:#2C2A20;padding:20px 32px;text-align:center;">
            <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0;">
              © 2026 Basma Only Shop — Tous droits réservés
            </p>
          </div>
        </div>
      `;

      const clientRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [customer_email],
          subject: "✅ Votre commande Basma Only Shop est confirmée",
          html: clientHtml,
        }),
      });

      const clientResult = await clientRes.json();
      console.log("Email client:", JSON.stringify(clientResult));
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
