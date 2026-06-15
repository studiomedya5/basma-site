// ─── Délégations de Tunisie par gouvernorat ──────────────────
// Utilisé pour le select dépendant "Délégation" dans le formulaire
// de commande (obligatoire pour la société de livraison).
// Les clés correspondent EXACTEMENT aux gouvernorats de GOUVERNORATS.

export const DELEGATIONS = {
  "Ariana": ["Ariana Ville", "Ettadhamen", "Kalâat el-Andalous", "La Soukra", "Mnihla", "Raoued", "Sidi Thabet"],
  "Béja": ["Béja Nord", "Béja Sud", "Amdoun", "Goubellat", "Medjez el-Bab", "Nefza", "Téboursouk", "Testour", "Thibar"],
  "Ben Arous": ["Ben Arous", "Bou Mhel el-Bassatine", "El Mourouj", "Ezzahra", "Fouchana", "Hammam Chott", "Hammam Lif", "Mégrine", "Mohamedia", "Mornag", "Nouvelle Médina", "Radès"],
  "Bizerte": ["Bizerte Nord", "Bizerte Sud", "El Alia", "Ghar El Melh", "Ghezala", "Joumine", "Mateur", "Menzel Bourguiba", "Menzel Jemil", "Ras Jebel", "Sejnane", "Tinja", "Utique", "Zarzouna"],
  "Gabès": ["Gabès Médina", "Gabès Ouest", "Gabès Sud", "Ghannouch", "El Hamma", "Matmata", "Nouvelle Matmata", "Mareth", "Métouia", "Menzel Habib"],
  "Gafsa": ["Gafsa Nord", "Gafsa Sud", "Belkhir", "El Guettar", "El Ksar", "El Mdhilla", "Métlaoui", "Moularès", "Redeyef", "Sened", "Sidi Aïch"],
  "Jendouba": ["Jendouba", "Jendouba Nord", "Aïn Draham", "Balta-Bou Aouane", "Bou Salem", "Fernana", "Ghardimaou", "Oued Meliz", "Tabarka"],
  "Kairouan": ["Kairouan Nord", "Kairouan Sud", "Bou Hajla", "Chebika", "Echrarda", "El Alâa", "Haffouz", "Hajeb El Ayoun", "Nasrallah", "Oueslatia", "Sbikha"],
  "Kasserine": ["Kasserine Nord", "Kasserine Sud", "Ezzouhour", "Fériana", "Foussana", "Haïdra", "Hassi El Ferid", "Jedelienne", "Mejel Bel Abbès", "El Ayoun", "Sbeïtla", "Sbiba", "Thala"],
  "Kébili": ["Kébili Nord", "Kébili Sud", "Douz Nord", "Douz Sud", "Faouar", "Souk Lahad"],
  "Kef": ["Kef Est", "Kef Ouest", "Dahmani", "Jérissa", "Kalâat Khasba", "Kalâat Senan", "Nebeur", "Sakiet Sidi Youssef", "Sers", "Tajerouine", "Touiref", "Le Ksour"],
  "Mahdia": ["Mahdia", "Bou Merdès", "Chebba", "Chorbane", "El Jem", "Essouassi", "Hebira", "Ksour Essef", "Melloulèche", "Ouled Chamekh", "Sidi Alouane"],
  "Manouba": ["Manouba", "Borj El Amri", "Douar Hicher", "El Battan", "Jedaida", "Mornaguia", "Oued Ellil", "Tebourba"],
  "Médenine": ["Médenine Nord", "Médenine Sud", "Ben Gardane", "Beni Khedache", "Djerba - Ajim", "Djerba - Houmt Souk", "Djerba - Midoun", "Sidi Makhlouf", "Zarzis"],
  "Monastir": ["Monastir", "Bekalta", "Bembla", "Beni Hassen", "Jemmal", "Ksar Hellal", "Ksibet el-Médiouni", "Moknine", "Ouerdanine", "Sahline", "Sayada-Lamta-Bou Hajar", "Téboulba", "Zéramdine"],
  "Nabeul": ["Nabeul", "Béni Khalled", "Béni Khiar", "Bou Argoub", "Dar Chaâbane El Fehri", "El Haouaria", "El Mida", "Grombalia", "Hammamet", "Hammam Ghezèze", "Kelibia", "Korba", "Menzel Bouzelfa", "Menzel Temime", "Soliman", "Takelsa"],
  "Sfax": ["Sfax Ville", "Sfax Ouest", "Sfax Sud", "Agareb", "Bir Ali Ben Khalifa", "El Amra", "El Hencha", "Ghraïba", "Jebiniana", "Kerkennah", "Mahrès", "Menzel Chaker", "Sakiet Eddaïer", "Sakiet Ezzit", "Skhira", "Thyna"],
  "Sidi Bouzid": ["Sidi Bouzid Est", "Sidi Bouzid Ouest", "Bir El Hafey", "Cebbala Ouled Asker", "Jilma", "Meknassy", "Menzel Bouzaiane", "Mezzouna", "Ouled Haffouz", "Regueb", "Sidi Ali Ben Aoun", "Souk Jedid"],
  "Siliana": ["Siliana Nord", "Siliana Sud", "Bargou", "Bou Arada", "El Aroussa", "El Krib", "Gaâfour", "Kesra", "Makthar", "Rouhia", "Sidi Bou Rouis"],
  "Sousse": ["Sousse Médina", "Sousse Riadh", "Sousse Jaouhara", "Sousse Sidi Abdelhamid", "Akouda", "Bouficha", "Enfidha", "Hammam Sousse", "Hergla", "Kalâa Kebira", "Kalâa Seghira", "Kondar", "M'saken", "Sidi Bou Ali", "Sidi El Hani", "Zaouiet Sousse"],
  "Tataouine": ["Tataouine Nord", "Tataouine Sud", "Bir Lahmar", "Dehiba", "Ghomrassen", "Remada", "Smâr"],
  "Tozeur": ["Tozeur", "Degache", "Hamet Jérid", "Nefta", "Tameghza"],
  "Tunis": ["Bab El Bhar", "Bab Souika", "Carthage", "Cité El Khadra", "Djebel Jelloud", "El Kabaria", "El Menzah", "El Omrane", "El Omrane supérieur", "El Ouardia", "Ettahrir", "Ezzouhour", "Hraïria", "La Goulette", "La Marsa", "Le Bardo", "Le Kram", "Médina", "Séjoumi", "Sidi El Béchir", "Sidi Hassine"],
  "Zaghouan": ["Zaghouan", "Bir Mcherga", "El Fahs", "Nadhour", "Saouaf", "Zriba"],
};
