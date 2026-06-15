-- ============================================================
-- Noms + descriptions des produits en arabe (version bilingue).
-- À exécuter dans Supabase > SQL Editor (une seule fois).
-- Ajoute name_ar / description_ar et pré-remplit les produits actuels.
-- Le site affiche la version arabe quand la langue = "ar".
-- ============================================================

alter table public.products add column if not exists name_ar text;
alter table public.products add column if not exists description_ar text;

update public.products set name_ar = 'سيت إسطنبول',
  description_ar = E'أوفرسايز\nقطن 100% غير مُمشّط' where id = 1;

update public.products set name_ar = 'بيجامة ديور',
  description_ar = E'فيلور حرير\nمستورد من تركيا' where id = 4;

update public.products set name_ar = 'صاك ميو ميو',
  description_ar = 'قُفّة ميو ميو مستوردة من تركيا' where id = 5;

update public.products set name_ar = 'فستان صيفي 2026',
  description_ar = E'فستان انسيابي مريح جدًا من قماش الكريب المجعّد\nمستورد من تركيا' where id = 6;

update public.products set name_ar = 'فستان لانا',
  description_ar = 'فستان لانا فستان ضيّق من قماش الميريل، جودة عالية ومضاد للحساسية 100%' where id = 7;

update public.products set name_ar = 'سيت لانا',
  description_ar = 'عباية كمراية وفوندو فستان ضيّق' where id = 8;

update public.products set name_ar = 'بيجامة فيكتوريا سيكريت',
  description_ar = E'بيجامة قطعتين تونيك وشورت من قطن ليكرا\nمستورد من تركيا' where id = 9;

update public.products set name_ar = 'سيت كروازيه',
  description_ar = E'سيت كروازيه\nسروال واسع وتونيك كرواز من كريب الحرير' where id = 10;

update public.products set name_ar = 'فستان غُنَش',
  description_ar = E'فستان طويل بلون أصفر باستيل ناعم مع تفاصيل من الدانتيل الرقيق، يوحي بالخفّة والشمس والأناقة الصيفية.\nمستورد من تركيا' where id = 11;

update public.products set name_ar = 'بوشيت سواريه',
  description_ar = E'بوشيت سواريه ذهبية مع حزام كتف ذهبي وسوار\nمستوردة من تركيا' where id = 12;

update public.products set name_ar = 'بوشيت سواريه روز غولد',
  description_ar = E'بوشيت سواريه بلون روز غولد\nمع حزام كتف لؤلؤي وسوار\nمستوردة من تركيا' where id = 13;

update public.products set name_ar = 'بوشيت لوي فيتون',
  description_ar = E'بوشيت لوي فيتون مع 3 جيوب\nمستوردة من تركيا' where id = 14;

update public.products set name_ar = 'إيشارب فندي',
  description_ar = E'إيشارب ماركة فندي من الحرير\nمستورد من تركيا' where id = 15;

update public.products set name_ar = 'طقم تروسو لوي فيتون',
  description_ar = E'باك 4 تروسوات للترتيب ماركة لوي فيتون من الجلد بلون بني\nمستورد من تركيا' where id = 16;
