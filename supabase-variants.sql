-- ============================================================
-- Stock par couleur (variante) — version définitive.
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- Remplace l'ancien supabase-stock-trigger.sql (le trigger est recréé ici).
-- ============================================================
-- 1) products.variants : variante par couleur, alignée sur images[]
--    ex: [{"stock":2,"sizes":["S","M"]}, {"stock":5,"sizes":["S","M","L"]}, ...]
-- 2) orders.color_index / color_label : la couleur choisie par la cliente
-- 3) Trigger : ajuste le stock total ET le stock de la couleur commandée
-- ============================================================

alter table public.products add column if not exists variants jsonb;
alter table public.orders   add column if not exists color_index int;
alter table public.orders   add column if not exists color_label text;

-- Fonction d'ajustement du stock (total + par couleur)
create or replace function public.adjust_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
  idx int;
  cur int;
begin
  if (TG_OP = 'INSERT') then
    if NEW.product_id is not null and NEW.status ::text is distinct from 'annulée' then
      perform apply_stock_delta(NEW.product_id, NEW.color_index, -NEW.quantity);
    end if;
    return NEW;

  elsif (TG_OP = 'DELETE') then
    if OLD.product_id is not null and OLD.status ::text is distinct from 'annulée' then
      perform apply_stock_delta(OLD.product_id, OLD.color_index, OLD.quantity);
    end if;
    return OLD;

  elsif (TG_OP = 'UPDATE') then
    if OLD.status ::text is distinct from 'annulée' and NEW.status ::text = 'annulée' and NEW.product_id is not null then
      perform apply_stock_delta(NEW.product_id, NEW.color_index, NEW.quantity);   -- restitue
    elsif OLD.status ::text = 'annulée' and NEW.status ::text is distinct from 'annulée' and NEW.product_id is not null then
      perform apply_stock_delta(NEW.product_id, NEW.color_index, -NEW.quantity);  -- redéduit
    end if;
    return NEW;
  end if;
  return null;
end;
$$;

-- Applique un delta (+/-) au stock total et, si fourni, au stock de la couleur
create or replace function public.apply_stock_delta(p_id bigint, p_color int, p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
  cur int;
begin
  -- Stock total (jamais < 0)
  update public.products
    set stock = greatest(0, coalesce(stock,0) + p_delta)
    where id = p_id;

  -- Stock de la couleur précise (variants = [{stock, sizes}, ...])
  if p_color is not null then
    select variants into v from public.products where id = p_id;
    if v is not null and jsonb_typeof(v) = 'array' and jsonb_array_length(v) > p_color
       and jsonb_typeof(v -> p_color) = 'object' then
      cur := coalesce((v -> p_color ->> 'stock')::int, 0);
      update public.products
        set variants = jsonb_set(variants, array[p_color::text, 'stock'], to_jsonb(greatest(0, cur + p_delta)))
        where id = p_id;
    end if;
  end if;
end;
$$;

drop trigger if exists trg_adjust_stock on public.orders;
create trigger trg_adjust_stock
  after insert or update or delete on public.orders
  for each row execute function public.adjust_product_stock();
