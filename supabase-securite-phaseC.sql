-- ============================================================
-- SÉCURITÉ — PHASE C (VERROUILLAGE)
-- À exécuter SEULEMENT après avoir confirmé que le login admin
-- (Supabase Auth) fonctionne sur le site déployé.
-- ============================================================
-- Coupe l'accès "anon" partout sauf : lire le catalogue (products)
-- et créer une commande (orders INSERT avec garde-fous).
-- L'admin passe désormais par la session Auth (rôle authenticated).
-- ============================================================

-- ── 1) orders : anon = INSERT seulement, avec WITH CHECK strict ──
drop policy if exists "orders_anon_select" on public.orders;
drop policy if exists "orders_anon_update" on public.orders;
drop policy if exists "orders_anon_delete" on public.orders;

-- Remplace l'INSERT "tout permis" par un INSERT contrôlé :
--   statut forcé "en_attente", quantité > 0, montant >= 0, produit nommé.
drop policy if exists "orders_anon_insert" on public.orders;
create policy "orders_anon_insert" on public.orders
  for insert to anon
  with check (
    status = 'en_attente'
    and quantity > 0
    and total_price >= 0
    and product_name is not null
  );

-- anon ne peut plus lire / modifier / supprimer les commandes (PII protégées).
revoke select, update, delete on public.orders from anon;
grant insert on public.orders to anon;

-- ── 2) promo_codes : aucun droit anon (validation via la fonction) ──
drop policy if exists "promo_anon_select" on public.promo_codes;
drop policy if exists "promo_anon_insert" on public.promo_codes;
drop policy if exists "promo_anon_update" on public.promo_codes;
drop policy if exists "promo_anon_delete" on public.promo_codes;
revoke select, insert, update, delete on public.promo_codes from anon;

-- ── 3) products : lecture publique OK, écriture = admin seulement ──
alter table public.products enable row level security;

drop policy if exists "products_anon_select" on public.products;
create policy "products_anon_select" on public.products
  for select to anon using (true);

drop policy if exists "products_auth_all" on public.products;
create policy "products_auth_all" on public.products
  for all to authenticated using (true) with check (true);

revoke insert, update, delete on public.products from anon;
grant select on public.products to anon;

-- ── 4) Fonctions SECURITY DEFINER : retirer EXECUTE au public ──
-- (Les triggers continuent de fonctionner : ils ne vérifient pas EXECUTE.)
revoke all on function public.apply_stock_delta(bigint, int, int) from public, anon, authenticated;
revoke all on function public.adjust_product_stock() from public, anon, authenticated;

-- rls_auto_enable : révoquer si la fonction existe (signalée par le linter).
do $$
declare r record;
begin
  for r in
    select 'public.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  loop
    execute 'revoke all on function '||r.sig||' from public, anon, authenticated';
  end loop;
end $$;

-- ============================================================
-- Après cette phase : anon ne peut plus lire les commandes, voler les codes
-- promo, ni toucher au stock. L'admin gère tout via sa session Auth.
-- Le webhook CAPI (service_role) n'est pas affecté.
-- ============================================================
