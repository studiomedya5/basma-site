-- ============================================================
-- SÉCURITÉ — ROLLBACK (retour à l'état "tout ouvert" anon)
-- À n'exécuter QUE si le durcissement casse quelque chose et qu'on
-- veut revenir en arrière en urgence. Réautorise anon partout.
-- (Le front Auth continue de marcher : les policies authenticated restent.)
-- ============================================================

-- orders : réautorise anon (select/insert/update/delete "tout permis")
drop policy if exists "orders_anon_insert" on public.orders;
create policy "orders_anon_insert" on public.orders for insert to anon with check (true);
drop policy if exists "orders_anon_select" on public.orders;
create policy "orders_anon_select" on public.orders for select to anon using (true);
drop policy if exists "orders_anon_update" on public.orders;
create policy "orders_anon_update" on public.orders for update to anon using (true) with check (true);
drop policy if exists "orders_anon_delete" on public.orders;
create policy "orders_anon_delete" on public.orders for delete to anon using (true);
grant select, insert, update, delete on public.orders to anon;

-- promo_codes : réautorise anon
drop policy if exists "promo_anon_select" on public.promo_codes;
create policy "promo_anon_select" on public.promo_codes for select to anon using (true);
drop policy if exists "promo_anon_insert" on public.promo_codes;
create policy "promo_anon_insert" on public.promo_codes for insert to anon with check (true);
drop policy if exists "promo_anon_update" on public.promo_codes;
create policy "promo_anon_update" on public.promo_codes for update to anon using (true) with check (true);
drop policy if exists "promo_anon_delete" on public.promo_codes;
create policy "promo_anon_delete" on public.promo_codes for delete to anon using (true);
grant select, insert, update, delete on public.promo_codes to anon;

-- products : réautorise l'écriture anon (et désactive RLS comme avant)
revoke all on public.products from anon;
grant select, insert, update, delete on public.products to anon;
alter table public.products disable row level security;

-- fonctions stock : réautorise EXECUTE (état d'origine)
grant execute on function public.apply_stock_delta(bigint, int, int) to anon, authenticated;
grant execute on function public.adjust_product_stock() to anon, authenticated;

-- ============================================================
-- Note : ceci NE supprime PAS le login Auth ni la fonction
-- validate_promo_code (qui restent inoffensifs). C'est juste un
-- filet de sécurité pour rétablir l'accès anon si besoin.
-- ============================================================
