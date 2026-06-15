-- ============================================================
-- Ajoute la colonne "delegation" à la table orders.
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- Stocke la délégation choisie par la cliente (dépend du gouvernorat),
-- nécessaire pour la société de livraison.
-- ============================================================

alter table public.orders
  add column if not exists delegation text;
