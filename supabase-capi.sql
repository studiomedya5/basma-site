-- ============================================================
-- Conversions API Meta — déclencheur serveur + idempotence.
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- ============================================================
-- Ce que ça fait :
--   1) Ajoute capi_sent_at (idempotence) et capi_resend_at (backfill manuel).
--   2) Crée un Database Webhook qui appelle l'Edge Function "meta-capi-purchase"
--      quand une commande passe à "confirmée" (ou quand on demande un renvoi).
--   L'Edge Function fait le claim atomique + l'envoi CAPI (jamais bloquant).
-- ============================================================

-- 1) Colonnes
alter table public.orders add column if not exists capi_sent_at   timestamptz;
alter table public.orders add column if not exists capi_resend_at timestamptz;

-- 2) Database Webhook (trigger -> Edge Function)
-- ⚠️ AVANT d'exécuter :
--    a) Déploie la fonction : `supabase functions deploy meta-capi-purchase`
--    b) Remplace <<SECRET_WEBHOOK>> par une valeur secrète forte (ex: 32+ caractères
--       aléatoires). Mets EXACTEMENT la même valeur dans le secret
--       META_WEBHOOK_SECRET de la fonction. Ce secret empêche tout appel externe.
--    c) Si la fonction `supabase_functions.http_request` n'existe pas, active d'abord
--       les "Database Webhooks" une fois via le Dashboard (Database > Webhooks).

drop trigger if exists trg_orders_capi on public.orders;

create trigger trg_orders_capi
after update on public.orders
for each row
when (
  -- transition vers "confirmée" (valeur enum AVEC accent)
  (old.status is distinct from new.status and new.status::text = 'confirmée')
  -- OU demande de renvoi manuel (bouton backfill)
  or (new.capi_resend_at is distinct from old.capi_resend_at and new.capi_resend_at is not null)
)
execute function supabase_functions.http_request(
  'https://tpvumzwkekuyrggllffj.supabase.co/functions/v1/meta-capi-purchase',
  'POST',
  '{"Content-Type":"application/json","x-webhook-secret":"<<SECRET_WEBHOOK>>"}',
  '{}',
  '5000'
);
