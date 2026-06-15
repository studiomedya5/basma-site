-- ============================================================
-- Prix barré (promo / pack) : colonne original_price.
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- Si original_price > price, le site affiche le prix barré + badge -X%.
-- Idéal pour la catégorie "Pack's" (ex : 2 articles à 200 DT vendus 170 DT).
-- ============================================================

alter table public.products
  add column if not exists original_price numeric;
