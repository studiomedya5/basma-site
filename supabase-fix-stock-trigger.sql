-- ============================================================
-- CORRECTIF URGENT : le déclencheur de stock faisait échouer
-- TOUTES les commandes (enum order_status = 'annulée' avec accent,
-- le trigger comparait à 'annulee' sans accent -> erreur).
-- À exécuter dans Supabase > SQL Editor (remplace l'ancienne fonction).
-- ============================================================

create or replace function public.adjust_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    if NEW.product_id is not null and NEW.status::text <> 'annulée' then
      perform apply_stock_delta(NEW.product_id, NEW.color_index, -NEW.quantity);
    end if;
    return NEW;

  elsif (TG_OP = 'DELETE') then
    if OLD.product_id is not null and OLD.status::text <> 'annulée' then
      perform apply_stock_delta(OLD.product_id, OLD.color_index, OLD.quantity);
    end if;
    return OLD;

  elsif (TG_OP = 'UPDATE') then
    -- Annulation : on restitue le stock
    if OLD.status::text <> 'annulée' and NEW.status::text = 'annulée' and NEW.product_id is not null then
      perform apply_stock_delta(NEW.product_id, NEW.color_index, NEW.quantity);
    -- Ré-activation d'une commande annulée : on redéduit
    elsif OLD.status::text = 'annulée' and NEW.status::text <> 'annulée' and NEW.product_id is not null then
      perform apply_stock_delta(NEW.product_id, NEW.color_index, -NEW.quantity);
    end if;
    return NEW;
  end if;
  return null;
end;
$$;
