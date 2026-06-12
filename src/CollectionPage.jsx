import { useState, useEffect, useRef } from "react";
import RamadanDecor from "./RamadanDecor";
import OrderModal from "./components/OrderModal";
import ProductDetailModal from "./components/ProductDetailModal";
import { useCart } from "./context/CartContext";
import AnnouncementBar, { ANNOUNCE_H } from "./components/AnnouncementBar";
import { supabase } from "./lib/supabase";
import { makeProductKey } from "./lib/productKey";
import { fbTrack } from "./lib/pixel";

const categories = [
  {
    id: "3ibaya", label: "Abaya", price: 120, sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Abaya élégante confectionnée avec des tissus de haute qualité. Coupe fluide et raffinée, parfaite pour toutes les occasions.",
    photos: ["487447137_1098233225650757_818704683323925263_n.jpg","488374854_1098231745650905_8820862824133621922_n.jpg","488656760_1098232708984142_7631459729480207435_n.jpg","641057449_17935739097179373_2825300746075166942_n.jpg","648102785_1371074615033282_5385296663968872502_n.jpg"],
  },
  {
    id: "echarpe", label: "Écharpe", price: 35, sizes: ["TU"],
    desc: "Écharpe légère et douce en tissu premium, idéale pour compléter votre tenue avec élégance.",
    photos: ["587840430_17925997047179373_2959763835755661799_n.jpg","588084802_17925997029179373_8431155902852837248_n.jpg","589062375_17925996990179373_8845487259511413527_n.jpg","595502671_1298811695592908_1151798460515221855_n.jpg"],
  },
  {
    id: "jiba", label: "Jiba", price: 90, sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Jiba moderne au style traditionnel revisité, tissu confortable et respirant pour un port quotidien.",
    photos: ["498947811_17903534622179373_3600286315845092783_n.jpg","499366748_17903534595179373_7559916904546442049_n.jpg","499406882_1134013042072775_8705946179588991738_n.jpg","499602625_17903534667179373_4535199890911258257_n.jpg","499833958_17903534649179373_903899459310677770_n.jpg"],
  },
  {
    id: "kids", label: "Kids", price: 60, sizes: ["2-3ans","4-5ans","6-7ans","8-9ans","10-11ans"],
    desc: "Collection enfants colorée et confortable, des pièces adorables pour les petites princesses.",
    photos: ["645995833_1370344885106255_9157182548210132803_n.jpg","646076253_1370344838439593_3346000056858945782_n.jpg","649876591_1375551517918925_6681548330046473505_n.jpg","650825674_1375601961247214_9084526571701164849_n.jpg"],
  },
  {
    id: "manteau", label: "Manteau", price: 200, sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Manteau chic et chaud avec une coupe structurée et élégante, en tissu de qualité supérieure.",
    photos: ["579423101_1277387817735296_2206184981912267833_n.jpg","579550354_1277389351068476_4317445584969625127_n.jpg","631284553_17933675226179373_5747483335467394828_n.jpg","631604059_17933767830179373_7389489587997262940_n.jpg"],
  },
  {
    id: "MDB", label: "MDB", price: 110, sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Ensemble MDB moderne et tendance, le confort et le style parfaitement réunis.",
    photos: ["496049480_1128525475954865_2540523400201882755_n.jpg","496263120_1128525229288223_2489261562133792631_n.jpg","497885050_1131003555707057_3874941570880894198_n.jpg","499066487_1132573475550065_5434042430597513079_n.jpg","505353945_1156440629830016_8647673457501953606_n.jpg"],
  },
  {
    id: "pyjama", label: "Pyjama", price: 85, sizes: ["S","M","L","XL"],
    desc: "Pyjama doux et confortable en tissu respirant pour des nuits douces et reposantes.",
    photos: ["490345086_1118998213574258_6134831431061358690_n.jpg","492617363_1119002820240464_4055654624926574235_n.jpg","579083507_1276299481177463_446330100554526195_n.jpg","589159541_17926554309179373_4773932076652099313_n.jpg"],
  },
  {
    id: "Robe", label: "Robe", price: 130, sizes: ["36","38","40","42","44","46","48","50","52"],
    desc: "Robe élégante aux couleurs vives et aux coupes flatteuses, parfaite pour toutes les occasions.",
    photos: ["649636396_1374861407987936_6370692347574891488_n.jpg","649665854_1374861444654599_6644258085429623943_n.jpg","650287811_1375865401220870_230421896988538844_n.jpg","650839941_1375865431220867_1210585044214971859_n.jpg"],
  },
  {
    id: "Sac", label: "Sac", price: 75, sizes: ["TU"],
    desc: "Sac tendance et fonctionnel, l'accessoire indispensable pour compléter votre garde-robe.",
    photos: ["631720297_1352112070262870_4847811711877564932_n.jpg","631917370_1352111973596213_194994035129029681_n.jpg","633207472_1352112016929542_6323390260047978267_n.jpg","633375719_1352111933596217_4381281051821960200_n.jpg"],
  },
  {
    id: "set", label: "Set", price: 150, sizes: ["S","M","L","XL"],
    desc: "Set coordonné pour un look complet et soigné, alliance parfaite de style et de confort.",
    photos: ["493138870_1143811757759570_6677303497939193345_n.jpg","503595961_1144400911033988_4417601806757851793_n.jpg","549864507_1232854562188622_2760973217095054367_n.jpg","627056759_17932957533179373_8778773970641450727_n.jpg","648685767_17937284784179373_1588006055100656717_n.jpg"],
  },
];

// Full photo lists per category
const allPhotos = {
  "3ibaya": ["487447137_1098233225650757_818704683323925263_n.jpg","487482758_1098235528983860_1337082054879825928_n.jpg","488374854_1098231745650905_8820862824133621922_n.jpg","488412136_1098236735650406_2566129172045816338_n.jpg","488656760_1098232708984142_7631459729480207435_n.jpg","488747013_1098233362317410_7434883994727766387_n.jpg","488790973_1098232025650877_7884822066070508631_n.jpg","489056809_1098233885650691_6184689331918739110_n.jpg","641057449_17935739097179373_2825300746075166942_n.jpg","641274935_17935739085179373_8834468550769090240_n.jpg","641310703_17935739112179373_3506838187577075310_n.jpg","645917000_17936968758179373_3648439026262285207_n.jpg","647905201_1371085648365512_4112774328221328024_n.jpg","648101796_1371085608365516_7874487022288731916_n.jpg","648102785_1371074615033282_5385296663968872502_n.jpg","648109816_1371074575033286_7333567232460192872_n.jpg","648116866_1371084821698928_8809115925454101434_n.jpg","648166674_1371074531699957_683589501147660898_n.jpg","648193817_1371087281698682_6420214918046485362_n.jpg","648289479_1371087248365352_2775554513725029480_n.jpg","648673281_1373200658154011_2747074808189297765_n.jpg","649620347_1374334828040594_2343977281555728012_n.jpg"],
  echarpe: ["587840430_17925997047179373_2959763835755661799_n.jpg","588017644_17925996999179373_709222483395394002_n.jpg","588084802_17925997029179373_8431155902852837248_n.jpg","588970860_17925997011179373_4321269800327216560_n.jpg","589062375_17925996990179373_8845487259511413527_n.jpg","589073827_17925997056179373_4604449720599579106_n.jpg","589084865_17925997020179373_953915522784120892_n.jpg","589795993_17925997038179373_191894464615835264_n.jpg","589813387_17925997068179373_6027586623532409802_n.jpg","589818246_17925997086179373_3479656949232186051_n.jpg","595502671_1298811695592908_1151798460515221855_n.jpg","595546543_1298811732259571_4180154326945180773_n.jpg","595608163_1298811658926245_5937761157699259640_n.jpg"],
  jiba: ["498947811_17903534622179373_3600286315845092783_n.jpg","499328726_17903534685179373_7845832821603061745_n.jpg","499366748_17903534595179373_7559916904546442049_n.jpg","499401341_17903534640179373_6878922319193566084_n.jpg","499406882_1134013042072775_8705946179588991738_n.jpg","499408174_1134012068739539_5606402822385905466_n.jpg","499550144_1134012862072793_6327908369055065724_n.jpg","499602625_17903534667179373_4535199890911258257_n.jpg","499659814_1134012915406121_1972317570480789182_n.jpg","499702306_1134012125406200_3042498230157918608_n.jpg","499833958_17903534649179373_903899459310677770_n.jpg","499861853_1134012942072785_5220749619299824478_n.jpg","499861865_1134012605406152_3413511591749570473_n.jpg","499863065_1134012558739490_3890479913543853146_n.jpg","499872341_17903534658179373_3906983667986285351_n.jpg","499908448_1134012652072814_7735128911556151513_n.jpg","499934293_1134013182072761_4759828657917065197_n.jpg","499962626_17903534631179373_6926986863222983308_n.jpg","500262180_1134012322072847_3969177363425573434_n.jpg","500457316_17903534613179373_9112787108904778547_n.jpg"],
  kids: ["645995833_1370344885106255_9157182548210132803_n.jpg","646076253_1370344838439593_3346000056858945782_n.jpg","646099336_1370344925106251_6143909775502098202_n.jpg","649871571_1375601994580544_2088247681471175482_n.jpg","649876591_1375551517918925_6681548330046473505_n.jpg","649884125_1375551551252255_8133070511646187938_n.jpg","650046975_1375551487918928_7748074843042795439_n.jpg","650350444_1375551591252251_1657897137473673431_n.jpg","650825674_1375601961247214_9084526571701164849_n.jpg","650829522_1375601927913884_8875948773283361845_n.jpg","650831842_1375551661252244_8326199711515305436_n.jpg"],
  manteau: ["579423101_1277387817735296_2206184981912267833_n.jpg","579467136_1277389414401803_4233296027336448095_n.jpg","579550354_1277389351068476_4317445584969625127_n.jpg","579868736_1278188874321857_2269627159073165188_n.jpg","579936652_1278188744321870_3374007844884181012_n.jpg","581116465_1278188924321852_1607698249135478837_n.jpg","581214855_1277389274401817_3582536770562509433_n.jpg","630629104_17933675214179373_4861346317016091070_n.jpg","631284553_17933675226179373_5747483335467394828_n.jpg","631533149_17933675235179373_7783484518016219795_n.jpg","631566361_17933767821179373_693679008707423869_n.jpg","631598616_17933767812179373_8597876946880535534_n.jpg","631604059_17933767830179373_7389489587997262940_n.jpg","633178617_1351266077014136_9005619216067040800_n.jpg"],
  MDB: ["496049480_1128525475954865_2540523400201882755_n.jpg","496160681_1128525349288211_435310997039051688_n.jpg","496263120_1128525229288223_2489261562133792631_n.jpg","496927534_1128525542621525_5432855453588111822_n.jpg","496939355_1128525585954854_717833959396877757_n.jpg","497514203_1128525439288202_1720274803233818995_n.jpg","497615006_1128525389288207_4760553163759615532_n.jpg","497885050_1131003555707057_3874941570880894198_n.jpg","498248444_1131003615707051_7759453535647014413_n.jpg","499066487_1132573475550065_5434042430597513079_n.jpg","499403889_1132573528883393_4827170064149026181_n.jpg","499472990_1132573418883404_1137639139622699186_n.jpg","499860558_1132573578883388_6478960459273421097_n.jpg","499871349_1132573368883409_3827099804979366608_n.jpg","503751061_1156440513163361_524706571656098292_n.jpg","505353945_1156440629830016_8647673457501953606_n.jpg","506439160_1156440459830033_671855043219773244_n.jpg","508352570_17906876241179373_3681962311484912039_n.jpg"],
  pyjama: ["490345086_1118998213574258_6134831431061358690_n.jpg","492502616_1118998120240934_4795495843165633590_n.jpg","492617363_1119002820240464_4055654624926574235_n.jpg","492769358_1118997986907614_3131795042707457791_n.jpg","493272651_1118998020240944_5811466295060212673_n.jpg","494086030_1118998056907607_7405706363721852136_n.jpg","494281593_1118998270240919_6389819507041261158_n.jpg","494308874_1118998166907596_8927027624674043612_n.jpg","579053012_1276298811177530_8984518268801559205_n.jpg","579064634_1276298764510868_4453532140010094550_n.jpg","579083507_1276299481177463_446330100554526195_n.jpg","579359222_1276299444510800_6961278750497015924_n.jpg","579373848_1276298871177524_2618613723059305954_n.jpg","579390802_1276298841177527_9096355951208059728_n.jpg","579497690_1276298717844206_7315956459069926944_n.jpg","579648135_1276299407844137_5617542567584705271_n.jpg","582045279_17923810626179373_3387430368150784452_n.jpg","589159541_17926554309179373_4773932076652099313_n.jpg","590482479_17926554318179373_3929513711600136633_n.jpg","648690320_1372503324890411_4987795754496219365_n.jpg"],
  Robe: ["649636396_1374861407987936_6370692347574891488_n.jpg","649665854_1374861444654599_6644258085429623943_n.jpg","650287811_1375865401220870_230421896988538844_n.jpg","650839941_1375865431220867_1210585044214971859_n.jpg"],
  Sac: ["631720297_1352112070262870_4847811711877564932_n.jpg","631917370_1352111973596213_194994035129029681_n.jpg","633207472_1352112016929542_6323390260047978267_n.jpg","633375719_1352111933596217_4381281051821960200_n.jpg"],
  set: ["493138870_1143811757759570_6677303497939193345_n.jpg","499925101_1144400861033993_3334460381609834918_n.jpg","502718263_1142868121187267_7543409463613258642_n.jpg","503500541_1143811721092907_1680371617944796245_n.jpg","503569778_1143811497759596_3674557093428282379_n.jpg","503595961_1144400911033988_4417601806757851793_n.jpg","504340305_17908169688179373_3078039285403121081_n.jpg","505812551_1150586390415440_3398345728921221780_n.jpg","511485784_17908169715179373_2597644327160038580_n.jpg","513232148_1162920135848732_640458654718534692_n.jpg","516557932_1171681738305905_5568169525824036400_n.jpg","516834321_1171681248305954_816674332074357088_n.jpg","516931359_1171681771639235_6173034236830453975_n.jpg","518280685_1171681634972582_1394436318256511318_n.jpg","527696326_1193082216165857_2391913245333609_n.jpg","549864507_1232854562188622_2760973217095054367_n.jpg","549891570_1232853485522063_8313864331863025481_n.jpg","550191500_1232854068855338_7784190896425698556_n.jpg","550959373_1231666955640716_3175971721681877697_n.jpg","558231485_1245859930888085_2590677230750125516_n.jpg","558256105_1245861110887967_5328630611717327634_n.jpg","565717486_1256087316532013_3935270618204365316_n.jpg","627056759_17932957533179373_8778773970641450727_n.jpg","634743500_17934788058179373_1514141254197804076_n.jpg","648685767_17937284784179373_1588006055100656717_n.jpg","648745377_17937284775179373_8845368223558810388_n.jpg","648769271_17937284802179373_8564353339299130636_n.jpg","649225515_17937284793179373_8339320576981707966_n.jpg","649227514_17937284766179373_491563886336157365_n.jpg"],
};

// Helper: pick photos by 1-based indices from a photo array
const pick = (arr, ...nums) => nums.map(n => arr[n - 1]);

// Product groups per category (each group = one card with color selector)
const productGroups = {
  "3ibaya": [
    { label: "Abaya Groupe 1", photos: pick(allPhotos["3ibaya"], 1, 3) },
    { label: "Abaya Groupe 2", photos: pick(allPhotos["3ibaya"], 2, 5, 8) },
    { label: "Abaya Groupe 3", photos: pick(allPhotos["3ibaya"], 4, 6, 7) },
    { label: "Abaya Groupe 4", photos: pick(allPhotos["3ibaya"], 9, 10, 11) },
    { label: "Abaya Groupe 5", photos: pick(allPhotos["3ibaya"], 12, 15, 16, 18) },
    { label: "Abaya Groupe 6", photos: pick(allPhotos["3ibaya"], 13, 14) },
    { label: "Abaya Groupe 7", photos: pick(allPhotos["3ibaya"], 17, 21) },
    { label: "Abaya Groupe 8", photos: pick(allPhotos["3ibaya"], 19, 20, 22) },
  ],
  echarpe: [
    { label: "Écharpe Louis Vuitton", photos: pick(allPhotos.echarpe, 1, 2, 3, 4, 5, 6, 8, 9, 10) },
    { label: "Écharpe Christian Dior", photos: pick(allPhotos.echarpe, 7) },
    { label: "Écharpe Hermès",         photos: pick(allPhotos.echarpe, 11) },
    { label: "Écharpe Fendi",          photos: pick(allPhotos.echarpe, 12) },
    { label: "Écharpe Guess",          photos: pick(allPhotos.echarpe, 13) },
  ],
  jiba: [
    { label: "Jiba", photos: allPhotos.jiba },
  ],
  kids: [
    { label: "Kids Lacoste",   photos: pick(allPhotos.kids, 1, 2, 3) },
    { label: "Kids Vert ZARA", photos: pick(allPhotos.kids, 4, 9, 10) },
    { label: "Kids Groupe 3",  photos: pick(allPhotos.kids, 5, 6, 7, 8, 11) },
  ],
  manteau: [
    { label: "Manteau Groupe 1", photos: pick(allPhotos.manteau, 1, 2, 3, 7) },
    { label: "Manteau Groupe 2", photos: pick(allPhotos.manteau, 4, 5, 6) },
    { label: "Manteau Groupe 3", photos: pick(allPhotos.manteau, 8, 9, 10, 11, 12, 13) },
    { label: "Manteau Groupe 4", photos: pick(allPhotos.manteau, 14) },
  ],
  MDB: [
    { label: "MDB Groupe 1", photos: pick(allPhotos.MDB, 10, 11, 12, 13, 14) },
    { label: "MDB Groupe 2", photos: pick(allPhotos.MDB, 15, 16, 17) },
    { label: "MDB Groupe 3", photos: pick(allPhotos.MDB, 18) },
    { label: "MDB Groupe 4", photos: pick(allPhotos.MDB, 1, 2, 3, 4, 5, 6, 7, 8, 9) },
  ],
  pyjama: [
    { label: "Pyjama Groupe 1", photos: pick(allPhotos.pyjama, 1, 2, 3, 5) },
    { label: "Pyjama Groupe 2", photos: pick(allPhotos.pyjama, 4, 6, 7, 8) },
    { label: "Pyjama Groupe 3", photos: pick(allPhotos.pyjama, 9, 10, 13, 14, 15) },
    { label: "Pyjama Groupe 4", photos: pick(allPhotos.pyjama, 11, 12, 16) },
    { label: "Pyjama Groupe 5", photos: pick(allPhotos.pyjama, 17) },
    { label: "Pyjama Groupe 6", photos: pick(allPhotos.pyjama, 18, 19) },
    { label: "Pyjama Groupe 7", photos: pick(allPhotos.pyjama, 20) },
  ],
  Robe: [
    { label: "Robe Groupe 1", photos: pick(allPhotos.Robe, 1, 2) },
    { label: "Robe Groupe 2", photos: pick(allPhotos.Robe, 3, 4) },
  ],
  Sac: [
    { label: "Sac Groupe 1", photos: pick(allPhotos.Sac, 1, 2, 3) },
    { label: "Sac Groupe 2", photos: pick(allPhotos.Sac, 4) },
  ],
  set: [
    { label: "Set Groupe 1", photos: pick(allPhotos.set, 1, 2, 4, 5, 6) },
    { label: "Set Groupe 2", photos: pick(allPhotos.set, 3, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18) },
    { label: "Set Groupe 3", photos: pick(allPhotos.set, 19, 20, 21, 22, 23) },
    { label: "Set Groupe 4", photos: pick(allPhotos.set, 24) },
    { label: "Set Groupe 5", photos: pick(allPhotos.set, 25, 26, 27, 28, 29) },
  ],
};

// ── Square category card ──────────────────────────────────────
function CategoryCard({ cat, onClick, delay }) {
  const [hovered, setHovered] = useState(false);
  const src0 = `/photos/${cat.id}/${cat.photos[0]}`;
  const src1 = `/photos/${cat.id}/${cat.photos[1] ?? cat.photos[0]}`;

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        background: "white",
        boxShadow: hovered
          ? "0 16px 48px rgba(0,0,0,0.16)"
          : "0 2px 16px rgba(0,0,0,0.07)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.4s ease",
        animation: `fadeUp 0.6s ease ${delay * 0.07}s both`,
      }}>

      {/* ── Photo zone ── */}
      <div className="sq-card" style={{ margin: 0 }}>
        <img src={src0} alt="" loading="lazy" className="sq-img sq-img-a" style={{ opacity: hovered ? 0 : 1 }} />
        <img src={src1} alt="" loading="lazy" className="sq-img sq-img-b" style={{ opacity: hovered ? 1 : 0 }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: "28%",
          background: "linear-gradient(transparent, rgba(0,0,0,0.18))",
          zIndex: 3, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, height: 2,
          background: "var(--gold)", zIndex: 5,
          width: hovered ? "100%" : "0%",
          transition: "width 0.45s cubic-bezier(0.25,0.46,0.45,0.94)",
        }} />
      </div>

      {/* ── Info band ── */}
      <div style={{
        background: "white",
        padding: "14px 18px 16px",
        borderTop: "1px solid rgba(200,149,108,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}>
        <div>
          <span style={{
            display: "block",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 19,
            fontWeight: 500,
            color: "var(--dark)",
            letterSpacing: "0.2px",
            lineHeight: 1.2,
            marginBottom: 4,
          }}>{cat.label}</span>
          <span style={{
            display: "block",
            fontFamily: "'Jost', sans-serif",
            fontSize: 11,
            color: "var(--text-muted)",
            letterSpacing: "0.5px",
          }}>À partir de</span>
        </div>
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: "var(--gold)",
          whiteSpace: "nowrap",
        }}>{cat.price} ت.د</span>
      </div>
    </div>
  );
}

// ── Product group card (one card per color group) ─────────────
function ProductGroupCard({ cat, group, groupIndex, onOrder, onAddToCart, onOpenDetail }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [showMiniPopup, setShowMiniPopup] = useState(false);
  const [popupColorIdx, setPopupColorIdx] = useState(0);
  const effectiveSizes = group.sizes ?? cat.sizes ?? [];
  const [popupSize, setPopupSize] = useState(effectiveSizes[0] ?? "TU");
  const [popupError, setPopupError] = useState("");

  // Support URLs absolues (Supabase) et chemins relatifs (statiques)
  const photoSrc = (photo) => photo.startsWith("http") ? photo : `/photos/${cat.id}/${photo}`;
  const activeSrc = photoSrc(group.photos[activeIdx]);

  const handleAddToCart = () => {
    if (group.photos.length > 1 && popupColorIdx === null) {
      setPopupError("Veuillez choisir une couleur");
      return;
    }
    setPopupError("");
    onAddToCart({
      name: group.label,
      price: group.price ?? cat.price,
      img: photoSrc(group.photos[popupColorIdx ?? 0]),
      category: cat.label,
      size: popupSize,
      colorIdx: popupColorIdx ?? 0,
      photos: group.photos,
      catId: cat.id,
    });
    setShowMiniPopup(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "white",
        overflow: "hidden",
        boxShadow: hovered ? "0 12px 32px rgba(0,0,0,0.13)" : "0 2px 16px rgba(0,0,0,0.07)",
        transform: hovered ? "translateY(-6px)" : "none",
        transition: "transform 0.3s, box-shadow 0.3s",
        animation: `fadeUp 0.5s ease ${groupIndex * 0.05}s both`,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Photo — cliquable pour ouvrir le détail produit */}
      <div
        onClick={() => onOpenDetail?.(group)}
        style={{ overflow: "hidden", aspectRatio: "3/4", position: "relative", flexShrink: 0, cursor: "pointer" }}
      >
        <img
          src={activeSrc}
          alt={group.label}
          loading="lazy"
          style={{
            width: "100%", height: "100%", objectFit: "cover", display: "block",
            transition: "transform 0.5s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
        />
        {/* Indice "voir le produit" au survol */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(to top, rgba(44,33,23,0.45), transparent 55%)",
          opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease", pointerEvents: "none",
        }}>
          <span style={{
            position: "absolute", bottom: 14,
            fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase",
            color: "white", background: "rgba(201,168,76,0.92)", padding: "7px 16px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Voir le produit
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
        <p style={{
          fontFamily: "'Jost',sans-serif", fontSize: 10, color: "var(--gold)",
          letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4,
        }}>{cat.label}</p>
        <h3 onClick={() => onOpenDetail?.(group)} style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, lineHeight: 1.3, cursor: "pointer" }}>{group.label}</h3>
        <p style={{
          fontFamily: "'Jost',sans-serif", fontSize: 12, color: "var(--text-muted)",
          lineHeight: 1.6, marginBottom: 10,
        }}>{cat.desc}</p>

        {/* Aperçu couleurs (cliquables pour changer la photo) */}
        {group.photos.length > 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            {group.photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                title={`Couleur ${i + 1}`}
                style={{
                  width: 30, height: 30, padding: 0, borderRadius: "50%",
                  border: i === activeIdx ? "2.5px solid var(--gold)" : "2.5px solid transparent",
                  outline: i === activeIdx ? "2px solid var(--gold)" : "1.5px solid rgba(200,149,108,0.3)",
                  outlineOffset: 2,
                  cursor: "pointer", overflow: "hidden", background: "none", flexShrink: 0,
                  transition: "border-color 0.2s, transform 0.15s",
                  transform: i === activeIdx ? "scale(1.12)" : "scale(1)",
                }}
              >
                <img
                  src={photoSrc(photo)}
                  loading="lazy" alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Prix + deux boutons */}
        <div style={{ marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 18, fontWeight: 700, color: "var(--gold)" }}>
              {group.price ?? cat.price} ت.د
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {/* Bouton Panier */}
            <button
              onClick={() => {
                setPopupColorIdx(group.photos.length > 1 ? null : 0);
                setPopupSize(effectiveSizes[0] ?? "TU");
                setPopupError("");
                setShowMiniPopup(true);
              }}
              style={{
                flex: 1, padding: "11px 4px", fontSize: 11,
                background: "white", color: "var(--gold)",
                border: "1.5px solid var(--gold)", cursor: "pointer",
                fontFamily: "'Jost',sans-serif", letterSpacing: "1px", textTransform: "uppercase",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <span style={{ fontSize: 13 }}>🛒</span> Panier
            </button>
            {/* Bouton Commander */}
            <button
              onClick={() => onOrder({
                id: group.supabaseId,
                name: group.label,
                price: group.price ?? cat.price,
                img: activeSrc,
                category: cat.label,
                sizes: effectiveSizes,
                desc: group.description ?? cat.desc,
                photos: group.photos,
                catId: cat.id,
                initialColorIdx: activeIdx,
              })}
              style={{
                flex: 1, padding: "11px 4px", fontSize: 11,
                background: "#C9A84C", color: "white",
                border: "1.5px solid #C9A84C", cursor: "pointer",
                fontFamily: "'Jost',sans-serif", letterSpacing: "1px", textTransform: "uppercase",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              Commander
            </button>
          </div>
        </div>
      </div>

      {/* ── Mini popup couleur + taille pour panier ── */}
      {showMiniPopup && (
        <>
          <div onClick={() => setShowMiniPopup(false)} style={{ position: "fixed", inset: 0, zIndex: 1999 }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2000,
            background: "white", padding: "16px 14px",
            boxShadow: "0 -8px 30px rgba(0,0,0,0.18)",
            borderTop: "2px solid var(--gold)",
            animation: "fadeUp 0.2s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", color: "var(--dark)" }}>
                Choisir les options
              </p>
              <button onClick={() => setShowMiniPopup(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: 2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Couleur */}
            {group.photos.length > 1 && (
              <div style={{ marginBottom: 10 }}>
                <p style={{
                  fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
                  color: popupError ? "#e57373" : "var(--text-muted)", marginBottom: 6,
                }}>
                  Couleur {popupError && <span style={{ fontSize: 9, letterSpacing: 0 }}>— {popupError}</span>}
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {group.photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => { setPopupColorIdx(i); setPopupError(""); }}
                      style={{
                        width: 28, height: 28, padding: 0, borderRadius: "50%",
                        border: i === popupColorIdx ? "2.5px solid var(--gold)" : "2.5px solid transparent",
                        outline: i === popupColorIdx ? "2px solid var(--gold)" : "1.5px solid rgba(200,149,108,0.3)",
                        outlineOffset: 1, cursor: "pointer", overflow: "hidden", background: "none", flexShrink: 0,
                        transform: i === popupColorIdx ? "scale(1.1)" : "scale(1)",
                        transition: "all 0.15s",
                      }}
                    >
                      <img src={photoSrc(photo)} loading="lazy" alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Taille */}
            {effectiveSizes.length > 1 && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6 }}>
                  Taille
                </p>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {effectiveSizes.map(s => (
                    <button key={s} onClick={() => setPopupSize(s)} style={{
                      padding: "5px 12px", fontSize: 11,
                      border: popupSize === s ? "2px solid var(--gold)" : "1px solid #ddd",
                      background: popupSize === s ? "var(--gold)" : "white",
                      color: popupSize === s ? "white" : "var(--dark)",
                      fontFamily: "'Jost',sans-serif", fontWeight: 500, cursor: "pointer", borderRadius: 2,
                    }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleAddToCart}
              style={{
                width: "100%", padding: "10px", fontSize: 11,
                background: "#C9A84C", color: "white", border: "none", cursor: "pointer",
                fontFamily: "'Jost',sans-serif", letterSpacing: "1px", textTransform: "uppercase",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 13 }}>🛒</span> Ajouter au panier
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tailles disponibles pour le filtre ──
const ALL_SIZES = ["36","38","40","42","44","46","48","50","52","S","M","L","XL","TU","2-3ans","4-5ans","6-7ans","8-9ans","10-11ans"];

// ── Gallery view ──────────────────────────────────────────────
function CategoryGallery({ cat, onBack, openProductKey, onDeepLinkConsumed }) {
  const [orderProduct, setOrderProduct] = useState(null);
  const [detailGroup, setDetailGroup] = useState(null);
  const [toast, setToast] = useState(null);
  const { addItem } = useCart();
  const deepLinkDone = useRef(false);

  // Chargement produits Supabase
  const [supabaseProducts, setSupabaseProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category", cat.label)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setSupabaseProducts(data ?? []);
      setLoaded(true);
    };
    load();
  }, [cat.label]);

  // Uniquement les produits Supabase (les démos statiques sont retirées).
  // Une catégorie sans produit Supabase affiche "Coming Soon".
  const dynamicGroups = supabaseProducts.map(p => ({
    label: p.name,
    photos: p.images ?? [],
    price: p.price,
    sizes: p.sizes ?? cat.sizes,
    description: p.description,
    supabaseId: p.id,
  })).filter(g => g.photos.length > 0);
  const groups = dynamicGroups;

  // Catégorie sans aucun produit (une fois Supabase chargé) → "Coming Soon"
  const isEmpty = loaded && groups.length === 0;

  // Ouverture automatique du produit depuis un lien partagé (/produit/<clé>)
  useEffect(() => {
    if (!openProductKey || deepLinkDone.current) return;
    const match = groups.find(g => makeProductKey(cat.id, g) === openProductKey);
    if (match) {
      deepLinkDone.current = true;
      setDetailGroup(match);
      onDeepLinkConsumed?.();
    }
    // On attend que les produits Supabase soient chargés avant d'abandonner
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProductKey, supabaseProducts]);

  // Filtres
  const [filterSize, setFilterSize] = useState(null);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Tailles réellement présentes dans tous les produits (statiques + Supabase)
  const SIZE_ORDER = ["XS","S","M","L","XL","XXL","36","38","40","42","44","46","48","50","52","2-3ans","4-5ans","6-7ans","8-9ans","10-11ans","TU"];
  const allSizes = [...new Set(groups.flatMap(g => g.sizes ?? cat.sizes ?? []))];
  const catSizes = allSizes.sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  const hasActiveFilter = filterSize || priceMin || priceMax || sortBy !== "default";

  const resetFilters = () => {
    setFilterSize(null);
    setPriceMin("");
    setPriceMax("");
    setSortBy("default");
  };

  // Filtrage (utilise le prix et les tailles propres à chaque groupe)
  let filtered = groups;
  if (filterSize) {
    filtered = filtered.filter(g => (g.sizes ?? cat.sizes ?? []).includes(filterSize));
  }
  if (priceMin) {
    filtered = filtered.filter(g => (g.price ?? cat.price) >= Number(priceMin));
  }
  if (priceMax) {
    filtered = filtered.filter(g => (g.price ?? cat.price) <= Number(priceMax));
  }

  // Tri
  if (sortBy === "price_asc") {
    filtered = [...filtered].sort((a, b) => (a.price ?? cat.price) - (b.price ?? cat.price));
  } else if (sortBy === "price_desc") {
    filtered = [...filtered].sort((a, b) => (b.price ?? cat.price) - (a.price ?? cat.price));
  } else if (sortBy === "newest") {
    filtered = [...filtered].reverse();
  }

  const handleAddToCart = (item) => {
    addItem(item);
    fbTrack("AddToCart", {
      content_name: item.name,
      content_category: item.category,
      content_type: "product",
      value: item.price,
    });
    setToast(item.name);
    setTimeout(() => setToast(null), 2200);
  };

  const labelStyle = {
    fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "1.5px",
    textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 0, display: "block",
  };

  return (
    <div style={{ animation: "fadeIn 0.35s ease" }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: "fixed", top: 80, right: 24, zIndex: 3000,
          background: "var(--dark)", color: "white",
          padding: "12px 24px", borderRadius: 50,
          fontFamily: "'Jost',sans-serif", fontSize: 13, fontWeight: 500,
          animation: "notifSlide 0.3s ease",
          boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Ajouté au panier
        </div>
      )}

      {/* Header */}
      <div className="cat-gallery-header" style={{ background: "linear-gradient(135deg, var(--dark) 0%, #3D3328 100%)", padding: "22px clamp(20px,4vw,60px) 18px" }}>
        <button onClick={onBack} style={{
          display: "flex", alignItems: "center", gap: 8, background: "none", border: "none",
          cursor: "pointer", fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "2px",
          textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 12,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6" /></svg>
          Collection
        </button>
        <p style={{ fontFamily: "'Jost',sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--gold)", marginBottom: 6 }}>✦ Basma Only Shop</p>
        <h2 style={{ color: "white", fontSize: "clamp(22px,3vw,32px)", fontWeight: 300, letterSpacing: "-0.5px", marginBottom: 6 }}>{cat.label}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
          <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "2px" }}>
            {!loaded
              ? "Chargement…"
              : isEmpty
                ? "Bientôt disponible"
                : `${groups.length} article${groups.length > 1 ? "s" : ""} · à partir de ${Math.min(...groups.map(g => g.price ?? cat.price))} ت.د`}
          </span>
        </div>
      </div>

      {isEmpty ? (
        /* ── Catégorie sans produit : Coming Soon ── */
        <div style={{
          minHeight: "46vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", textAlign: "center",
          padding: "70px 24px 90px", animation: "fadeUp 0.5s ease",
        }}>
          <div style={{ fontSize: 30, color: "var(--gold)", marginBottom: 18, letterSpacing: "4px" }}>✦</div>
          <p style={{
            fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: "4px",
            textTransform: "uppercase", color: "var(--gold)", marginBottom: 14,
          }}>
            {cat.label}
          </p>
          <h3 style={{
            fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(30px,5vw,46px)",
            fontWeight: 400, color: "var(--dark)", lineHeight: 1.1, marginBottom: 16,
          }}>
            Coming Soon
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <div style={{ width: 28, height: 1, background: "rgba(200,149,108,0.5)" }} />
            <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 12, color: "var(--text-muted)", letterSpacing: "2px" }}>
              Bientôt disponible
            </span>
            <div style={{ width: 28, height: 1, background: "rgba(200,149,108,0.5)" }} />
          </div>
          <p style={{
            fontFamily: "'Jost',sans-serif", fontSize: 13, color: "var(--text-muted)",
            lineHeight: 1.7, maxWidth: 380, marginBottom: 28,
          }}>
            Notre nouvelle collection {cat.label} arrive très prochainement. Reviens vite la découvrir !
          </p>
          <button onClick={onBack} style={{
            padding: "13px 34px", fontSize: 11, background: "var(--dark)", color: "var(--gold)",
            border: "none", cursor: "pointer", fontFamily: "'Jost',sans-serif",
            letterSpacing: "2.5px", textTransform: "uppercase",
          }}>
            Voir les autres catégories
          </button>
        </div>
      ) : (
      <>
      {/* ── Barre de filtres ── */}
      <div style={{
        background: "#FAF9F6", borderBottom: "1px solid rgba(200,149,108,0.15)",
        padding: "0 clamp(20px,4vw,60px)",
      }}>
        {/* Bouton mobile pour toggler les filtres */}
        <button
          className="filter-toggle-mobile"
          onClick={() => setFiltersOpen(o => !o)}
          style={{
            display: "none", width: "100%", padding: "14px 0",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: "1.5px",
            textTransform: "uppercase", color: "var(--dark)",
            justifyContent: "center", alignItems: "center", gap: 8,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="8" cy="6" r="2" fill="var(--gold)" stroke="var(--gold)" /><circle cx="16" cy="12" r="2" fill="var(--gold)" stroke="var(--gold)" /><circle cx="10" cy="18" r="2" fill="var(--gold)" stroke="var(--gold)" />
          </svg>
          Filtrer {hasActiveFilter && <span style={{ color: "var(--gold)", fontWeight: 700 }}>●</span>}
        </button>

        {/* Contenu filtres — toujours visible desktop, togglé mobile */}
        <div className={`filter-bar-content${filtersOpen ? " filter-open" : ""}`} style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "nowrap",
          padding: "8px 0", maxWidth: 1300, margin: "0 auto",
        }}>
          {/* Filtre taille */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={labelStyle}>Taille</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {catSizes.map(s => (
                <button key={s} onClick={() => setFilterSize(filterSize === s ? null : s)} style={{
                  padding: "4px 10px", fontSize: 10,
                  background: filterSize === s ? "#C9A84C" : "white",
                  color: filterSize === s ? "white" : "#2C2A20",
                  border: `1.5px solid ${filterSize === s ? "#C9A84C" : "rgba(200,149,108,0.4)"}`,
                  fontFamily: "'Jost',sans-serif", fontWeight: 500, cursor: "pointer",
                  borderRadius: 2, transition: "all 0.15s", height: 24, boxSizing: "border-box",
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ width: 1, height: 20, background: "rgba(200,149,108,0.2)", flexShrink: 0 }} />

          {/* Filtre prix */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={labelStyle}>Prix (DT)</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input
                type="text"
                value={priceMin}
                onChange={e => setPriceMin(e.target.value)}
                placeholder="min"
                style={{ width: 44, padding: "4px 6px", fontSize: 9, border: "1.5px solid rgba(200,149,108,0.4)", borderRadius: 2, fontFamily: "'Jost',sans-serif", outline: "none", background: "white", color: "#2C2A20", height: 24, boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#C9A84C"}
                onBlur={e => e.target.style.borderColor = "rgba(200,149,108,0.4)"}
              />
              <span style={{ fontFamily: "'Jost',sans-serif", fontSize: 9, color: "var(--text-muted)" }}>—</span>
              <input
                type="text"
                value={priceMax}
                onChange={e => setPriceMax(e.target.value)}
                placeholder="max"
                style={{ width: 44, padding: "4px 6px", fontSize: 9, border: "1.5px solid rgba(200,149,108,0.4)", borderRadius: 2, fontFamily: "'Jost',sans-serif", outline: "none", background: "white", color: "#2C2A20", height: 24, boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#C9A84C"}
                onBlur={e => e.target.style.borderColor = "rgba(200,149,108,0.4)"}
              />
            </div>
          </div>

          <div style={{ width: 1, height: 20, background: "rgba(200,149,108,0.2)", flexShrink: 0 }} />

          {/* Tri */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <span style={labelStyle}>Trier par</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ padding: "4px 20px 4px 6px", fontSize: 9, border: "1.5px solid rgba(200,149,108,0.4)", borderRadius: 2, fontFamily: "'Jost',sans-serif", outline: "none", background: "white", color: "#2C2A20", cursor: "pointer", height: 24, boxSizing: "border-box", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='5' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23C9A84C' stroke-width='1.5'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 5px center" }}
            >
              <option value="default">par défaut</option>
              <option value="price_asc">prix croissant</option>
              <option value="price_desc">prix décroissant</option>
              <option value="newest">nouveautés</option>
            </select>
          </div>

          {/* Réinitialiser */}
          {hasActiveFilter && (
            <button onClick={resetFilters} style={{
              padding: "4px 10px", fontSize: 10,
              background: "none", color: "#e57373",
              border: "1.5px solid #e57373", cursor: "pointer",
              fontFamily: "'Jost',sans-serif", fontWeight: 500,
              borderRadius: 2, display: "flex", alignItems: "center", gap: 5,
              transition: "all 0.15s",
              height: 24, boxSizing: "border-box", flexShrink: 0,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Product grid */}
      <div className="cat-gallery-grid" style={{ padding: "40px clamp(20px,4vw,60px) 80px", maxWidth: 1300, margin: "0 auto" }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            fontFamily: "'Jost',sans-serif", color: "var(--text-muted)", fontSize: 14,
          }}>
            Aucun article ne correspond à vos filtres.
            <br />
            <button onClick={resetFilters} style={{
              marginTop: 16, padding: "10px 28px", fontSize: 12,
              background: "#C9A84C", color: "white", border: "none", cursor: "pointer",
              fontFamily: "'Jost',sans-serif", letterSpacing: "1px",
            }}>
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 20 }}>
            {filtered.map((group, i) => (
              <ProductGroupCard
                key={i}
                cat={cat}
                group={group}
                groupIndex={i}
                onOrder={setOrderProduct}
                onAddToCart={handleAddToCart}
                onOpenDetail={setDetailGroup}
              />
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Fenêtre détail produit (couleurs + lien partageable) */}
      {detailGroup && (
        <ProductDetailModal
          shareKey={makeProductKey(cat.id, detailGroup)}
          product={{
            catId: cat.id,
            category: cat.label,
            label: detailGroup.label,
            price: detailGroup.price ?? cat.price,
            desc: detailGroup.description ?? cat.desc,
            sizes: detailGroup.sizes ?? cat.sizes ?? [],
            photos: detailGroup.photos ?? [],
            supabaseId: detailGroup.supabaseId,
          }}
          onClose={() => setDetailGroup(null)}
          onOrder={(p) => { setDetailGroup(null); setOrderProduct(p); }}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Order modal */}
      {orderProduct && <OrderModal product={orderProduct} onClose={() => setOrderProduct(null)} />}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function CollectionPage({ onBack, initialCategory, initialProductKey }) {
  const [selected, setSelected] = useState(initialCategory || null);
  const selectedCat = categories.find(c => c.id === selected);
  const [showTop, setShowTop] = useState(false);
  const { count: cartCount, setIsOpen: openCart } = useCart();

  // Clé produit issue d'un lien partagé (consommée une fois ouverte)
  const [pendingProductKey, setPendingProductKey] = useState(initialProductKey || null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [selected]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="collection-page">
      <AnnouncementBar />
      <RamadanDecor />

      {/* Nav */}
      <nav style={{
        position: "sticky", top: ANNOUNCE_H, zIndex: 1000, height: 70,
        background: "rgba(250,247,242,0.97)", WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(200,149,108,0.15)",
        padding: "0 clamp(20px,4vw,60px)", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <img src="/images/logo.png" alt="Basma" onClick={onBack} style={{ height: 42, cursor: "pointer" }} />

        <div className="nav-links-desktop" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {[
            { label: "ACCUEIL",    action: onBack },
            { label: "COLLECTION", action: () => setSelected(null) },
            { label: "CONTACT",    action: onBack },
          ].map(({ label, action }) => (
            <a key={label} className="nav-link" onClick={action}>{label}</a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Cart icon */}
          <button
            onClick={() => openCart(true)}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", color: "var(--dark)", padding: 4 }}
            title="Mon panier"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -5, right: -7,
                background: "var(--gold)", color: "white",
                fontSize: 10, fontWeight: 700, width: 18, height: 18,
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontFamily: "'Jost',sans-serif",
              }}>
                {cartCount}
              </span>
            )}
          </button>

          <button className="coll-back-btn" onClick={selected ? () => setSelected(null) : onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
            {selected ? "Collections" : "Retour"}
          </button>
        </div>
      </nav>

      {/* Scroll to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{
          position: "fixed", bottom: 74, right: 24, zIndex: 900,
          width: 42, height: 42, borderRadius: "50%",
          background: "rgba(250,247,242,0.92)", border: "1px solid rgba(200,149,108,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)", transition: "all 0.35s cubic-bezier(0.25,0.46,0.45,0.94)",
          color: "var(--gold)",
          opacity: showTop ? 1 : 0,
          transform: showTop ? "translateY(0) scale(1)" : "translateY(14px) scale(0.8)",
          pointerEvents: showTop ? "auto" : "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
        </svg>
      </button>

      {selected && selectedCat ? (
        <CategoryGallery
          cat={selectedCat}
          onBack={() => setSelected(null)}
          openProductKey={pendingProductKey}
          onDeepLinkConsumed={() => setPendingProductKey(null)}
        />
      ) : (
        <>
          <div className="coll-title-section">
            <p className="coll-eyebrow">✦ Basma Only Shop</p>
            <h1 className="coll-title">Notre <em>Collection</em></h1>
            <div className="coll-divider">
              <div className="coll-line" />
              <span className="coll-sub">{categories.length} catégories</span>
              <div className="coll-line" />
            </div>
          </div>
          <div className="sq-grid">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} delay={i} onClick={() => setSelected(cat.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
