-- ============================================================
-- SÉCURITÉ — STORAGE (bucket "products")
-- ============================================================
-- Constat : 3 policies "to public" sur storage.objects permettaient à
-- N'IMPORTE QUI de lister, uploader ET supprimer les images produits.
-- Correctif : on réserve la gestion (lister/upload/maj/suppr) à l'admin
-- connecté (authenticated). La LECTURE des images par URL reste publique
-- (le bucket products est public → les <img> continuent de marcher).
-- ============================================================

-- 1) Supprimer toutes les policies "public" existantes sur storage.objects
do $$
declare r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and roles @> array['public']::name[]
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end $$;

-- 2) Recréer : gestion réservée à l'admin connecté (authenticated), bucket products
create policy "products_admin_select" on storage.objects
  for select to authenticated using (bucket_id = 'products');

create policy "products_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');

create policy "products_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'products') with check (bucket_id = 'products');

create policy "products_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products');

-- ── Contrôle : afficher les policies finales du storage ──
select policyname, cmd, roles
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by cmd;
