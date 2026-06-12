-- ============================================================
-- Policies RLS pour la table "orders"
-- À exécuter dans Supabase > SQL Editor
-- ============================================================
-- Contexte : l'admin panel (/admin) et le site utilisent la clé
-- "anon". Il faut donc autoriser le rôle anon à :
--   - INSERT : un client passe une commande
--   - SELECT : l'admin lit les commandes
--   - UPDATE : l'admin change le statut / édite
--   - DELETE : l'admin supprime une commande
-- Le panel admin est protégé par mot de passe côté front uniquement.
-- ============================================================

-- Active RLS (sans policy = tout est bloqué)
alter table public.orders enable row level security;

-- On repart propre : on supprime les anciennes policies si elles existent
drop policy if exists "orders_anon_insert" on public.orders;
drop policy if exists "orders_anon_select" on public.orders;
drop policy if exists "orders_anon_update" on public.orders;
drop policy if exists "orders_anon_delete" on public.orders;

-- INSERT : tout le monde peut créer une commande (client)
create policy "orders_anon_insert"
  on public.orders for insert
  to anon
  with check (true);

-- SELECT : lecture des commandes (admin)
create policy "orders_anon_select"
  on public.orders for select
  to anon
  using (true);

-- UPDATE : modification (statut, infos) par l'admin
create policy "orders_anon_update"
  on public.orders for update
  to anon
  using (true)
  with check (true);

-- DELETE : suppression par l'admin
create policy "orders_anon_delete"
  on public.orders for delete
  to anon
  using (true);
