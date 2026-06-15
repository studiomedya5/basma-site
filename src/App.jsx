import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";
import CollectionPage from "./CollectionPage";
import ContactPage from "./ContactPage";
import SummerDecor from "./SummerDecor";
import OrderModal from "./components/OrderModal";
import AdminPage from "./components/AdminPage";
import Cart from "./components/Cart";
import { useCart } from "./context/CartContext";
import AnnouncementBar, { ANNOUNCE_H } from "./components/AnnouncementBar";
import LookbookPage from "./LookbookPage";
import OnboardingTour from "./components/OnboardingTour";
import SwipeBack from "./components/SwipeBack";
import { catIdFromKey } from "./lib/productKey";
import { useLang } from "./context/LangContext";

// Détecte un lien produit partagé : /produit/<clé> (sponsoring Facebook)
const DEEP_LINK = (() => {
  const m = window.location.pathname.match(/^\/produit\/(.+)$/);
  return m ? decodeURIComponent(m[1].replace(/\/$/, "")) : null;
})();

// ─── Translations ────────────────────────────────────────────
const TRANSLATIONS = {
  fr: {
    ticker: "🚚 Livraison gratuite pour toute commande supérieure à 100 DT  ✨ Paiement à la livraison partout en Tunisie  🌹 Nouvelle collection disponible maintenant  ",
    nav: ["ACCUEIL", "COLLECTION", "CONTACT"],
    langBtn: "عربي",
  },
  ar: {
    ticker: "🚚 توصيل مجاني لكل طلب يتجاوز 100 د.ت  ✨ الدفع عند الاستلام في كامل تونس  🌹 مجموعة جديدة متاحة الآن  ",
    nav: ["الرئيسية", "المجموعة", "تواصل"],
    langBtn: "FR",
  },
};

// ─── Collection categories (homepage grid) ───────────────────
const COLLECTION_CATEGORIES = [
  { id: "3ibaya",  label: "Abaya",   price: 120, photos: ["487447137_1098233225650757_818704683323925263_n.jpg","488374854_1098231745650905_8820862824133621922_n.jpg","488656760_1098232708984142_7631459729480207435_n.jpg","641057449_17935739097179373_2825300746075166942_n.jpg","648102785_1371074615033282_5385296663968872502_n.jpg"] },
  { id: "echarpe", label: "Écharpe", price: 35,  photos: ["587840430_17925997047179373_2959763835755661799_n.jpg","588084802_17925997029179373_8431155902852837248_n.jpg","589062375_17925996990179373_8845487259511413527_n.jpg","595502671_1298811695592908_1151798460515221855_n.jpg"] },
  { id: "jiba",    label: "Jiba",    price: 90,  photos: ["498947811_17903534622179373_3600286315845092783_n.jpg","499366748_17903534595179373_7559916904546442049_n.jpg","499406882_1134013042072775_8705946179588991738_n.jpg","499602625_17903534667179373_4535199890911258257_n.jpg","499833958_17903534649179373_903899459310677770_n.jpg"] },
  { id: "kids",    label: "Kids",    price: 60,  photos: ["645995833_1370344885106255_9157182548210132803_n.jpg","646076253_1370344838439593_3346000056858945782_n.jpg","649876591_1375551517918925_6681548330046473505_n.jpg","650825674_1375601961247214_9084526571701164849_n.jpg"] },
  { id: "manteau", label: "Manteau", price: 200, photos: ["579423101_1277387817735296_2206184981912267833_n.jpg","579550354_1277389351068476_4317445584969625127_n.jpg","631284553_17933675226179373_5747483335467394828_n.jpg","631604059_17933767830179373_7389489587997262940_n.jpg"] },
  { id: "MDB",     label: "MDB",     price: 110, photos: ["496049480_1128525475954865_2540523400201882755_n.jpg","496263120_1128525229288223_2489261562133792631_n.jpg","497885050_1131003555707057_3874941570880894198_n.jpg","499066487_1132573475550065_5434042430597513079_n.jpg","505353945_1156440629830016_8647673457501953606_n.jpg"] },
  { id: "pyjama",  label: "Pyjama",  price: 42,  photos: ["490345086_1118998213574258_6134831431061358690_n.jpg","492617363_1119002820240464_4055654624926574235_n.jpg","579083507_1276299481177463_446330100554526195_n.jpg","589159541_17926554309179373_4773932076652099313_n.jpg"] },
  { id: "Robe",    label: "Robe",    price: 69,  photos: ["649636396_1374861407987936_6370692347574891488_n.jpg","649665854_1374861444654599_6644258085429623943_n.jpg","650287811_1375865401220870_230421896988538844_n.jpg","650839941_1375865431220867_1210585044214971859_n.jpg"] },
  { id: "Sac",     label: "Sac",     price: 50,  photos: ["631720297_1352112070262870_4847811711877564932_n.jpg","631917370_1352111973596213_194994035129029681_n.jpg","633207472_1352112016929542_6323390260047978267_n.jpg","633375719_1352111933596217_4381281051821960200_n.jpg"] },
  { id: "set",     label: "Set",     price: 69,  photos: ["493138870_1143811757759570_6677303497939193345_n.jpg","503595961_1144400911033988_4417601806757851793_n.jpg","549864507_1232854562188622_2760973217095054367_n.jpg","627056759_17932957533179373_8778773970641450727_n.jpg","648685767_17937284784179373_1588006055100656717_n.jpg"] },
];

// ─── Static categories ──────────────────────────────────────
const categories = ["Tout", "Popular", "Hot", "New"];

// ─── Exclusifs tabs → collection categories (vraies photos) ──
const exclusifsData = {
  Popular: [
    {
      id: "3ibaya",
      label: "Abaya",
      imgs: [
        "/photos/3ibaya/487447137_1098233225650757_818704683323925263_n.jpg",
        "/photos/3ibaya/488374854_1098231745650905_8820862824133621922_n.jpg",
        "/photos/3ibaya/641057449_17935739097179373_2825300746075166942_n.jpg",
        "/photos/3ibaya/648102785_1371074615033282_5385296663968872502_n.jpg",
      ],
    },
    {
      id: "jiba",
      label: "Jiba",
      imgs: [
        "/photos/jiba/498947811_17903534622179373_3600286315845092783_n.jpg",
        "/photos/jiba/499366748_17903534595179373_7559916904546442049_n.jpg",
        "/photos/jiba/499602625_17903534667179373_4535199890911258257_n.jpg",
        "/photos/jiba/499833958_17903534649179373_903899459310677770_n.jpg",
      ],
    },
    {
      id: "pyjama",
      label: "Pyjama",
      imgs: [
        "/photos/pyjama/490345086_1118998213574258_6134831431061358690_n.jpg",
        "/photos/pyjama/492617363_1119002820240464_4055654624926574235_n.jpg",
        "/photos/pyjama/579083507_1276299481177463_446330100554526195_n.jpg",
        "/photos/pyjama/589159541_17926554309179373_4773932076652099313_n.jpg",
      ],
    },
    {
      id: "Robe",
      label: "Robe",
      imgs: [
        "/photos/Robe/649636396_1374861407987936_6370692347574891488_n.jpg",
        "/photos/Robe/649665854_1374861444654599_6644258085429623943_n.jpg",
        "/photos/Robe/650287811_1375865401220870_230421896988538844_n.jpg",
        "/photos/Robe/650839941_1375865431220867_1210585044214971859_n.jpg",
      ],
    },
  ],
  Hot: [
    {
      id: "set",
      label: "Set",
      imgs: [
        "/photos/set/549864507_1232854562188622_2760973217095054367_n.jpg",
        "/photos/set/503595961_1144400911033988_4417601806757851793_n.jpg",
        "/photos/set/627056759_17932957533179373_8778773970641450727_n.jpg",
        "/photos/set/648685767_17937284784179373_1588006055100656717_n.jpg",
      ],
    },
    {
      id: "Sac",
      label: "Sac",
      imgs: [
        "/photos/Sac/631720297_1352112070262870_4847811711877564932_n.jpg",
        "/photos/Sac/631917370_1352111973596213_194994035129029681_n.jpg",
        "/photos/Sac/633207472_1352112016929542_6323390260047978267_n.jpg",
        "/photos/Sac/633375719_1352111933596217_4381281051821960200_n.jpg",
      ],
    },
    {
      id: "manteau",
      label: "Manteau",
      imgs: [
        "/photos/manteau/579423101_1277387817735296_2206184981912267833_n.jpg",
        "/photos/manteau/579550354_1277389351068476_4317445584969625127_n.jpg",
        "/photos/manteau/631604059_17933767830179373_7389489587997262940_n.jpg",
        "/photos/manteau/630629104_17933675214179373_4861346317016091070_n.jpg",
      ],
    },
  ],
  New: [
    {
      id: "kids",
      label: "Kids",
      imgs: [
        "/photos/kids/645995833_1370344885106255_9157182548210132803_n.jpg",
        "/photos/kids/646076253_1370344838439593_3346000056858945782_n.jpg",
        "/photos/kids/649876591_1375551517918925_6681548330046473505_n.jpg",
        "/photos/kids/650825674_1375601961247214_9084526571701164849_n.jpg",
      ],
    },
    {
      id: "MDB",
      label: "MDB",
      imgs: [
        "/photos/MDB/496049480_1128525475954865_2540523400201882755_n.jpg",
        "/photos/MDB/496263120_1128525229288223_2489261562133792631_n.jpg",
        "/photos/MDB/497885050_1131003555707057_3874941570880894198_n.jpg",
        "/photos/MDB/505353945_1156440629830016_8647673457501953606_n.jpg",
      ],
    },
    {
      id: "echarpe",
      label: "Écharpe",
      imgs: [
        "/photos/echarpe/587840430_17925997047179373_2959763835755661799_n.jpg",
        "/photos/echarpe/588084802_17925997029179373_8431155902852837248_n.jpg",
        "/photos/echarpe/589062375_17925996990179373_8845487259511413527_n.jpg",
        "/photos/echarpe/595502671_1298811695592908_1151798460515221855_n.jpg",
      ],
    },
  ],
};

exclusifsData.Tout = [
  ...exclusifsData.Popular,
  ...exclusifsData.Hot,
  ...exclusifsData.New,
];

// ─── Animated Exclusifs Card ──────────────────────────────────
function ExcluCard({ item, index, onNavigate }) {
  const { t } = useLang();
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const pausedRef = useRef(false);

  useEffect(() => {
    pausedRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const t = setInterval(() => {
      if (!pausedRef.current) {
        setImgIdx((i) => (i + 1) % item.imgs.length);
      }
    }, 2800);
    return () => clearInterval(t);
  }, [item.imgs.length]);

  return (
    <div
      className="product-card"
      style={{
        background: "white",
        cursor: "pointer",
        animation: `fadeUp 0.55s ease ${0.08 * index}s both`,
        boxShadow: hovered
          ? "0 18px 50px rgba(0,0,0,0.16)"
          : "0 3px 18px rgba(0,0,0,0.07)",
        transform: hovered ? "translateY(-7px)" : "translateY(0)",
        transition:
          "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease",
        overflow: "hidden",
      }}
      onClick={() => onNavigate(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{ position: "relative", overflow: "hidden", aspectRatio: "3/4" }}
      >
        {item.imgs.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={item.label}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: i === imgIdx ? 1 : 0,
              transition: "opacity 1.4s cubic-bezier(0.4,0,0.2,1)",
              zIndex: i === imgIdx ? 2 : 1,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 5,
            zIndex: 8,
          }}
        >
          {item.imgs.map((_, i) => (
            <div
              key={i}
              style={{
                height: 3,
                borderRadius: 2,
                width: i === imgIdx ? 18 : 5,
                background:
                  i === imgIdx ? "white" : "rgba(255,255,255,0.35)",
                transition: "width 0.5s ease, background 0.4s",
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 6,
            background:
              "linear-gradient(to top, rgba(44,33,23,0.6) 0%, rgba(44,33,23,0.1) 60%, transparent 100%)",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.35s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 36,
            left: 0,
            right: 0,
            zIndex: 7,
            display: "flex",
            justifyContent: "center",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          <span
            style={{
              fontFamily: "'Jost',sans-serif",
              fontSize: 10,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "white",
              background: "var(--gold)",
              padding: "8px 20px",
            }}
          >
            {t("see_collection_word")}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "13px 16px",
          borderTop: "1px solid rgba(200,149,108,0.12)",
        }}
      >
        <h3
          style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 18,
            fontWeight: 500,
            color: "var(--dark)",
            margin: 0,
          }}
        >
          {item.label}
        </h3>
      </div>
    </div>
  );
}

// ─── Carrousel Photos (hero slider) ─────────────────────────
const galleryPhotos = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg",
  "7.jpg",
  "8.jpg",
  "9.jpg",
  "10.jpg",
  "11.jpg",
  "12.jpg",
  "13.jpg",
  "14.jpg",
  "sac1.jpg",
  "sac2.jpg",
  "sac3.jpg",
  "492617363_1119002820240464_4055654624926574235_n.jpg",
  "549864507_1232854562188622_2760973217095054367_n.jpg",
  "579083507_1276299481177463_446330100554526195_n.jpg",
  "579390802_1276298841177527_9096355951208059728_n.jpg",
  "579423101_1277387817735296_2206184981912267833_n.jpg",
  "589159541_17926554309179373_4773932076652099313_n.jpg",
  "590482479_17926554318179373_3929513711600136633_n.jpg",
  "631604059_17933767830179373_7389489587997262940_n.jpg",
  "631720297_1352112070262870_4847811711877564932_n.jpg",
  "631917370_1352111973596213_194994035129029681_n.jpg",
  "633207472_1352112016929542_6323390260047978267_n.jpg",
  "633375719_1352111933596217_4381281051821960200_n.jpg",
  "634743500_17934788058179373_1514141254197804076_n.jpg",
  "645995833_1370344885106255_9157182548210132803_n.jpg",
  "648690320_1372503324890411_4987795754496219365_n.jpg",
  "649871571_1375601994580544_2088247681471175482_n.jpg",
  "649884125_1375551551252255_8133070511646187938_n.jpg",
  "650829522_1375601927913884_8875948773283361845_n.jpg",
  "650831842_1375551661252244_8326199711515305436_n.jpg",
  "airport.png",
].map((f) => `/photos/carrousel/${f}`);

// ─── SVG Icons ──────────────────────────────────────────────
const HeartIcon = ({ filled }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill={filled ? "#C8956C" : "none"}
    stroke={filled ? "#C8956C" : "#999"}
    strokeWidth="2"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CartIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MinusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="3"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <line x1="3" y1="7" x2="21" y2="7" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="17" x2="21" y2="17" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

// ─── Avis Clients ───────────────────────────────────────────
const avisPhotos = [
  "613305422_17930421420179373_948083869247423410_n.jpg",
  "573055904_1267916582015753_4648795093125359844_n.jpg",
  "600986824_17927466804179373_560503238053382020_n.jpg",
];

function AvisGrid() {
  const [lightbox, setLightbox] = useState(null);
  const [hovered, setHovered] = useState(null);

  return (
    <>
      <div
        className="avis-row"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {avisPhotos.map((f, i) => (
          <div
            key={i}
            onClick={() => setLightbox(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "relative",
              cursor: "zoom-in",
              background: "white",
              overflow: "hidden",
              borderRadius: 2,
              border: "1px solid rgba(200,149,108,0.18)",
              boxShadow:
                hovered === i
                  ? "0 20px 56px rgba(0,0,0,0.18)"
                  : "0 4px 20px rgba(0,0,0,0.06)",
              transform:
                hovered === i ? "translateY(-10px) scale(1.012)" : "translateY(0) scale(1)",
              transition:
                "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease",
              animation: `fadeUp 0.6s ease ${0.12 * i}s both`,
            }}
          >
            <div
              style={{
                height: 3,
                background:
                  hovered === i
                    ? "var(--gold)"
                    : "linear-gradient(to right, transparent, rgba(200,149,108,0.4), transparent)",
                transition: "background 0.4s ease",
              }}
            />
            <div style={{ overflow: "hidden" }}>
              <img
                src={`/photos/avis/${f}`}
                alt={`Avis cliente ${i + 1}`}
                loading="lazy"
                decoding="async"
                style={{
                  width: "100%",
                  display: "block",
                  objectFit: "contain",
                  transform: hovered === i ? "scale(1.04)" : "scale(1)",
                  transition: "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
                }}
              />
            </div>
            <div
              style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(200,149,108,0.1)",
              }}
            >
              <div>
                <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                  {[...Array(5)].map((_, s) => (
                    <svg
                      key={s}
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="var(--gold)"
                      stroke="none"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p
                  style={{
                    fontFamily: "'Jost',sans-serif",
                    fontSize: 11,
                    color: "var(--text-muted)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  Cliente vérifiée
                </p>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(200,149,108,0.4)"
                strokeWidth="1.5"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {lightbox !== null && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(0,0,0,0.92)",
            WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            animation: "fadeIn 0.25s ease",
          }}
        >
          {lightbox > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((l) => l - 1);
              }}
              style={{
                position: "absolute",
                left: 24,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          <img
            src={`/photos/avis/${avisPhotos[lightbox]}`}
            alt="Avis"
            style={{ maxWidth: "88vw", maxHeight: "88vh", objectFit: "contain", animation: "fadeUp 0.3s ease" }}
          />

          {lightbox < avisPhotos.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((l) => l + 1);
              }}
              style={{
                position: "absolute",
                right: 24,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          <button
            onClick={() => setLightbox(null)}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "white",
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

    </>
  );
}

// ─── Homepage Collection Card (avec carrousel) ───────────────
function CollectionCategoryCard({ cat, delay, onClick, comingSoon, coverPhotos }) {
  const { t } = useLang();
  const [imgIdx, setImgIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const pausedRef = useRef(false);

  // Couverture = vraies photos produits si dispo, sinon photos statiques
  const photos = (coverPhotos && coverPhotos.length)
    ? coverPhotos
    : cat.photos.map((p) => `/photos/${cat.id}/${p}`);

  useEffect(() => {
    pausedRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => {
      if (!pausedRef.current) {
        setImgIdx((i) => (i + 1) % photos.length);
      }
    }, 2000);
    return () => clearInterval(t);
  }, [photos.length]);

  return (
    <div
      onClick={comingSoon ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        // Coming Soon : visible mais non cliquable (curseur normal, pas d'effet de survol)
        cursor: comingSoon ? "default" : "pointer",
        background: "white",
        boxShadow: (hovered && !comingSoon) ? "0 16px 48px rgba(0,0,0,0.16)" : "0 2px 16px rgba(0,0,0,0.07)",
        transform: (hovered && !comingSoon) ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease",
        animation: `fadeUp 0.6s ease ${delay * 0.06}s both`,
      }}
    >
      {/* Photo carousel */}
      <div className="sq-card" style={{ margin: 0 }}>
        {photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={cat.label}
            loading="lazy"
            decoding="async"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              opacity: i === imgIdx ? 1 : 0,
              transition: "opacity 1.2s cubic-bezier(0.4,0,0.2,1)",
              zIndex: i === imgIdx ? 2 : 1,
              filter: comingSoon ? "grayscale(0.55) brightness(0.9)" : "none",
            }}
          />
        ))}

        {/* Voile + badge Coming Soon */}
        {comingSoon && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 6,
            background: "rgba(20,14,8,0.42)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 8, pointerEvents: "none",
          }}>
            <span style={{
              fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "3px",
              textTransform: "uppercase", color: "white",
              border: "1px solid rgba(255,255,255,0.7)", padding: "8px 18px",
              background: "rgba(201,168,76,0.85)",
            }}>
              {t("coming_soon")}
            </span>
            <span style={{
              fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "1.5px",
              color: "rgba(255,255,255,0.85)",
            }}>
              {t("soon_available")}
            </span>
          </div>
        )}

        {/* Navigation dots */}
        <div style={{
          position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 5, zIndex: 8,
        }}>
          {photos.map((_, i) => (
            <div key={i} style={{
              height: 3, borderRadius: 2,
              width: i === imgIdx ? 18 : 5,
              background: i === imgIdx ? "white" : "rgba(255,255,255,0.35)",
              transition: "width 0.5s ease, background 0.4s",
            }} />
          ))}
        </div>

        {/* Vignette */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "28%",
          background: "linear-gradient(transparent, rgba(0,0,0,0.18))",
          zIndex: 3, pointerEvents: "none",
        }} />

        {/* Gold accent line */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: 2,
          background: "var(--gold)", zIndex: 5,
          width: hovered ? "100%" : "0%",
          transition: "width 0.45s cubic-bezier(0.25,0.46,0.45,0.94)",
        }} />
      </div>

      {/* Info band */}
      <div style={{
        background: "white", padding: "14px 18px 16px",
        borderTop: "1px solid rgba(200,149,108,0.12)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      }}>
        <div>
          <span style={{ display: "block", fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 500, color: "var(--dark)", letterSpacing: "0.2px", lineHeight: 1.2, marginBottom: 4 }}>
            {t(`cat_${cat.id}`)}
          </span>
          <span style={{ display: "block", fontFamily: "'Jost',sans-serif", fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.5px" }}>
            {comingSoon ? t("new_collection") : t("from_price")}
          </span>
        </div>
        {comingSoon ? (
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600, color: "var(--gold)", letterSpacing: "1.5px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
            {t("coming_soon")}
          </span>
        ) : (
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--gold)", whiteSpace: "nowrap" }}>
            {cat.price} ت.د
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [page, setPage] = useState(() =>
    window.location.pathname === "/admin" ? "admin" : DEEP_LINK ? "collection" : "home"
  );
  const [activeCategory, setActiveCategory] = useState("Tout");

  const { items: cart, addItem, count: totalItems, total: totalPrice, isOpen: showCart, setIsOpen: setShowCart } = useCart();

  const [sliderIndex, setSliderIndex] = useState(0);
  const sliderTimer = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [showProduct, setShowProduct] = useState(null);
  const [addedToCart, setAddedToCart] = useState(null);
  const [selectedSize, setSelectedSize] = useState({});
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [orderProduct, setOrderProduct] = useState(null);
  const [collectionTarget, setCollectionTarget] = useState(() => DEEP_LINK ? catIdFromKey(DEEP_LINK) : null);
  const [deepLink, setDeepLink] = useState(DEEP_LINK);

  // ── Intégration de l'historique navigateur ─────────────────
  // Empêche le bouton "précédent" (et le geste retour mobile) de quitter
  // le site : chaque navigation pousse une entrée, et "retour" remonte
  // d'un niveau au lieu de sortir.
  const pageRef = useRef(page);
  const collRef = useRef(collectionTarget);
  useEffect(() => { pageRef.current = page; }, [page]);
  useEffect(() => { collRef.current = collectionTarget; }, [collectionTarget]);

  const pushTrap = () => window.history.pushState({ basma: true }, "", window.location.pathname);
  const navHome = () => { setPage("home"); setCollectionTarget(null); setDeepLink(null); };
  const navCollection = (catId = null) => { setPage("collection"); setCollectionTarget(catId); pushTrap(); };
  const navContact = () => { setPage("contact"); pushTrap(); };
  const goBack = () => window.history.back();

  useEffect(() => {
    const onPop = () => {
      if (window.__basmaModalOpen) return; // la fenêtre produit gère son propre retour
      const p = pageRef.current, sel = collRef.current;
      if (p === "collection" && sel) {
        setCollectionTarget(null); // catégorie → grille des collections
        pushTrap();                // on reste dans le site
      } else if (p === "collection" || p === "contact" || p === "admin") {
        navHome();                 // grille / contact / admin → accueil
      }
      // p === "home" → on laisse le navigateur quitter le site
    };
    if (pageRef.current !== "home") pushTrap(); // tampon si on arrive en profondeur
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showLookbook, setShowLookbook] = useState(false);
  const { lang, setLang, t } = useLang();

  const shopRef = useRef(null);
  const collectionRef = useRef(null);
  const nouvellesRef = useRef(null);
  const contactRef = useRef(null);
  const audioRef = useRef(null);

  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("id", { ascending: true });


      if (error) {
        console.error("Erreur chargement produits:", error);
        return;
      }

      setProducts(
        (data || []).map((p) => ({
          ...p,
          oldPrice: p.oldPrice ?? p.old_price ?? null,
          sizes: p.sizes ?? ["S", "M", "L", "XL"],
        }))
      );
      setProductsLoaded(true);
    };

    loadProducts();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      setShowTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.3;
    const play = () => audio.play().catch(() => {});
    play();
    document.addEventListener("click", play, { once: true });
    return () => document.removeEventListener("click", play);
  }, []);

  // Catégories ayant au moins un produit actif (tri + "Coming Soon")
  const activeCatLabels = new Set(
    products.filter((p) => p.is_active).map((p) => p.category)
  );
  // Photos de couverture = vraies photos des produits de chaque catégorie
  const catCoverImages = {};
  products.forEach((p) => {
    if (p.is_active && Array.isArray(p.images) && p.images.length) {
      if (!catCoverImages[p.category]) catCoverImages[p.category] = [];
      catCoverImages[p.category].push(p.images[0]);
    }
  });
  const sortedCollectionCats = [...COLLECTION_CATEGORIES].sort((a, b) => {
    const ax = activeCatLabels.has(a.label) ? 0 : 1;
    const bx = activeCatLabels.has(b.label) ? 0 : 1;
    return ax - bx;
  });

  const filtered = products
    .filter((p) => activeCategory === "Tout" || p.tag === activeCategory)
    .filter(
      (p) =>
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const addToCart = (product, size) => {
    const sz = size || selectedSize[product.id] || product.sizes[0];
    addItem({ ...product, size: sz });
    setAddedToCart(product.id);
    setNotification(`${product.name} ajouté au panier`);
    setTimeout(() => {
      setAddedToCart(null);
      setNotification(null);
    }, 2000);
  };

  const toggleFav = (id) =>
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const scrollToShop = () => shopRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToCollection = () =>
    collectionRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToNouvelles = () =>
    nouvellesRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToContact = () =>
    contactRef.current?.scrollIntoView({ behavior: "smooth" });
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navActions = [
    scrollToTop,
    () => navCollection(null),
    () => navContact(),
  ];

  const sliderNext = useCallback(
    () => setSliderIndex((i) => (i + 1) % galleryPhotos.length),
    []
  );

  const sliderPrev = () =>
    setSliderIndex((i) => (i - 1 + galleryPhotos.length) % galleryPhotos.length);

  useEffect(() => {
    sliderTimer.current = setInterval(sliderNext, 4500);
    return () => clearInterval(sliderTimer.current);
  }, [sliderNext]);

  const waMessage = encodeURIComponent(
    "Bonjour Basma! Je souhaite commander:\n" +
      cart
        .map(
          (i) =>
            `• ${i.name} (Taille: ${i.size}) x${i.qty} — ${i.price * i.qty} ت.د`
        )
        .join("\n") +
      `\n\nTotal: ${totalPrice} ت.د`
  );

  return (
    <>
      <audio ref={audioRef} src="/son.mp3" loop preload="auto" />

      <button
        onClick={toggleMute}
        title={muted ? "Activer le son" : "Couper le son"}
        className="mute-btn"
        style={{
          position: "fixed",
          bottom: 24,
          left: 24,
          zIndex: 900,
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "rgba(250,247,242,0.92)",
          border: "1px solid rgba(200,149,108,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
          transition: "all 0.25s",
          color: "var(--gold)",
        }}
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      <a
        href="https://wa.me/21629930212"
        target="_blank"
        rel="noopener noreferrer"
        className="wa-btn"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 900,
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "rgba(250,247,242,0.92)",
          border: "1px solid rgba(200,149,108,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
          transition: "all 0.25s",
          textDecoration: "none",
        }}
        title="Nous contacter sur WhatsApp"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--gold)">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      {/* Bouton scroll-to-top uniquement sur la home (les autres pages ont le leur) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        title="Retour en haut"
        className="scroll-top-btn"
        style={{
          position: "fixed",
          bottom: 74,
          right: 24,
          zIndex: 900,
          width: 42,
          height: 42,
          borderRadius: "50%",
          background: "rgba(250,247,242,0.92)",
          border: "1px solid rgba(200,149,108,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
          transition: "all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
          color: "var(--gold)",
          opacity: showTop && page === "home" ? 1 : 0,
          transform: showTop && page === "home" ? "translateY(0) scale(1)" : "translateY(14px) scale(0.8)",
          pointerEvents: showTop && page === "home" ? "auto" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>

      {page === "admin" ? (
        <AdminPage onBack={() => { navHome(); window.history.pushState({}, "", "/"); }} />
      ) : page === "collection" ? (
        <SwipeBack onBack={goBack}>
          <CollectionPage
            onBack={navHome}
            selected={collectionTarget}
            onOpenCategory={(catId) => navCollection(catId)}
            goBack={goBack}
            initialProductKey={deepLink}
          />
        </SwipeBack>
      ) : page === "contact" ? (
        <SwipeBack onBack={goBack}>
          <ContactPage onBack={navHome} />
        </SwipeBack>
      ) : (
        <>
          <SummerDecor />

          {notification && (
            <div
              style={{
                position: "fixed",
                top: 80,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 3000,
                background: "var(--dark)",
                color: "white",
                padding: "12px 28px",
                borderRadius: 50,
                fontFamily: "'Jost',sans-serif",
                fontSize: 13,
                fontWeight: 500,
                animation: "notifSlide 0.3s ease",
                boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckIcon /> {notification}
            </div>
          )}

          {/* ── Announcement bar ── */}
          <AnnouncementBar />

          {/* ── Nav ── */}
          <nav
            style={{
              position: "fixed",
              top: ANNOUNCE_H,
              left: 0,
              right: 0,
              zIndex: 1000,
              height: 70,
              background: scrolled ? "rgba(250,247,242,0.97)" : "transparent",
              WebkitBackdropFilter: scrolled ? "blur(16px)" : "none", backdropFilter: scrolled ? "blur(16px)" : "none",
              borderBottom: scrolled ? "1px solid rgba(200,149,108,0.15)" : "none",
              transition: "all 0.4s ease",
              padding: "0 clamp(20px,4vw,60px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Logo — centered on mobile via CSS class */}
            <div className="nav-logo-wrap" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src="/images/logo.png" alt="Basma" style={{ height: 42 }} />
            </div>

            {/* Desktop nav links */}
            <div className="nav-links-desktop" style={{ display: "flex", gap: 36, alignItems: "center" }}>
              {TRANSLATIONS[lang].nav.map((item, i) => (
                <a key={item} className="nav-link" onClick={() => navActions[i]()}>
                  {item}
                </a>
              ))}
            </div>

            {/* Right icons */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                {showSearch && (
                  <div
                    className="search-input-wrap"
                    style={{
                      position: "absolute",
                      right: 36,
                      top: "50%",
                      transform: "translateY(-50%)",
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid rgba(200,149,108,0.4)",
                      background: "rgba(250,247,242,0.97)",
                      WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
                      animation: "fadeIn 0.2s ease",
                    }}
                  >
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setShowSearch(false);
                          setSearchQuery("");
                        }
                        if (e.key === "Enter" && searchQuery.trim()) scrollToShop();
                      }}
                      placeholder="Rechercher..."
                      style={{
                        width: 190,
                        padding: "8px 10px 8px 14px",
                        border: "none",
                        fontFamily: "'Jost',sans-serif",
                        fontSize: 13,
                        outline: "none",
                        background: "transparent",
                        color: "var(--dark)",
                      }}
                    />
                  </div>
                )}
                <button
                  onClick={() => { setShowSearch((s) => !s); if (showSearch) setSearchQuery(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4 }}
                  title="Rechercher"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>

              <button
                onClick={() => {}}
                style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4 }}
                title="Favoris"
              >
                <HeartIcon filled={favorites.length > 0} />
                {favorites.length > 0 && (
                  <span style={{
                    position: "absolute", top: -5, right: -7,
                    background: "var(--gold)", color: "white",
                    fontSize: 10, fontWeight: 700, width: 18, height: 18,
                    borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", fontFamily: "'Jost',sans-serif",
                  }}>
                    {favorites.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowCart(true)}
                style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4 }}
                title="Panier"
              >
                <CartIcon />
                {totalItems > 0 && (
                  <span style={{
                    position: "absolute", top: -5, right: -7,
                    background: "var(--gold)", color: "white",
                    fontSize: 10, fontWeight: 700, width: 18, height: 18,
                    borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", fontFamily: "'Jost',sans-serif",
                  }}>
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Language toggle */}
              <button
                onClick={() => setLang((l) => l === "fr" ? "ar" : "fr")}
                style={{
                  background: "none", border: "1px solid rgba(200,149,108,0.45)",
                  padding: "4px 10px", borderRadius: 2, cursor: "pointer",
                  fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "1px",
                  color: "var(--dark)", transition: "all 0.2s",
                }}
              >
                {TRANSLATIONS[lang].langBtn}
              </button>

              {/* Hamburger */}
              <button
                className="mobile-btn"
                onClick={() => setMobileMenu(!mobileMenu)}
                style={{ display: "none", background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4 }}
              >
                {mobileMenu ? <CloseIcon /> : <MenuIcon />}
              </button>
            </div>
          </nav>

          {/* ── Mobile Drawer ── */}
          {mobileMenu && (
            <>
              <div
                onClick={() => setMobileMenu(false)}
                style={{ position: "fixed", inset: 0, zIndex: 1500, background: "rgba(0,0,0,0.45)", animation: "fadeIn 0.2s ease" }}
              />
              <div style={{
                position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 1600,
                width: "min(300px,80vw)", background: "var(--cream)",
                animation: "slideIn 0.3s ease",
                display: "flex", flexDirection: "column",
                padding: `${ANNOUNCE_H + 50}px 32px 40px`,
                boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
              }}>
                <button
                  onClick={() => setMobileMenu(false)}
                  style={{ position: "absolute", top: ANNOUNCE_H + 16, right: 20, background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4 }}
                >
                  <CloseIcon />
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                  {TRANSLATIONS[lang].nav.map((item, i) => (
                    <a
                      key={item}
                      className="nav-link"
                      style={{ fontSize: 14, letterSpacing: "3px" }}
                      onClick={() => { navActions[i](); setMobileMenu(false); }}
                    >
                      {item}
                    </a>
                  ))}
                </div>

                <div style={{ marginTop: "auto", paddingTop: 40, borderTop: "1px solid rgba(200,149,108,0.2)" }}>
                  <button
                    onClick={() => { setLang((l) => l === "fr" ? "ar" : "fr"); setMobileMenu(false); }}
                    style={{
                      background: "none", border: "1px solid rgba(200,149,108,0.45)",
                      padding: "8px 20px", borderRadius: 2, cursor: "pointer",
                      fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1.5px",
                      color: "var(--dark)",
                    }}
                  >
                    {TRANSLATIONS[lang].langBtn}
                  </button>
                </div>
              </div>
            </>
          )}

          <section
            className="hero-section"
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              paddingTop: ANNOUNCE_H + 70,
              background: "linear-gradient(135deg, var(--cream) 0%, #F5EDE4 50%, #EDE3D8 100%)",
              overflow: "hidden",
            }}
          >
            <div
              className="hero-grid"
              style={{
                display: "flex",
                maxWidth: 1200,
                margin: "0 auto",
                padding: "40px clamp(20px,4vw,60px)",
                gap: 60,
                alignItems: "center",
                width: "100%",
              }}
            >
              <div style={{ flex: 1, animation: "fadeUp 0.8s ease" }}>
                <p
                  className="hero-eyebrow"
                  style={{
                    fontFamily: "'Jost',sans-serif",
                    fontSize: 12,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    marginBottom: 20,
                    fontWeight: 500,
                  }}
                >
                  ✦ {t("hero_eyebrow")}
                </p>

                <h1
                  className="hero-title"
                  style={{
                    fontSize: "clamp(38px,5vw,62px)",
                    fontWeight: 300,
                    lineHeight: 1.05,
                    letterSpacing: "-1px",
                    marginBottom: 24,
                    color: "var(--dark)",
                  }}
                >
                  <span className="hero-word-left">{t("hero_l1")}</span>
                  <br />
                  <em className="hero-word-center" style={{ fontWeight: 500, color: "var(--gold)" }}>{t("hero_l2")}</em>
                  <br />
                  <span className="hero-word-right">{t("hero_l3")}</span>
                </h1>

                <p
                  className="hero-desc"
                  style={{
                    fontFamily: "'Jost',sans-serif",
                    color: "var(--text-muted)",
                    fontSize: 15,
                    lineHeight: 1.8,
                    marginBottom: 36,
                    maxWidth: 420,
                    fontWeight: 300,
                  }}
                >
                  {t("hero_desc")}
                </p>

                <div className="hero-btns" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <button className="btn-gold" onClick={scrollToShop} style={{ padding: "16px 40px", fontSize: 12 }}>
                    {t("discover")}
                  </button>
                  <button className="btn-outline-gold" onClick={() => setShowLookbook(true)} style={{ padding: "16px 40px", fontSize: 12 }}>
                    {t("catalogue")}
                  </button>
                </div>
              </div>

              <div className="hero-right" style={{ flex: 1, maxWidth: 460, animation: "fadeUp 0.8s ease 0.2s both" }}>
                <div style={{ position: "relative" }}>
                  <div
                    className="hero-deco-border"
                    style={{
                      position: "absolute",
                      top: -20,
                      left: -20,
                      right: 20,
                      bottom: 20,
                      border: "1px solid var(--gold)",
                      opacity: 0.25,
                      zIndex: 0,
                      pointerEvents: "none",
                    }}
                  />

                  <div className="hero-slider" style={{ position: "relative", zIndex: 1, aspectRatio: "3/4", overflow: "hidden" }}>
                    {galleryPhotos.map((src, i) => (
                      <div key={i} className={`hero-slide${i === sliderIndex ? " hero-slide-active" : ""}`}>
                        <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" />
                      </div>
                    ))}
                  </div>

                  <div
                    className="hero-badge"
                    style={{
                      position: "absolute",
                      bottom: 28,
                      right: -16,
                      background: "white",
                      padding: "14px 22px",
                      boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
                      zIndex: 6,
                      animation: "fadeUp 1s ease 0.6s both",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Jost',sans-serif",
                        fontSize: 10,
                        letterSpacing: "2.5px",
                        textTransform: "uppercase",
                        color: "var(--gold)",
                        marginBottom: 4,
                      }}
                    >
                      Nouveauté
                    </p>
                    <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.3px" }}>
                      Été 2026
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Notre Collection ── */}
          <section ref={shopRef} className="section-padding section-collection" style={{ background: "#FAF9F6", padding: "80px clamp(20px,4vw,60px) 80px" }}>
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <p style={{
                fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "4px",
                textTransform: "uppercase", color: "var(--gold)", marginBottom: 14,
              }}>
                Boutique
              </p>
              <h2 style={{
                fontSize: "clamp(30px,4vw,46px)", fontWeight: 300,
                letterSpacing: "-0.5px", color: "var(--dark)", lineHeight: 1.1,
              }}>
                <em style={{ fontWeight: 500, color: "var(--gold)", fontStyle: "italic" }}>{t("our_collection")}</em>
              </h2>
            </div>

            <div className="sq-grid">
              {sortedCollectionCats.map((cat, i) => (
                <CollectionCategoryCard
                  key={cat.id}
                  cat={cat}
                  delay={i}
                  comingSoon={productsLoaded && !activeCatLabels.has(cat.label)}
                  coverPhotos={catCoverImages[cat.label]}
                  onClick={() => navCollection(cat.id)}
                />
              ))}
            </div>
          </section>

          <section
            ref={nouvellesRef}
            className="section-padding"
            style={{
              background: "radial-gradient(ellipse at 50% 0%, rgba(200,149,108,0.1) 0%, transparent 65%), #F5EDE4",
              padding: "80px clamp(20px,4vw,60px) 96px",
            }}
          >
            <div style={{ maxWidth: 1260, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 52 }}>
                <p
                  style={{
                    fontFamily: "'Jost',sans-serif",
                    fontSize: 11,
                    letterSpacing: "4px",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    marginBottom: 14,
                  }}
                >
                  {t("testimonials")}
                </p>
                <h2
                  style={{
                    fontSize: "clamp(28px,4vw,42px)",
                    fontWeight: 300,
                    letterSpacing: "-0.5px",
                    color: "var(--dark)",
                  }}
                >
                  <em style={{ fontWeight: 500, color: "var(--gold)", fontStyle: "italic" }}>{t("what_clients_say")}</em>
                </h2>
              </div>

              <AvisGrid />
            </div>
          </section>

          {/* ── Séparateur Témoignages → Tissus Nobles ── */}
          <div style={{ marginTop: 80, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 100, height: 1, background: "#C9A84C" }} />
          </div>

          <section className="section-padding" style={{ padding: "80px clamp(20px,4vw,60px) 0", background: "white", marginBottom: 80 }}>
            <div
              className="features-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 40,
                maxWidth: 1000,
                margin: "0 auto",
              }}
            >
              {[
                {
                  icon: "◇",
                  title: t("feat1_t"),
                  desc: t("feat1_d"),
                },
                {
                  icon: "✦",
                  title: t("feat2_t"),
                  desc: t("feat2_d"),
                },
                {
                  icon: "❋",
                  title: t("feat3_t"),
                  desc: t("feat3_d"),
                },
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    padding: "32px 20px",
                    animation: `fadeUp 0.5s ease ${0.15 * i}s both`,
                  }}
                >
                  <div style={{ fontSize: 28, color: "var(--gold)", marginBottom: 16 }}>{f.icon}</div>
                  <h3
                    style={{
                      fontFamily: "'Jost',sans-serif",
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      marginBottom: 12,
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Jost',sans-serif",
                      color: "#999",
                      fontSize: 13,
                      lineHeight: 1.7,
                      fontWeight: 300,
                    }}
                  >
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Séparateur Tissus Nobles → Newsletter ── */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 100, height: 1, background: "#C9A84C" }} />
          </div>

          <section ref={contactRef} className="section-padding section-newsletter" style={{ padding: "80px clamp(20px,4vw,60px)", background: "white" }}>
            <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Jost',sans-serif",
                  fontSize: 11,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  marginBottom: 12,
                }}
              >
                {t("newsletter")}
              </p>
              <h2 style={{ fontSize: 32, fontWeight: 400, marginBottom: 12 }}>{t("stay_informed")}</h2>
              <p
                style={{
                  fontFamily: "'Jost',sans-serif",
                  color: "#999",
                  fontSize: 14,
                  marginBottom: 32,
                  fontWeight: 300,
                }}
              >
                {t("newsletter_desc")}
              </p>
              <div style={{ display: "flex", gap: 0 }}>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("newsletter_ph")}
                  style={{
                    flex: 1,
                    padding: "16px 20px",
                    border: "1px solid #ddd",
                    borderRight: "none",
                    fontFamily: "'Jost',sans-serif",
                    fontSize: 14,
                    outline: "none",
                    background: "transparent",
                  }}
                />
                <button className="btn-gold" style={{ padding: "16px 32px", fontSize: 12, border: "1px solid var(--gold)", whiteSpace: "nowrap" }}>
                  {t("subscribe")}
                </button>
              </div>
            </div>
          </section>

          {orderProduct && <OrderModal product={orderProduct} onClose={() => setOrderProduct(null)} />}

          {showProduct && (
            <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div
                onClick={() => setShowProduct(null)}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
              />
              <div
                className="product-modal-inner"
                style={{
                  position: "relative",
                  background: "white",
                  width: "min(850px,92vw)",
                  maxHeight: "90vh",
                  overflow: "auto",
                  display: "flex",
                  flexWrap: "wrap",
                  animation: "fadeUp 0.3s ease",
                }}
              >
                <button
                  onClick={() => setShowProduct(null)}
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "white",
                    border: "none",
                    cursor: "pointer",
                    zIndex: 3,
                    padding: 4,
                  }}
                >
                  <CloseIcon />
                </button>

                <div className="product-modal-img" style={{ flex: "1 1 350px", minHeight: 400 }}>
                  <img src={showProduct.img} alt={showProduct.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>

                <div
                  className="product-modal-info"
                  style={{
                    flex: "1 1 300px",
                    padding: "40px 36px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Jost',sans-serif",
                      fontSize: 11,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "var(--gold)",
                      marginBottom: 8,
                    }}
                  >
                    {showProduct.category}
                  </p>
                  <h2 style={{ fontSize: 28, fontWeight: 500, marginBottom: 8 }}>{showProduct.name}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 24, fontWeight: 600 }}>
                      {showProduct.price} ت.د
                    </span>
                    {showProduct.oldPrice && (
                      <span
                        style={{
                          fontFamily: "'Jost',sans-serif",
                          fontSize: 16,
                          color: "#bbb",
                          textDecoration: "line-through",
                        }}
                      >
                        {showProduct.oldPrice} ت.د
                      </span>
                    )}
                  </div>

                  <p
                    style={{
                      fontFamily: "'Jost',sans-serif",
                      fontSize: 13,
                      color: "#999",
                      lineHeight: 1.7,
                      marginBottom: 24,
                      fontWeight: 300,
                    }}
                  >
                    Une pièce d'exception confectionnée en tissu satin de haute qualité.
                    Coupe fluide et élégante, parfaite pour toutes les occasions.
                  </p>

                  <div style={{ marginBottom: 24 }}>
                    <p
                      style={{
                        fontFamily: "'Jost',sans-serif",
                        fontSize: 12,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: 10,
                        fontWeight: 500,
                      }}
                    >
                      Taille
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      {showProduct.sizes.map((s) => {
                        const active = (selectedSize[showProduct.id] || showProduct.sizes[0]) === s;
                        return (
                          <button
                            key={s}
                            className="size-btn"
                            onClick={() => setSelectedSize((prev) => ({ ...prev, [showProduct.id]: s }))}
                            style={{
                              width: 42,
                              height: 42,
                              border: active ? "2px solid var(--gold)" : "1px solid #ddd",
                              background: active ? "var(--gold)" : "transparent",
                              color: active ? "white" : "var(--dark)",
                              fontFamily: "'Jost',sans-serif",
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    className="btn-gold"
                    onClick={() => {
                      addToCart(showProduct);
                      setShowProduct(null);
                      setShowCart(true);
                    }}
                    style={{ width: "100%", padding: 16, fontSize: 12, marginBottom: 10 }}
                  >
                    Ajouter au Panier
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Footer global (toutes les pages sauf admin) ── */}
      {page !== "admin" && (
        <footer className="footer-wrap" style={{ background: "var(--dark)", color: "white", padding: "60px clamp(20px,4vw,60px) 30px" }}>
          <div
            className="footer-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr",
              gap: 50,
              maxWidth: 1200,
              margin: "0 auto",
              marginBottom: 50,
            }}
          >
            {/* Logo + description */}
            <div>
              <img src="/images/logo.png" alt="Basma" style={{ height: 50, marginBottom: 16, filter: "brightness(10)" }} />
              <p style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.8, fontWeight: 300 }}>
                {t("footer_about")}
              </p>
            </div>

            {/* Boutique */}
            <div>
              <h4 style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20, fontWeight: 600 }}>
                {t("shop_word")}
              </h4>
              {["3ibaya", "jiba", "pyjama", "Robe", "set", "Sac", "manteau", "kids"].map((id) => t(`cat_${id}`)).map((item) => (
                <p key={item} style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 10, fontWeight: 300, cursor: "pointer" }}>
                  {item}
                </p>
              ))}
            </div>

            {/* Service */}
            <div>
              <h4 style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20, fontWeight: 600 }}>
                {t("service_word")}
              </h4>
              {[t("delivery_free"), t("svc_cod"), t("svc_exchange"), t("svc_contact")].map((item) => (
                <p key={item} style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 10, fontWeight: 300 }}>
                  {item}
                </p>
              ))}
            </div>

            {/* Suivez-nous */}
            <div>
              <h4 style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 20, fontWeight: 600 }}>
                {t("follow_us")}
              </h4>
              {[
                { label: "Instagram", href: "https://www.instagram.com/basma_onlyshop/" },
                { label: "Facebook",  href: "https://www.facebook.com/basmaonlyshop" },
                { label: "TikTok",    href: "https://www.tiktok.com/@___basmas___" },
                { label: "WhatsApp",  href: "https://wa.me/21629930212" },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.5)", fontSize: 13, marginBottom: 10, textDecoration: "none", fontWeight: 300, transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gold)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-bottom" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
              {t("rights")}
            </p>
            <p style={{ fontFamily: "'Jost',sans-serif", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
              Made with ♥ Medya
            </p>
          </div>
        </footer>
      )}

      {/* ── Cart drawer (global, shown above all pages) ── */}
      <Cart />

      {/* ── Lookbook ── */}
      {showLookbook && (
        <LookbookPage
          onClose={() => setShowLookbook(false)}
          muteAudio={() => {
            const audio = audioRef.current;
            if (audio && !audio.muted) { audio.muted = true; setMuted(true); }
          }}
        />
      )}

      {/* ── Onboarding tour (première visite uniquement) ── */}
      {page === "home" && <OnboardingTour />}
    </>
  );
}