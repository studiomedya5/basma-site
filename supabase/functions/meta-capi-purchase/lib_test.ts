// Tests unitaires des helpers CAPI. Lancer : `deno test` dans ce dossier.
import { assert, assertEquals } from "jsr:@std/assert@1";
import {
  buildCustomData,
  buildPurchaseEvent,
  buildUserData,
  normalizePhoneTN,
  sha256Hex,
  splitName,
} from "./lib.ts";

const HEX64 = /^[0-9a-f]{64}$/;

Deno.test("sha256Hex — vecteur connu", async () => {
  assertEquals(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});

Deno.test("normalizePhoneTN — formats tunisiens mixtes", () => {
  assertEquals(normalizePhoneTN("98302719"), "21698302719");      // 8 chiffres
  assertEquals(normalizePhoneTN("+21629972171"), "21629972171");  // déjà E.164
  assertEquals(normalizePhoneTN("00216 29 972 171"), "21629972171"); // 00 + espaces
  assertEquals(normalizePhoneTN("(216) 29-972-171"), "21629972171"); // ponctuation
  assertEquals(normalizePhoneTN("029972171"), "21629972171");     // 0 initial
  assertEquals(normalizePhoneTN("123"), null);                    // trop court
  assertEquals(normalizePhoneTN(null), null);
});

Deno.test("splitName — prénom / nom", () => {
  assertEquals(splitName("Mehdy Jelassy"), { first: "Mehdy", last: "Jelassy" });
  assertEquals(splitName("  Sarra  Ben Ali "), { first: "Sarra", last: "Ben Ali" });
  assertEquals(splitName("Basma"), { first: "Basma", last: "" });
});

Deno.test("buildUserData — tout est hashé, bons champs, aucune PII en clair", async () => {
  const ud = await buildUserData({
    id: 42,
    customer_name: "Mehdy Jelassy",
    customer_phone: "+21698302719",
    customer_email: "Test@Mail.com ",
    delegation: "Borj El Amri",
    governorate: "Manouba",
  });
  // Présence des champs attendus
  for (const k of ["em", "ph", "fn", "ln", "ct", "st", "country"]) {
    assert(ud[k] && HEX64.test(ud[k][0]), `champ ${k} manquant ou non hashé`);
  }
  // Valeurs déterministes (normalisation correcte)
  assertEquals(ud.ph[0], await sha256Hex("21698302719"));
  assertEquals(ud.em[0], await sha256Hex("test@mail.com"));
  assertEquals(ud.ct[0], await sha256Hex("borjelamri"));
  assertEquals(ud.st[0], await sha256Hex("manouba"));
  assertEquals(ud.country[0], await sha256Hex("tn"));
  // Aucune valeur ne doit contenir la PII en clair
  const flat = JSON.stringify(ud);
  assert(!flat.includes("21698302719") && !flat.includes("test@mail.com") && !flat.includes("Mehdy"));
});

Deno.test("buildUserData — champs absents non inclus", async () => {
  const ud = await buildUserData({ id: 1, customer_name: "Basma" });
  assert(!("em" in ud) && !("ph" in ud) && !("ct" in ud) && !("st" in ud));
  assert("fn" in ud && "country" in ud); // prénom + pays toujours là
});

Deno.test("buildCustomData — value en TND, contents, num_items", () => {
  const cd = buildCustomData({ id: 7, product_id: 15, quantity: 2, total_price: 98 });
  assertEquals(cd.currency, "TND");
  assertEquals(cd.value, 98);          // total réel, AUCUNE reconversion
  assertEquals(cd.order_id, "7");
  assertEquals(cd.num_items, 2);
  assertEquals(cd.content_ids, ["15"]);
  assertEquals(cd.contents.length, 1);
  assertEquals(cd.contents[0].quantity, 2);
  assertEquals(cd.contents[0].item_price, 49); // 98 / 2
});

Deno.test("buildPurchaseEvent — event_id déterministe (idempotence/dédup)", async () => {
  const order = { id: 123, product_id: 15, quantity: 1, total_price: 53, customer_phone: "98302719" };
  const e1 = await buildPurchaseEvent(order, { eventTime: 1000 });
  const e2 = await buildPurchaseEvent(order, { eventTime: 2000 });
  assertEquals(e1.event_id, "purchase_123");
  assertEquals(e1.event_id, e2.event_id); // même commande → même event_id (peu importe l'instant)
  assertEquals(e1.event_name, "Purchase");
  assertEquals(e1.action_source, "website");
  assertEquals(e1.custom_data.value, 53);
  assertEquals(e1.custom_data.currency, "TND");
});
