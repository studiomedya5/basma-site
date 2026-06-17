-- ============================================================
-- SÉCURITÉ — PHASE C (CORRECTIF) : policies d'orders propres
-- ============================================================
-- Problème : il restait une policy d'INSERT permissive (check true)
-- sur orders, qui s'additionne aux autres (RLS = OR des policies
-- permissives) → le garde-fou n'était pas appliqué.
-- Solution : on supprime TOUTES les policies d'orders et on recrée
-- uniquement les deux bonnes.
-- ============================================================

-- 1) Supprimer toute policy existante sur public.orders (repart propre)
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'orders'
  loop
    execute format('drop policy if exists %I on public.orders', r.policyname);
  end loop;
end $$;

-- 2) Recréer proprement les deux seules policies voulues
-- anon : INSERT uniquement, avec garde-fous (statut/quantité/montant/produit)
create policy "orders_anon_insert" on public.orders
  for insert to anon
  with check (
    status = 'en_attente'
    and quantity > 0
    and total_price >= 0
    and product_name is not null
  );

-- admin connecté (authenticated) : tout permis
create policy "orders_auth_all" on public.orders
  for all to authenticated
  using (true) with check (true);

-- 3) Rappel des grants (anon = insert seulement ; admin = tout)
revoke select, update, delete on public.orders from anon;
grant insert on public.orders to anon;
grant select, insert, update, delete on public.orders to authenticated;

-- ── Contrôle : afficher les policies finales d'orders ──
select policyname, cmd, roles, with_check
from pg_policies
where schemaname = 'public' and tablename = 'orders'
order by cmd, policyname;
