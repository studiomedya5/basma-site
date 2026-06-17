-- ============================================================
-- SÉCURITÉ — PHASE A (ADDITIVE, ne casse rien)
-- À exécuter dans Supabase > SQL Editor, AVANT de déployer le front.
-- ============================================================
-- Objectif : préparer l'accès admin "authenticated" + la validation
-- promo serveur, SANS encore retirer les droits "anon".
-- À ce stade, l'ancien admin (clé anon) ET le nouveau (session Auth)
-- fonctionnent tous les deux. Le verrouillage se fait en Phase C.
-- ============================================================

-- ── 1) Fonction de validation des codes promo (SECURITY DEFINER) ──
-- Permet au checkout public de valider un code SANS exposer la table
-- promo_codes ni la table orders. Renvoie un JSON :
--   { valid: bool, free_shipping: bool, reason: 'ok'|'invalid'|'expired'|'used' }
create or replace function public.validate_promo_code(p_code text, p_phone text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v public.promo_codes%rowtype;
  used int;
begin
  if p_code is null or length(trim(p_code)) = 0 then
    return jsonb_build_object('valid', false, 'free_shipping', false, 'reason', 'invalid');
  end if;

  select * into v
    from public.promo_codes
   where upper(code) = upper(trim(p_code))
     and active = true
   limit 1;

  if not found then
    return jsonb_build_object('valid', false, 'free_shipping', false, 'reason', 'invalid');
  end if;

  if v.expires_at is not null and v.expires_at < now() then
    return jsonb_build_object('valid', false, 'free_shipping', false, 'reason', 'expired');
  end if;

  -- 1 seule utilisation par numéro de téléphone
  if p_phone is not null and length(trim(p_phone)) > 0 then
    select count(*) into used
      from public.orders
     where promo_code = v.code
       and customer_phone = trim(p_phone);
    if used > 0 then
      return jsonb_build_object('valid', false, 'free_shipping', v.free_shipping, 'reason', 'used');
    end if;
  end if;

  return jsonb_build_object('valid', true, 'free_shipping', coalesce(v.free_shipping, true), 'reason', 'ok');
end;
$$;

-- Seule cette fonction est exécutable publiquement (pas la table).
revoke all on function public.validate_promo_code(text, text) from public;
grant execute on function public.validate_promo_code(text, text) to anon, authenticated;

-- ── 2) Droits ADMIN (rôle authenticated) — additifs ──
-- orders : RLS déjà activé. On ajoute une policy "tout permis" pour l'admin connecté.
drop policy if exists "orders_auth_all" on public.orders;
create policy "orders_auth_all" on public.orders
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.orders to authenticated;

-- promo_codes : idem
drop policy if exists "promo_auth_all" on public.promo_codes;
create policy "promo_auth_all" on public.promo_codes
  for all to authenticated using (true) with check (true);
grant select, insert, update, delete on public.promo_codes to authenticated;

-- products : on s'assure que l'admin connecté garde tous les droits.
-- (Le verrouillage RLS de products se fait en Phase C.)
grant select, insert, update, delete on public.products to authenticated;

-- ============================================================
-- Après cette phase : créer le compte admin dans Authentication > Users,
-- désactiver les inscriptions publiques, puis déployer le front.
-- Vérifier que le login admin fonctionne AVANT de lancer la Phase C.
-- ============================================================
