-- ============================================================
-- Déclencheur : ajuste automatiquement le stock des produits
-- selon les commandes (table orders).
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- ============================================================
-- Logique :
--   • Nouvelle commande (INSERT)        -> stock = stock - quantité
--   • Commande supprimée (DELETE)       -> stock = stock + quantité (restitué)
--   • Commande annulée (statut->annulee)-> stock restitué
--   • Commande ré-activée (annulee->...)-> stock redécrémenté
-- Le stock ne descend jamais sous 0 (greatest).
-- SECURITY DEFINER : fonctionne quelles que soient les RLS.
-- ============================================================

create or replace function public.adjust_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    if NEW.product_id is not null and NEW.status is distinct from 'annulee' then
      update public.products
        set stock = greatest(0, stock - NEW.quantity)
        where id = NEW.product_id;
    end if;
    return NEW;

  elsif (TG_OP = 'DELETE') then
    if OLD.product_id is not null and OLD.status is distinct from 'annulee' then
      update public.products
        set stock = stock + OLD.quantity
        where id = OLD.product_id;
    end if;
    return OLD;

  elsif (TG_OP = 'UPDATE') then
    -- Annulation : on restitue le stock
    if OLD.status is distinct from 'annulee'
       and NEW.status = 'annulee'
       and NEW.product_id is not null then
      update public.products
        set stock = stock + NEW.quantity
        where id = NEW.product_id;
    -- Ré-activation d'une commande annulée : on redécrémente
    elsif OLD.status = 'annulee'
       and NEW.status is distinct from 'annulee'
       and NEW.product_id is not null then
      update public.products
        set stock = greatest(0, stock - NEW.quantity)
        where id = NEW.product_id;
    end if;
    return NEW;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_adjust_stock on public.orders;
create trigger trg_adjust_stock
  after insert or update or delete on public.orders
  for each row execute function public.adjust_product_stock();
