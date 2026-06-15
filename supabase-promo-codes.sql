-- ============================================================
-- Codes promo (livraison gratuite) pour les lives Facebook/TikTok.
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- ============================================================
-- Concept :
--   • L'admin génère des codes (self-service).
--   • Chaque code = livraison gratuite sur n'importe quel produit/panier.
--   • 1 seule utilisation par client (par numéro de téléphone).
--   • Le nombre d'utilisations se compte depuis la table orders.
-- ============================================================

create table if not exists public.promo_codes (
  id            bigint generated always as identity primary key,
  code          text unique not null,
  label         text,
  free_shipping boolean default true,
  active        boolean default true,
  expires_at    timestamptz,
  created_at    timestamptz default now()
);

-- On enregistre le code utilisé sur chaque commande (pour compter + bloquer la réutilisation)
alter table public.orders add column if not exists promo_code text;

-- ── RLS : l'admin (clé anon) gère ; le site lit pour valider un code ──
alter table public.promo_codes enable row level security;

drop policy if exists "promo_anon_select" on public.promo_codes;
drop policy if exists "promo_anon_insert" on public.promo_codes;
drop policy if exists "promo_anon_update" on public.promo_codes;
drop policy if exists "promo_anon_delete" on public.promo_codes;

create policy "promo_anon_select" on public.promo_codes for select to anon using (true);
create policy "promo_anon_insert" on public.promo_codes for insert to anon with check (true);
create policy "promo_anon_update" on public.promo_codes for update to anon using (true) with check (true);
create policy "promo_anon_delete" on public.promo_codes for delete to anon using (true);
