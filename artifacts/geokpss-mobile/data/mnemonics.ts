export type KpssMnemonic = {
  id: string;
  title: string;
  code: string;
  category: string;
  expansion: string;
  tip: string;
  relatedItemId?: string;
};

/**
 * KPSS Coğrafya'da en çok soru gelen klasik hafıza kodlamaları (Mnemonics) ve bilgi kartları.
 */
export const KPSS_MNEMONICS: KpssMnemonic[] = [
  {
    id: 'mn-ege-horst',
    title: 'Ege’nin Kırık (Horst) Dağları (Kuzeyden Güneye)',
    code: 'KaZ - MaDra - YuNt - BoZ - AyDın - MeNteşe',
    category: 'Dağlar',
    expansion: 'Kaz Dağları → Madra Dağı → Yunt Dağı → Bozdağlar → Aydın Dağları → Menteşe Dağları',
    tip: 'Tekerleme: “Kız Meral Yunt’tan Boz Ayı’yaindi, Menteşe’ye gitti.” Menteşe hariç tamamı kıyıya dik uzanır.',
    relatedItemId: 'bozdaglar',
  },
  {
    id: 'mn-ege-graben',
    title: 'Ege’nin Graben (Çöküntü) Ovaları (Kuzeyden Güneye)',
    code: 'B.G.K.B. (Bakırçay - Gediz - Küçük Menderes - Büyük Menderes)',
    category: 'Platolar ve ovalar',
    expansion: 'Edremit → Bakırçay → Gediz → Küçük Menderes → Büyük Menderes grabenleri',
    tip: 'Horstların arasına sırasıyla yerleşmiş tektonik çöküntü oluklarıdır.',
    relatedItemId: 'gediz-graben',
  },
  {
    id: 'mn-ege-delta',
    title: 'Ege’nin Delta Ovaları (Kuzeyden Güneye)',
    code: 'Di - Me - Se - Ba (Dikili - Menemen - Selçuk - Balat)',
    category: 'Platolar ve ovalar',
    expansion: 'Bakırçay → Dikili | Gediz → Menemen | K. Menderes → Selçuk | B. Menderes → Balat',
    tip: 'Ege kıyılarında kıta sahanlığı geniş olduğu için her graben akarsuyu ağzında bir delta oluşmuştur.',
    relatedItemId: 'menemen',
  },
  {
    id: 'mn-karstik-ova',
    title: 'Güneybatı Anadolu Karstik (Polye) Ovaları',
    code: 'T A K K E M',
    category: 'Platolar ve ovalar',
    expansion: 'Tefenni - Acıpayam - Korkuteli - Kestel - Elmalı - Muğla (ve Çeltikçi / Gembos)',
    tip: 'Kalker erimesiyle oluşan polyelerdir; tabanları alüvyal olduğu için tarıma elverişlidir.',
    relatedItemId: 'tefenni',
  },
  {
    id: 'mn-akdeniz-gecit',
    title: 'Akdeniz’i İç Kesimlere Bağlayan Geçitler (Batıdan Doğuya)',
    code: 'ÇuBuKla SeRT TaVuğu GüLerek BeLine Vur',
    category: 'Ulaşım ve sınırlar',
    expansion: 'Çubuk (Antalya-Göller Yöresi) → Sertavul (Mersin-Karaman) → Gülek (Adana-Niğde/İç Anadolu) → Belen (İskenderun-Antakya)',
    tip: 'Batıdan doğuya sırası ÖSYM tarafından doğrudan sorulur: Çubuk - Sertavul - Gülek - Belen.',
    relatedItemId: 'gulek-bogazi',
  },
  {
    id: 'mn-yerel-ruzgar',
    title: 'Türkiye’yi Etkileyen Yerel Rüzgarlar (Saat Yönünde)',
    code: 'Ka - Yı - P   Sa - Ka - L',
    category: 'İklim ve rüzgarlar',
    expansion: 'Kuzeyden esen soğuklar: Karayel (KB), Yıldız (K), Poyraz (KD) | Güneyden esen sıcaklar: Samyeli/Keşişleme (GD), Kıble (G), Lodos (GB)',
    tip: 'Kuzeybatıdan başlayarak saat yönünde döner; ilk üçü sıcaklığı düşürür, son üçü sıcaklığı artırır.',
    relatedItemId: 'karayel',
  },
  {
    id: 'mn-heyelan-set',
    title: 'Karadeniz Heyelan Set Gölleri',
    code: 'T U S A B Y Z (Tortum - Uzungöl - Sera - Abant - Borabay - Yedigöller - Zinav)',
    category: 'Göller',
    expansion: 'Tortum (Erzurum), Sera ve Uzungöl (Trabzon), Borabay (Amasya), Abant ve Yedigöller (Bolu), Zinav (Tokat), Sülük (Bolu)',
    tip: 'Eğim ve yağışın fazla olduğu Karadeniz kuşağında vadi önünün heyelanla kapanması sonucu oluşurlar.',
    relatedItemId: 'abant',
  },
  {
    id: 'mn-aluvyal-set',
    title: 'Alüvyal Set Gölleri',
    code: 'K E M U B (Köyceğiz - Eymir - Mogan - Uzungöl - Bafa/Çamiçi - Marmara)',
    category: 'Göller',
    expansion: 'Mogan ve Eymir (Ankara), Bafa/Çamiçi (Aydın-Muğla), Köyceğiz (Muğla), Marmara Gölü (Manisa), Uzungöl (Trabzon)',
    tip: 'Akarsuların taşıdığı alüvyonların koy veya vadi önünü kapatmasıyla oluşur.',
    relatedItemId: 'mogan',
  },
  {
    id: 'mn-kiyi-set',
    title: 'Kıyı Set (Lagün) Gölleri',
    code: 'B.Çekmece - K.Çekmece - Terkos (Durusu) - Akyatan - Ağyatan - Balık',
    category: 'Göller',
    expansion: 'İstanbul: Büyükçekmece, Küçükçekmece, Terkos | Adana: Akyatan, Ağyatan | Samsun: Balık (Simenlik)',
    tip: 'Dalga biriktirmesiyle oluşan kıyı kordonunun koy önünü kapatmasıyla oluşur.',
    relatedItemId: 'terkos',
  },
  {
    id: 'mn-tektonik-gol',
    title: 'Başlıca Tektonik Göller',
    code: 'B A S İ T   M U H A S E B E',
    category: 'Göller',
    expansion: 'Burdur, Acıgöl, Sapanca, İznik, Tuz Gölü, Manyas (Kuş), Uluabat, Hazar, Akşehir, Seyfe, Eber, Beyşehir, Eğirdir',
    tip: 'Burdur, Acıgöl, Beyşehir ve Eğirdir aynı zamanda karstik etkiler taşıdığı için “Karma Oluşumlu” olarak da alınır.',
    relatedItemId: 'iznik',
  },
  {
    id: 'mn-kapali-havza',
    title: 'Türkiye’nin Başlıca Kapalı Havzaları',
    code: 'V A K G (Van Gölü - Aras/Kura - Konya/Tuz Gölü - Göller Yöresi)',
    category: 'Akarsular ve havzalar',
    expansion: '1. İç Anadolu (Tuz Gölü / Konya / Afyon-Akarçay) | 2. Van Gölü | 3. Göller Yöresi (Burdur-Acıgöl) | 4. Aras-Kura (Hazar Denizi’ne dökülür)',
    tip: 'Aras ve Kura nehirleri Türkiye sınırlarını aşsa da bir göl olan Hazar Denizi’ne döküldüğü için kapalı havzadır!',
    relatedItemId: 'aras',
  },
  {
    id: 'mn-bakir-maden',
    title: 'Bakır Çıkarılan Başlıca Yöreler',
    code: 'K A D E R (Kastamonu - Artvin - Diyarbakır - Elazığ - Rize)',
    category: 'Madenler ve enerji',
    expansion: 'Kastamonu (Küre), Artvin (Murgul), Diyarbakır (Ergani), Elazığ (Maden), Rize (Çayeli)',
    tip: 'Dikkat: Samsun’da bakır ÇIKARILMAZ, yalnızca liman/ulaşım avantajı nedeniyle bakır İŞLENİR!',
    relatedItemId: 'elazig-bakir',
  },
  {
    id: 'mn-bor-maden',
    title: 'Bor Madeni Çıkarılan İller',
    code: 'B E B E K (Balıkesir - Eskişehir - Bursa - Kütahya)',
    category: 'Madenler ve enerji',
    expansion: 'Balıkesir (Susurluk-Bigadiç), Eskişehir (Kırka-Seyitgazi), Bursa (Mustafakemalpaşa-Kestelek), Kütahya (Emet)',
    tip: 'Türkiye dünya bor rezervinde (~%73) açık ara 1. sıradadır.',
    relatedItemId: 'bor',
  },
  {
    id: 'mn-devlet-tarim',
    title: 'Devlet Kontrolünde Yetiştirilen Tarım Ürünleri',
    code: 'K E P T İ Ç (Kenevir - Haşhaş - Pirinç - Tütün - Çay - Şekerpancarı)',
    category: 'Tarım ve hayvancılık',
    expansion: 'Kenevir & Haşhaş: Uyuşturucu/güvenlik | Pirinç (Çeltik): Sıtma/sağlık | Tütün & Çay: Kaliteyi koruma | Şekerpancarı: Kota/üretim planlaması',
    tip: 'Her ürünün devlet kontrolünde olma nedeni farklıdır; ÖSYM ürün-neden eşleştirmesini sorar.',
    relatedItemId: 'hashas-kenevir',
  },
];
