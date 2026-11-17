import type { MapItem } from './geography';

type ProvinceFeature = { properties: { plaka: number; il_adi: string; bolge: string } };
type ProvinceCollection = { features: ProvinceFeature[] };

const PROVINCE_GEO = require('./turkiye_iller.json') as ProvinceCollection;
const PROVINCE_ROWS = PROVINCE_GEO.features
  .map((feature) => feature.properties)
  .sort((a, b) => a.plaka - b.plaka);
const REGION_LIST = [...new Set(PROVINCE_ROWS.map((row) => row.bolge))];

function withAnswer(options: string[], answerIndex: number, answer: string): [string, string, string, string] {
  const slots = [...options];
  slots.splice(answerIndex, 0, answer);
  return slots.slice(0, 4) as [string, string, string, string];
}

/** 81 il için otomatik üretilen bölge + plaka kodu soruları. */
export const PROVINCE_MCQ: { name: string; plate: number; region: string; mcq: McqQuestion }[] =
  PROVINCE_ROWS.flatMap((row) => {
    const otherRegions = REGION_LIST.filter((region) => region !== row.bolge);
    const regionSlot = row.plaka % 4;
    const regionOptions = withAnswer(
      [0, 1, 2].map((offset) => otherRegions[(row.plaka + offset * 2) % otherRegions.length]),
      regionSlot,
      row.bolge,
    );
    const regionMcq: McqQuestion = {
      q: `${row.il_adi} ili hangi bölgededir?`,
      options: regionOptions,
      answer: regionSlot,
    };

    const plateSlot = (row.plaka + 1) % 4;
    const used = new Set<number>([row.plaka]);
    const plateDistractors: string[] = [];
    for (let step = 1; plateDistractors.length < 3; step += 1) {
      const candidate = ((row.plaka - 1 + step * 7) % 81) + 1;
      if (!used.has(candidate)) {
        used.add(candidate);
        plateDistractors.push(String(candidate).padStart(2, '0'));
      }
    }
    const plateMcq: McqQuestion = {
      q: `${row.il_adi} ilinin plaka kodu kaçtır?`,
      options: withAnswer(plateDistractors, plateSlot, String(row.plaka).padStart(2, '0')),
      answer: plateSlot,
    };

    return [
      { name: row.il_adi, plate: row.plaka, region: row.bolge, mcq: regionMcq },
      { name: row.il_adi, plate: row.plaka, region: row.bolge, mcq: plateMcq },
    ];
  });

export type McqQuestion = {
  q: string;
  options: [string, string, string, string];
  answer: number;
  /** Soru formatı etiketi (örn. "Neden-sonuç"). */
  tag?: string;
};

/**
 * Soru bankası — her MapItem için elle hazırlanan KPSS tarzı çoktan seçmeli sorular.
 * Cevaplar data/geography.ts içindeki doğrulanmış alanlara dayanır.
 */
export const ITEM_MCQ: Record<string, McqQuestion[]> = {
  agri: [
    { q: 'Büyük Ağrı Dağı hangi ilimizdedir?', options: ['Ağrı', 'Van', 'Iğdır', 'Kars'], answer: 0 },
    { q: 'Büyük Ağrı Dağı’nın oluşum tipi nedir?', options: ['Kıvrım', 'Kırık (horst)', 'Volkanik', 'Buzul'], answer: 2 },
    { q: 'Türkiye’nin en yüksek dağı hangisidir?', options: ['Süphan', 'Büyük Ağrı', 'Cilo-Sat', 'Kaçkar'], answer: 1 },
  ],
  tendurek: [
    { q: 'Tendürek Dağı hangi iller arasındadır?', options: ['Van-Ağrı', 'Bitlis-Muş', 'Kars-Iğdır', 'Erzurum-Kars'], answer: 0 },
    { q: 'Tendürek Dağı’nın krater yapısı nasıldır?', options: ['Tek kraterli', 'Çift kraterli', 'Kaldera', 'Buzul sirk'], answer: 1 },
  ],
  suphan: [
    { q: 'Süphan Dağı hangi iller arasındadır?', options: ['Van-Bitlis', 'Ağrı-Iğdır', 'Muş-Bingöl', 'Hakkari-Şırnak'], answer: 0 },
    { q: 'Süphan Dağı’nın yaklaşık yüksekliği kaç metredir?', options: ['2.935 m', '3.127 m', '4.058 m', '3.932 m'], answer: 2 },
  ],
  'nemrut-bitlis': [
    { q: 'Kaldera yapısı ve sıcak-soğuk gölleriyle bilinen Nemrut Dağı hangi ildedir?', options: ['Adıyaman', 'Bitlis', 'Van', 'Erzurum'], answer: 1 },
    { q: 'Van Gölü’nün oluşumunda hangi dağın lavları rol oynamıştır?', options: ['Süphan', 'Ağrı', 'Nemrut (Bitlis)', 'Tendürek'], answer: 2 },
  ],
  erciyes: [
    { q: 'Erciyes Dağı hangi ildedir?', options: ['Kayseri', 'Niğde', 'Aksaray', 'Nevşehir'], answer: 0 },
    { q: 'Erciyes Dağı hangi oluşum tipindedir?', options: ['Kıvrım', 'Volkanik', 'Kırık', 'Buzul'], answer: 1 },
  ],
  hasan: [
    { q: 'Hasan Dağı hangi illerde yer alır?', options: ['Aksaray-Niğde', 'Kayseri-Yozgat', 'Konya-Karaman', 'Nevşehir-Aksaray'], answer: 0 },
    { q: 'Hasan Dağı’nın krater sayısı kaçtır?', options: ['Tek', 'Çift zirveli', 'Üç', 'Kaldera'], answer: 1 },
  ],
  'karacadağ-se': [
    { q: 'Karacadağ hangi iller arasındadır?', options: ['Şanlıurfa-Diyarbakır', 'Gaziantep-Kilis', 'Mardin-Şırnak', 'Adıyaman-Malatya'], answer: 0 },
    { q: 'Türkiye’deki tek kalkan volkanı hangisidir?', options: ['Ağrı', 'Erciyes', 'Karacadağ', 'Süphan'], answer: 2 },
  ],
  kulavolkan: [
    { q: 'Kula volkanik sahası hangi ildedir?', options: ['Manisa', 'İzmir', 'Aydın', 'Denizli'], answer: 0 },
    { q: 'Kula volkanları hangi oluşum tipindedir?', options: ['Genç volkanik koniler', 'Kıvrım dağları', 'Buzul cirkleri', 'Delta ovaları'], answer: 0 },
  ],
  mentese: [
    { q: 'Menteşe Dağları hangi illerde yer alır?', options: ['Muğla-Aydın-Denizli', 'İzmir-Manisa', 'Burdur-Isparta', 'Antalya-Mersin'], answer: 0 },
    { q: 'Menteşe Dağları hangi oluşum sistemiyle ilişkilidir?', options: ['Horst-graben', 'Kıvrım kuşağı', 'Buzul aşındırması', 'Delta birikimi'], answer: 0 },
  ],
  kuladag: [
    { q: 'Kula Volkanları hangi ildedir?', options: ['Manisa', 'İzmir', 'Aydın', 'Denizli'], answer: 0 },
  ],
  kackar: [
    { q: 'Kaçkar Dağları hangi illerde yer alır?', options: ['Rize-Artvin', 'Trabzon-Giresun', 'Bayburt-Erzincan', 'Ordu-Giresun'], answer: 0 },
    { q: 'Kaçkar Dağları’nın oluşum tipi nedir?', options: ['Volkanik', 'Kıvrım', 'Kırık', 'Karstik'], answer: 1 },
  ],
  cilo: [
    { q: 'Cilo-Sat Dağları hangi ildedir?', options: ['Hakkâri', 'Van', 'Şırnak', 'Mardin'], answer: 0 },
    { q: 'Cilo-Sat Dağları hangi oluşum tipindedir?', options: ['Kıvrım', 'Volkanik', 'Kırık', 'Buzul'], answer: 0 },
  ],
  aladaglar: [
    { q: 'Aladağlar hangi illerde uzanır?', options: ['Niğde-Adana-Kayseri', 'Antalya-Muğla', 'Mersin-İçel', 'Konya-Karaman'], answer: 0 },
    { q: 'Aladağlar’daki en yüksek zirve hangisidir?', options: ['Erciyes', 'Demirkazık', 'Süphan', 'Cilo'], answer: 1 },
  ],
  kazdaglari: [
    { q: 'Kaz Dağları hangi illerde yer alır?', options: ['Balıkesir-Çanakkale', 'İzmir-Manisa', 'Bursa-Kocaeli', 'Edirne-Kırklareli'], answer: 0 },
    { q: 'Kaz Dağları hangi oluşum tipindedir?', options: ['Kıvrım', 'Kırık (horst)', 'Volkanik', 'Buzul'], answer: 1 },
  ],
  bozdaglar: [
    { q: 'Bozdağlar hangi illerde uzanır?', options: ['İzmir-Manisa', 'Aydın-Muğla', 'Denizli-Afyon', 'Uşak-Kütahya'], answer: 0 },
    { q: 'Bozdağlar hangi grabenler arasındadır?', options: ['Gediz-Küçük Menderes', 'Büyük Menderes-Akçay', 'Kızılırmak-Yeşilırmak', 'Fırat-Dicle'], answer: 0 },
  ],
  amanos: [
    { q: 'Amanos (Nur) Dağları hangi ildedir?', options: ['Hatay', 'Adana', 'Mersin', 'Kahramanmaraş'], answer: 0 },
  ],
  toroslar: [
    { q: 'Toroslar hangi yönde uzanır?', options: ['Doğu-batı', 'Kuzey-güney', 'Kuzeydoğu-güneybatı', 'Rastgele'], answer: 0 },
    { q: 'Toroslar hangi bölgeleri birbirinden ayırır?', options: ['Akdeniz-İç Anadolu', 'Karadeniz-Doğu Anadolu', 'Ege-Marmara', 'Güneydoğu-Doğu Anadolu'], answer: 0 },
  ],
  pontus: [
    { q: 'Pontus Dağları hangi bölgenin kıyı dağlarıdır?', options: ['Karadeniz', 'Akdeniz', 'Ege', 'Marmara'], answer: 0 },
    { q: 'Pontus Dağları hangi oluşum tipindedir?', options: ['Volkanik', 'Kıvrım', 'Kırık', 'Buzul'], answer: 1 },
  ],
  palandoken: [
    { q: 'Palandöken Dağları hangi ildedir?', options: ['Erzurum', 'Kars', 'Ağrı', 'Bingöl'], answer: 0 },
    { q: 'Palandöken hangi oluşum tipindedir?', options: ['Kıvrım', 'Kırık (horst)', 'Volkanik', 'Buzul'], answer: 1 },
  ],
  'tuz-golu': [
    { q: 'Tuz Gölü hangi illerde yer alır?', options: ['Ankara-Konya-Aksaray', 'Konya-Karaman', 'Nevşehir-Niğde', 'Eskişehir-Kütahya'], answer: 0 },
    { q: 'Tuz Gölü’nün suyu nasıldır?', options: ['Tatlı', 'Sodalı/tuzlu', 'Acı', 'Tatlı-sodalı karma'], answer: 1 },
  ],
  iznik: [
    { q: 'İznik Gölü hangi ildedir?', options: ['Bursa', 'İstanbul', 'Kocaeli', 'Sakarya'], answer: 0 },
    { q: 'İznik Gölü hangi oluşum tipindedir?', options: ['Tektonik', 'Karstik', 'Volkanik', 'Kıyı seti'], answer: 0 },
  ],
  sapanca: [
    { q: 'Sapanca Gölü hangi illerde yer alır?', options: ['Sakarya-Kocaeli', 'Bolu-Düzce', 'Zonguldak-Bartın', 'Ordu-Giresun'], answer: 0 },
  ],
  salda: [
    { q: 'Salda Gölü hangi ildedir?', options: ['Burdur', 'Isparta', 'Antalya', 'Muğla'], answer: 0 },
    { q: 'Salda Gölü hangi oluşum tipindedir?', options: ['Karstik', 'Tektonik', 'Volkanik', 'Buzul'], answer: 0 },
  ],
  van: [
    { q: 'Van Gölü hangi illerde yer alır?', options: ['Van-Bitlis', 'Ağrı-Muş', 'Hakkari-Şırnak', 'Siirt-Mardin'], answer: 0 },
    { q: 'Van Gölü hangi oluşum tipindedir?', options: ['Saf tektonik', 'Saf volkanik', 'Karma: tektonik + volkanik set', 'Kıyı seti'], answer: 2 },
    { q: 'Van Gölü’nün suyu nasıldır?', options: ['Tatlı', 'Sodalı', 'Acı', 'Karışık'], answer: 1 },
  ],
  beysehir: [
    { q: 'Beyşehir Gölü hangi illerde yer alır?', options: ['Konya-Isparta', 'Burdur-Isparta', 'Antalya-Muğla', 'Afyon-Denizli'], answer: 0 },
    { q: 'Beyşehir Gölü hangi özelliğiyle bilinir?', options: ['En derin göl', 'En büyük tatlı su gölü', 'En tuzlu göl', 'Buzul gölü'], answer: 1 },
  ],
  meke: [
    { q: 'Meke Gölü hangi oluşum tipindedir?', options: ['Volkanik maar', 'Tektonik', 'Karstik', 'Kıyı seti'], answer: 0 },
    { q: 'Meke Gölü hangi ildedir?', options: ['Konya', 'Aksaray', 'Niğde', 'Nevşehir'], answer: 0 },
  ],
  cildir: [
    { q: 'Çıldır Gölü hangi illerde yer alır?', options: ['Ardahan-Kars', 'Erzurum-Ağrı', 'Van-Bitlis', 'Iğdır-Kars'], answer: 0 },
    { q: 'Çıldır Gölü hangi oluşum tipindedir?', options: ['Volkanik set', 'Tektonik', 'Karstik', 'Buzul'], answer: 0 },
  ],
  terkos: [
    { q: 'Terkos (Durusu) Gölü hangi oluşum tipindedir?', options: ['Kıyı seti', 'Tektonik', 'Volkanik', 'Buzul'], answer: 0 },
    { q: 'Terkos Gölü hangi ildedir?', options: ['İstanbul', 'Kocaeli', 'Tekirdağ', 'Sakarya'], answer: 0 },
  ],
  tortum: [
    { q: 'Tortum Gölü hangi oluşum tipindedir?', options: ['Heyelan seti', 'Tektonik', 'Volkanik', 'Karstik'], answer: 0 },
    { q: 'Tortum Gölü hangi ildedir?', options: ['Erzurum', 'Artvin', 'Rize', 'Bayburt'], answer: 0 },
  ],
  'uludag-sirk': [
    { q: 'Uludağ’daki sirk gölleri hangi döneme aittir?', options: ['Güncel buzul', 'Geçmiş dönem (buzul izleri)', 'Tektonik', 'Volkanik'], answer: 1 },
  ],
  burdur: [
    { q: 'Burdur Gölü hangi illerde yer alır?', options: ['Burdur-Isparta', 'Antalya-Muğla', 'Denizli-Afyon', 'Konya-Karaman'], answer: 0 },
    { q: 'Burdur Gölü’nün suyu nasıldır?', options: ['Tatlı', 'Sodalı', 'Acı', 'Karışık'], answer: 1 },
  ],
  acigol: [
    { q: 'Acıgöl hangi illerde yer alır?', options: ['Afyonkarahisar-Denizli', 'Isparta-Burdur', 'Konya-Karaman', 'Manisa-Aydın'], answer: 0 },
  ],
  manyas: [
    { q: 'Manyas Gölü hangi ildedir?', options: ['Balıkesir', 'Bursa', 'Çanakkale', 'İzmir'], answer: 0 },
    { q: 'Manyas Gölü hangi adla da bilinir?', options: ['Uluabat', 'Sapanca', 'Terkos', 'Abant'], answer: 0 },
  ],
  eber: [
    { q: 'Eber Gölü hangi illerde yer alır?', options: ['Isparta-Burdur', 'Antalya-Muğla', 'Afyon-Denizli', 'Konya-Aksaray'], answer: 0 },
  ],
  'erzurum-kars': [
    { q: 'Erzurum-Kars-Ardahan Platosu hangi oluşumla meydana gelmiştir?', options: ['Lav örtüleri (volkanik)', 'Buzul aşındırması', 'Deniz birikimi', 'Rüzgar erozyonu'], answer: 0 },
  ],
  teke: [
    { q: 'Teke Platosu hangi illerde yer alır?', options: ['Antalya-Muğla', 'Mersin-Karaman', 'Isparta-Burdur', 'Konya-Karaman'], answer: 0 },
    { q: 'Teke Platosu hangi oluşum tipindedir?', options: ['Karstik', 'Volkanik', 'Delta', 'Tektonik'], answer: 0 },
  ],
  taseli: [
    { q: 'Taşeli Platosu hangi illerde yer alır?', options: ['Mersin-Karaman', 'Adana-Mersin', 'Antalya-Isparta', 'Konya-Karaman'], answer: 0 },
    { q: 'Taşeli Platosu neden en engebeli karstik platolardandır?', options: ['Kalker erimesi', 'Buzul aşındırması', 'Volkanik patlama', 'Deniz taşkını'], answer: 0 },
  ],
  bafra: [
    { q: 'Bafra Ovası hangi akarsuyun taşıdığı alüvyonlarla oluşmuştur?', options: ['Kızılırmak', 'Yeşilırmak', 'Sakarya', 'Filyos'], answer: 0 },
    { q: 'Bafra Ovası hangi ildedir?', options: ['Samsun', 'Ordu', 'Trabzon', 'Sinop'], answer: 0 },
  ],
  carsamba: [
    { q: 'Çarşamba Ovası hangi akarsuyun oluşturduğu delta ovasıdır?', options: ['Yeşilırmak', 'Kızılırmak', 'Çoruh', 'Filyos'], answer: 0 },
  ],
  ergene: [
    { q: 'Ergene Ovası hangi bölgededir?', options: ['Trakya', 'Doğu Anadolu', 'Karadeniz', 'Akdeniz'], answer: 0 },
    { q: 'Ergene Ovası hangi oluşum tipindedir?', options: ['Tektonik', 'Delta', 'Volkanik', 'Karstik'], answer: 0 },
  ],
  cukurova: [
    { q: 'Çukurova hangi nehirlerin deltalarıyla oluşmuştur?', options: ['Seyhan ve Ceyhan', 'Kızılırmak ve Yeşilırmak', 'Fırat ve Dicle', 'Manavgat ve Aksu'], answer: 0 },
    { q: 'Çukurova hangi illeri kapsar?', options: ['Adana-Mersin-Osmaniye', 'Hatay-Kilis-Gaziantep', 'Antalya-Isparta', 'Konya-Karaman'], answer: 0 },
    { q: 'Çukurova hangi ürünleriyle ünlüdür?', options: ['Pamuk ve narenciye', 'Çay ve fındık', 'Buğday ve arpa', 'Zeytin ve incir'], answer: 0 },
  ],
  amik: [
    { q: 'Amik Ovası hangi nehrin oluşturduğu ovadır?', options: ['Asi (Orontes)', 'Fırat', 'Ceyhan', 'Seyhan'], answer: 0 },
    { q: 'Amik Ovası hangi bölgede yer alır?', options: ['Hatay', 'Adana', 'Mersin', 'Antalya'], answer: 0 },
  ],
  'konya-ova': [
    { q: 'Konya Ovası hangi havzadadır?', options: ['Kapalı havza', 'Karadeniz havzası', 'Akdeniz havzası', 'Ege havzası'], answer: 0 },
  ],
  'menderes-delta': [
    { q: 'Büyük Menderes deltası hangi ildedir?', options: ['Aydın', 'İzmir', 'Muğla', 'Denizli'], answer: 0 },
  ],
  kizilirmak: [
    { q: 'Kızılırmak hangi denize dökülür?', options: ['Karadeniz', 'Akdeniz', 'Ege', 'Marmara'], answer: 0 },
    { q: 'Kızılırmak Türkiye sınırları içinde doğup hangi ile ulaşır?', options: ['Samsun', 'Trabzon', 'Ordu', 'Sinop'], answer: 0 },
    { q: 'Kızılırmak hangi ovayı oluşturur?', options: ['Bafra Ovası', 'Çarşamba Ovası', 'Ergene Ovası', 'Amik Ovası'], answer: 0 },
  ],
  yesilirmak: [
    { q: 'Yeşilırmak hangi ovayı oluşturur?', options: ['Çarşamba Ovası', 'Bafra Ovası', 'Ergene Ovası', 'Konya Ovası'], answer: 0 },
  ],
  firat: [
    { q: 'Fırat Nehri hangi denize ulaşır?', options: ['Basra Körfezi (Körfez)', 'Akdeniz', 'Karadeniz', 'Ege'], answer: 0 },
    { q: 'Fırat üzerinde hangi barajlar bulunur?', options: ['Atatürk ve Keban', 'Deriner ve Artvin', 'Ilısu ve Cizre (Dicle)', 'Seyhan ve Manavgat'], answer: 0 },
  ],
  dicle: [
    { q: 'Dicle Nehri hangi nehirle birlikte Mezopotamya’yı oluşturur?', options: ['Fırat', 'Seyhan', 'Ceyhan', 'Kızılırmak'], answer: 0 },
    { q: 'Dicle üzerindeki GAP barajı hangisidir?', options: ['Ilısu', 'Atatürk', 'Keban', 'Deriner'], answer: 0 },
  ],
  ceyhan: [
    { q: 'Ceyhan Nehri hangi denize ulaşır?', options: ['Akdeniz', 'Karadeniz', 'Ege', 'Marmara'], answer: 0 },
    { q: 'Ceyhan hangi illerde akar?', options: ['Kahramanmaraş-Adana', 'Hatay-Kilis', 'Antalya-Mersin', 'Konya-Karaman'], answer: 0 },
  ],
  seyhan: [
    { q: 'Seyhan Nehri hangi denize ulaşır?', options: ['Akdeniz', 'Karadeniz', 'Ege', 'Marmara'], answer: 0 },
    { q: 'Seyhan hangi ovaları sulayıp deltası oluşturur?', options: ['Çukurova', 'Amik', 'Ergene', 'Konya'], answer: 0 },
  ],
  manavgat: [
    { q: 'Manavgat Şelalesi hangi nehrin üzerindedir?', options: ['Manavgat', 'Aksu', 'Ceyhan', 'Asi'], answer: 0 },
  ],
  aksu: [
    { q: 'Aksu Nehri hangi ildedir?', options: ['Isparta-Antalya', 'Burdur-Isparta', 'Mersin-Adana', 'Muğla-Aydın'], answer: 0 },
  ],
  asi: [
    { q: 'Asi (Orontes) Nehri hangi denize ulaşır?', options: ['Akdeniz', 'Karadeniz', 'Ege', 'Marmara'], answer: 0 },
    { q: 'Asi Nehri hangi ovayı oluşturur?', options: ['Amik Ovası', 'Çukurova', 'Ergene Ovası', 'Bafra Ovası'], answer: 0 },
    { q: 'Asi Nehri hangi ülkelerin sınırına yakındır?', options: ['Suriye', 'Irak', 'İran', 'Gürcistan'], answer: 0 },
  ],
  meric: [
    { q: 'Meriç Nehri hangi ülkelere uzanır?', options: ['Yunanistan ve Bulgaristan', 'Suriye ve Irak', 'İran ve Irak', 'Gürcistan ve Ermenistan'], answer: 0 },
    { q: 'Meriç deltasının Türkiye’deki konumu neresidir?', options: ['En batı', 'En doğu', 'En kuzey', 'En güney'], answer: 0 },
  ],
  coruh: [
    { q: 'Çoruh Nehri hangi denize dökülür?', options: ['Karadeniz', 'Ege', 'Akdeniz', 'Marmara'], answer: 0 },
    { q: 'Çoruh üzerinde hangi baraj bulunmaktadır?', options: ['Deriner', 'Atatürk', 'Ilısu', 'Keban'], answer: 0 },
  ],
  sakarya: [
    { q: 'Sakarya Nehri hangi illerde kaynağını alır?', options: ['Afyonkarahisar-Eskişehir', 'Konya-Karaman', 'Sivas-Yozgat', 'Kastamonu-Çankırı'], answer: 0 },
    { q: 'Sakarya Nehri hangi gölün havzasındadır?', options: ['Sapanca', 'Tuz', 'Beyşehir', 'Manyas'], answer: 0 },
  ],
  'konya-kapali': [
    { q: 'Konya kapalı havzası hangi göle ev sahipliği yapar?', options: ['Tuz Gölü', 'Beyşehir', 'Van', 'Terkos'], answer: 0 },
    { q: 'Kapalı havza ne demektir?', options: ['Akarsuların denize ulaşmadığı havza', 'Denize boşalan havza', 'Buzulla beslenen havza', 'Volkanik krater havzası'], answer: 0 },
  ],
  gediz: [
    { q: 'Gediz Nehri hangi denize ulaşır?', options: ['Ege', 'Akdeniz', 'Karadeniz', 'Marmara'], answer: 0 },
    { q: 'Gediz hangi ova sistemini besler?', options: ['Menemen Ovası', 'Bafra Ovası', 'Amik Ovası', 'Ergene Ovası'], answer: 0 },
  ],
  'buyuk-menderes': [
    { q: 'Büyük Menderes hangi denize ulaşır?', options: ['Ege', 'Akdeniz', 'Karadeniz', 'Marmara'], answer: 0 },
  ],
  'kucuk-menderes': [
    { q: 'Küçük Menderes hangi ovayı sulayıp Ege’ye ulaşır?', options: ['Aydın Ovası', 'Menemen Ovası', 'Bafra Ovası', 'Ergene Ovası'], answer: 0 },
  ],
  'boyuna-karadeniz': [
    { q: 'Boyuna kıyılarda dağlar kıyıya göre nasıl uzanır?', options: ['Paralel', 'Dik', 'Rastgele', 'Dalgasız'], answer: 0 },
    { q: 'Boyuna kıyıların tipik ili hangisidir?', options: ['Trabzon', 'İzmir', 'Antalya', 'İstanbul'], answer: 0 },
    { q: 'Boyuna kıyılarda kıta sahanlığı nasıldır?', options: ['Dar', 'Geniş', 'Orta', 'Yok'], answer: 0 },
  ],
  'enine-ege': [
    { q: 'Enine kıyılarda dağlar kıyıya göre nasıl uzanır?', options: ['Dik', 'Paralel', 'Rastgele', 'Dairesel'], answer: 0 },
    { q: 'Enine kıyıların tipik bölgesi hangisidir?', options: ['Ege', 'Karadeniz', 'Akdeniz', 'Marmara'], answer: 0 },
    { q: 'Enine kıyılarda kıta sahanlığı nasıldır?', options: ['Geniş', 'Dar', 'Orta', 'Yok'], answer: 0 },
  ],
  'ria-mugla': [
    { q: 'Ria kıyıları nasıl oluşur?', options: ['Akarsu vadilerinin deniz altında kalmasıyla', 'Lav setleriyle', 'Buzul erimesiyle', 'Rüzgar birikimiyle'], answer: 0 },
    { q: 'Ria kıyılarına örnek hangisidir?', options: ['Muğla kıyıları', 'Trabzon kıyıları', 'İzmir körfezi', 'Antalya kıyısı'], answer: 0 },
  ],
  'dalmatic-kas': [
    { q: 'Dalmaçya kıyıları hangi oluşumla meydana gelir?', options: ['Kıyıya paralel dağların sular altında kalması', 'Delta birikimi', 'Lav akıntıları', 'Kıyı setleri'], answer: 0 },
    { q: 'Dalmaçya kıyılarının Türkiye’deki örneği neresidir?', options: ['Kaş-Finike', 'Bodrum', 'Çanakkale', 'Sinop'], answer: 0 },
  ],
  'terkos-lagoon': [
    { q: 'Kıyı set gölü nasıl oluşur?', options: ['Kıyı setinin gerisinde denizden ayrılarak', 'Tektonik çukurda', 'Volkanik kraterde', 'Heyelanla'], answer: 0 },
    { q: 'Aşağıdakilerden hangisi kıyı set gölüdür?', options: ['Büyükçekmece', 'Van Gölü', 'Tuz Gölü', 'Beyşehir'], answer: 0 },
  ],
  'ege-set': [
    { q: 'Ege kıyı setlerine örnek hangisidir?', options: ['Çeşme Altınkum', 'Saros Körfezi', 'İskenderun Körfezi', 'İzmit Körfezi'], answer: 0 },
  ],
  'bafk': [
    { q: 'Bafra-Çarşamba delta kıyıları hangi bölgededir?', options: ['Karadeniz', 'Ege', 'Akdeniz', 'Marmara'], answer: 0 },
  ],
  'meric-delta': [
    { q: 'Meriç deltası Türkiye’nin hangi kesimindedir?', options: ['En batı', 'En doğu', 'En kuzey', 'En güney'], answer: 0 },
  ],
  'boyuna-akdeniz': [
    { q: 'Doğu Akdeniz kıyıları (Hatay-Mersin) hangi tiptedir?', options: ['Boyuna', 'Enine', 'Ria', 'Delta'], answer: 0 },
    { q: 'Aşağıdaki kıyılardan hangisi boyuna tiptedir?', options: ['Hatay kıyıları', 'İzmir körfezi', 'Muğla ria kıyıları', 'Meriç deltası'], answer: 0 },
  ],
  kekova: [
    { q: 'Kekova hangi ilde yer alır?', options: ['Antalya', 'Muğla', 'İzmir', 'Mersin'], answer: 0 },
    { q: 'Kekova hangi kıyı tipinin Akdeniz’deki örneğidir?', options: ['Dalmaçya', 'Ria', 'Enine', 'Delta'], answer: 0 },
  ],
  kusadasi: [
    { q: 'Kuşadası Körfezi hangi kıyı tipindedir?', options: ['Ria', 'Boyuna', 'Dalmaçya', 'Delta'], answer: 0 },
    { q: 'Kuşadası Körfezi hangi ildedir?', options: ['İzmir', 'Aydın', 'Muğla', 'Denizli'], answer: 0 },
  ],
  'gokova-ria': [
    { q: 'Gökova Körfezi hangi illde yer alır?', options: ['Muğla', 'Aydın', 'İzmir', 'Antalya'], answer: 0 },
    { q: 'Gökova Körfezi hangi kıyı tipinin en tipik örneğidir?', options: ['Ria', 'Boyuna', 'Enine', 'Kıyı seti'], answer: 0 },
  ],
  'amik-delta': [
    { q: 'Amik Ovası kıyısı hangi nehrin deltasına dayanır?', options: ['Asi (Orontes)', 'Fırat', 'Ceyhan', 'Seyhan'], answer: 0 },
    { q: 'Amik deltası hangi ildedir?', options: ['Hatay', 'Adana', 'Mersin', 'Osmaniye'], answer: 0 },
  ],
  'goksu-delta': [
    { q: 'Göksu deltası hangi ildedir?', options: ['Mersin', 'Adana', 'Antalya', 'Hatay'], answer: 0 },
    { q: 'Göksu deltası hangi nehrin oluşturduğu kıyıdır?', options: ['Göksu', 'Seyhan', 'Ceyhan', 'Manavgat'], answer: 0 },
  ],
  akyatan: [
    { q: 'Akyatan deltası ve lagünleri hangi ildedir?', options: ['Adana', 'Mersin', 'Hatay', 'Antalya'], answer: 0 },
    { q: 'Akyatan hangi listede yer alır?', options: ['Ramsar', 'Milli park', 'Tabiat anıtı', 'Gen koruma alanı'], answer: 0 },
  ],
  yumurtalik: [
    { q: 'Yumurtalık lagünleri hangi ildedir?', options: ['Adana', 'Mersin', 'Hatay', 'Osmaniye'], answer: 0 },
    { q: 'Yumurtalık hangi kıyı oluşumunu temsil eder?', options: ['Kıyı seti (lagün)', 'Ria', 'Dalmaçya', 'Boyuna'], answer: 0 },
  ],
  kaf: [
    { q: 'Kuzey Anadolu Fay Hattı (KAF) hangi atım tipindedir?', options: ['Sağ yanal', 'Sol yanal', 'Bindirmeli', 'Normal'], answer: 0 },
    { q: 'KAF hangi yönde uzanır?', options: ['Doğu-batı', 'Kuzey-güney', 'Kuzeydoğu-güneybatı', 'Rastgele'], answer: 0 },
    { q: 'Aşağıdaki illerden hangisi KAF üzerindedir?', options: ['Düzce', 'Adana', 'Antalya', 'Mardin'], answer: 0 },
  ],
  daf: [
    { q: 'Doğu Anadolu Fay Hattı (DAF) hangi atım tipindedir?', options: ['Sol yanal', 'Sağ yanal', 'Bindirmeli', 'Normal'], answer: 0 },
    { q: 'Aşağıdaki illerden hangisi DAF hattı üzerindedir?', options: ['Elazığ', 'İzmir', 'Samsun', 'Kırklareli'], answer: 0 },
    { q: 'DAF hangi fay hattıyla Karlıova’da birleşir?', options: ['KAF', 'BAF', 'Ege fayları', 'Zigana fayları'], answer: 0 },
  ],
  baf: [
    { q: 'Batı Anadolu Fay Hattı hangi bölgede bulunur?', options: ['Ege', 'Karadeniz', 'Akdeniz', 'Güneydoğu'], answer: 0 },
    { q: 'Batı Anadolu fayları hangi oluşumla ilişkilidir?', options: ['Horst-graben sistemi', 'Kıvrım kuşağı', 'Buzul aşındırması', 'Delta birikimi'], answer: 0 },
  ],
  'dogu-volkan': [
    { q: 'Doğu Anadolu volkanik kuşağı hangi dağları içerir?', options: ['Ağrı-Süphan-Tendürek', 'Kaçkar-Cilo-Aladağ', 'Bozdağ-Menteşe', 'Palandöken-Toros'], answer: 0 },
  ],
  'alanya-masif': [
    { q: 'Alanya Masifi hangi bölgededir?', options: ['Akdeniz', 'Ege', 'Karadeniz', 'İç Anadolu'], answer: 0 },
  ],
  'menderes-masifi': [
    { q: 'Menderes Masifi hangi bölgede yer alır?', options: ['Ege', 'Akdeniz', 'Karadeniz', 'Güneydoğu'], answer: 0 },
  ],
  'erzurum-toprak': [
    { q: 'Erzurum-Kars çevresindeki çernozyom toprakları hangi iklimle ilişkilidir?', options: ['Yaz yağışlı karasal', 'Akdeniz', 'Karadeniz nemli', 'Ege'], answer: 0 },
    { q: 'Çernozyom toprakları hangi hayvancılıkla ilişkilendirilir?', options: ['Büyükbaş mera', 'Küçükbaş', 'Kanatlı', 'Arıcılık'], answer: 0 },
  ],
  'akdeniz-toprak': [
    { q: 'Terra rossa hangi bölgede yaygındır?', options: ['Akdeniz', 'Karadeniz', 'Ege', 'İç Anadolu'], answer: 0 },
    { q: 'Terra rossa hangi kayaçlarla ilişkilidir?', options: ['Kalker', 'Bazalt', 'Granit', 'Kumtaşı'], answer: 0 },
  ],
  'ic-anadolu-steppe': [
    { q: 'Bozkır bitki örtüsü hangi bölgede yaygındır?', options: ['İç Anadolu', 'Karadeniz', 'Akdeniz', 'Ege'], answer: 0 },
  ],
  'karadeniz-forest': [
    { q: 'Nemli orman kuşağı hangi bölgededir?', options: ['Karadeniz', 'Akdeniz', 'Ege', 'İç Anadolu'], answer: 0 },
  ],
  'zonguldak-komur': [
    { q: 'Taşkömürü yatakları hangi ildedir?', options: ['Zonguldak', 'Kütahya', 'Manisa', 'Muğla'], answer: 0 },
  ],
  'eskisehir-luletasi': [
    { q: 'Lületaşı hangi il ile özdeşleşmiştir?', options: ['Eskişehir', 'Kütahya', 'Bursa', 'Afyon'], answer: 0 },
  ],
  'elazig-bakir': [
    { q: 'Bakır yatakları hangi il çevresindedir?', options: ['Elazığ-Maden', 'Sivas-Divriği', 'Trabzon', 'Rize'], answer: 0 },
  ],
  'batman-petrol': [
    { q: 'Petrol üretiminin öne çıktığı bölge hangisidir?', options: ['Güneydoğu Anadolu', 'Doğu Anadolu', 'İç Anadolu', 'Marmara'], answer: 0 },
    { q: 'Batman rafinerisi hangi ürünle ilişkilidir?', options: ['Petrol', 'Doğalgaz', 'Linyit', 'Bor'], answer: 0 },
  ],
  'ege-jeotermal': [
    { q: 'Jeotermal enerjinin yoğun olduğu bölge hangisidir?', options: ['Ege', 'Karadeniz', 'Güneydoğu', 'İç Anadolu'], answer: 0 },
    { q: 'Jeotermal enerji hangi oluşumla ilişkilidir?', options: ['Kırıklı yapı', 'Kıvrım', 'Buzul', 'Delta'], answer: 0 },
  ],
  gap: [
    { q: 'GAP hangi havzaları kapsar?', options: ['Fırat ve Dicle', 'Kızılırmak ve Yeşilırmak', 'Sakarya ve Kızılırmak', 'Manavgat ve Aksu'], answer: 0 },
    { q: 'GAP’ın amiral projesi hangisidir?', options: ['Atatürk Barajı', 'Deriner', 'Ilısu', 'Seyhan Barajı'], answer: 0 },
  ],
  'kizilirmak-ramsar': [
    { q: 'Kızılırmak Deltası Ramsar alanı hangi ildedir?', options: ['Samsun', 'Ordu', 'Sinop', 'Trabzon'], answer: 0 },
    { q: 'Bafra Deltası hangi akarsuyun oluşturduğu sulak alandır?', options: ['Kızılırmak', 'Yeşilırmak', 'Çoruh', 'Filyos'], answer: 0 },
  ],
  'bafa-ramsar': [
    { q: 'Bafa Gölü Ramsar alanı hangi ildedir?', options: ['Muğla', 'Aydın', 'İzmir', 'Denizli'], answer: 0 },
    { q: 'Bafa Gölü hangi nehrin deltasının kuzeyindedir?', options: ['Büyük Menderes', 'Küçük Menderes', 'Gediz', 'Aksu'], answer: 0 },
  ],
  'nemrut-ramsar': [
    { q: 'Nemrut Kalderası hangi ildedir?', options: ['Bitlis', 'Adıyaman', 'Van', 'Ağrı'], answer: 0 },
  ],
  'kackar-park': [
    { q: 'Kaçkar Dağları Milli Parkı hangi illeri kapsar?', options: ['Rize-Artvin', 'Trabzon-Giresun', 'Ordu-Samsun', 'Bayburt-Erzincan'], answer: 0 },
  ],
  'yedigoller': [
    { q: 'Yedigöller Milli Parkı hangi ildedir?', options: ['Bolu', 'Düzce', 'Zonguldak', 'Bursa'], answer: 0 },
    { q: 'Yedigöller Milli Parkı hangi oluşumlarla bilinir?', options: ['Karstik göller', 'Volkanik kraterler', 'Buzul cirkleri', 'Kıyı setleri'], answer: 0 },
  ],
  'uludag-park': [
    { q: 'Uludağ Milli Parkı hangi ildedir?', options: ['Bursa', 'Bilecik', 'Kütahya', 'Eskişehir'], answer: 0 },
    { q: 'Uludağ hangi kış turizmiyle bilinir?', options: ['Kayak', 'Yüzme', 'Yelken', 'Rafting'], answer: 0 },
  ],
  'soguksu': [
    { q: 'Soğuksu Milli Parkı hangi ildedir?', options: ['Ankara', 'Kırıkkale', 'Çankırı', 'Bolu'], answer: 0 },
    { q: 'Soğuksu Milli Parkı hangi şehir çevresindedir?', options: ['Ankara', 'İstanbul', 'İzmir', 'Antalya'], answer: 0 },
  ],
  munzur: [
    { q: 'Munzur Vadisi Milli Parkı hangi ildedir?', options: ['Tunceli', 'Erzincan', 'Elazığ', 'Bingöl'], answer: 0 },
  ],
  kuyucak: [
    { q: 'Kuyucak Gölü hangi iller sınırındadır?', options: ['Kars-Ağrı', 'Erzurum-Kars', 'Van-Bitlis', 'Iğdır-Ardahan'], answer: 0 },
    { q: 'Kuyucak Gölü hangi listede yer alır?', options: ['Ramsar', 'Milli park', 'Tabiat anıtı', 'Gen koruma alanı'], answer: 0 },
  ],
  'kazdagi-park': [
    { q: 'Kazdağı Milli Parkı hangi dağların güneyindedir?', options: ['Kaz Dağları', 'Bozdağlar', 'Menteşe', 'Amanos'], answer: 0 },
  ],
  bor: [
    { q: 'Bor hangi illerde çıkarılır?', options: ['Kütahya-Eskişehir-Balıkesir', 'Zonguldak-Bartın', 'Hatay-Kilis', 'Mardin-Şırnak'], answer: 0 },
    { q: 'Bor hangi sanayinin hammaddesidir?', options: ['Cam ve deterjan', 'Petrol rafinerisi', 'Alüminyum', 'Çelik'], answer: 0 },
  ],
  altin: [
    { q: 'Altın yatakları hangi bölgede öne çıkar?', options: ['Batı Anadolu', 'Doğu Anadolu', 'Güneydoğu', 'Karadeniz'], answer: 0 },
  ],
  trona: [
    { q: 'Trona hangi illerde çıkarılır?', options: ['Ankara-Kırıkkale', 'Konya-Karaman', 'Burdur-Isparta', 'Muğla-Aydın'], answer: 0 },
  ],
  boksit: [
    { q: 'Boksit hangi metalin hammaddesidir?', options: ['Alüminyum', 'Demir', 'Bakır', 'Krom'], answer: 0 },
    { q: 'Alüminyum tesisi hangi ilde bulunur?', options: ['Konya (Seydişehir)', 'Zonguldak', 'Batman', 'Trabzon'], answer: 0 },
  ],
  dogalgaz: [
    { q: 'Türkiye’de doğalgaz üretiminin merkezi hangi çevredir?', options: ['Marmara Ereğlisi', 'Batman', 'Zonguldak', 'Mersin'], answer: 0 },
  ],
  demir: [
    { q: 'Divriği demir yatakları hangi ildedir?', options: ['Sivas', 'Malatya', 'Erzincan', 'Kahramanmaraş'], answer: 0 },
    { q: 'Hekimhan demir yatakları hangi ildedir?', options: ['Malatya', 'Sivas', 'Elazığ', 'Tunceli'], answer: 0 },
  ],
  linyit: [
    { q: 'Afşin-Elbistan linyit havzası hangi ildedir?', options: ['Kahramanmaraş', 'Adana', 'Hatay', 'Gaziantep'], answer: 0 },
    { q: 'Soma linyit havzası hangi ildedir?', options: ['Manisa', 'Kütahya', 'Uşak', 'Afyon'], answer: 0 },
    { q: 'Linyit hangi enerji türünde kullanılır?', options: ['Termik santral', 'Nükleer', 'Jeotermal', 'Hidroelektrik'], answer: 0 },
  ],
  krom: [
    { q: 'Krom hangi illerde çıkarılır?', options: ['Muğla-Bursa-Eskişehir', 'Zonguldak-Sinop', 'Şanlıurfa-Diyarbakır', 'Erzurum-Kars'], answer: 0 },
  ],
  nikel: [
    { q: 'Nikel yatakları hangi illerde bulunur?', options: ['Manisa-Balıkesir', 'Trabzon-Rize', 'Adana-Mersin', 'Kars-Ardahan'], answer: 0 },
  ],
  manganez: [
    { q: 'Manganez hangi illerde çıkarılır?', options: ['Bolu-Sivas', 'Zonguldak-Bartın', 'Mersin-Adana', 'Kütahya-Eskişehir'], answer: 0 },
  ],
  sulfur: [
    { q: 'Kükürt yatakları hangi bölgede yoğundur?', options: ['Doğu Anadolu', 'Ege', 'Marmara', 'Akdeniz'], answer: 0 },
  ],
  'kumlu-step': [
    { q: 'Kumlu step toprakları hangi bölgede yaygındır?', options: ['Kapadokya-İç Anadolu', 'Karadeniz', 'Ege kıyıları', 'Akdeniz'], answer: 0 },
  ],
  'orman-toprak': [
    { q: 'Kahverengi orman toprakları hangi bölgede yaygındır?', options: ['Karadeniz', 'Akdeniz', 'İç Anadolu', 'Güneydoğu'], answer: 0 },
  ],
  'bafra-aluv': [
    { q: 'Bafra deltası alüvyonları hangi akarsuyla ilişkilidir?', options: ['Kızılırmak', 'Yeşilırmak', 'Çoruh', 'Filyos'], answer: 0 },
  ],
  'cukurova-aluv': [
    { q: 'Çukurova alüvyonları hangi illeri kapsar?', options: ['Adana-Mersin-Osmaniye', 'Hatay-Kilis', 'Antalya-Muğla', 'Konya-Karaman'], answer: 0 },
  ],
  'ergene-aluv': [
    { q: 'Ergene ovası alüvyonları hangi bölgededir?', options: ['Trakya', 'Doğu Anadolu', 'Karadeniz', 'Akdeniz'], answer: 0 },
  ],
  podzol: [
    { q: 'Podzol toprakları hangi iklim koşullarında oluşur?', options: ['Nemli ve serin', 'Kurak ve sıcak', 'Yarı kurak', 'Akdeniz'], answer: 0 },
  ],
  uludag: [
    { q: 'Uludağ hangi ildedir?', options: ['Bursa', 'Bilecik', 'Kütahya', 'Eskişehir'], answer: 0 },
    { q: 'Uludağ hangi oluşum tipindedir?', options: ['Kıvrım', 'Kırık (horst)', 'Volkanik', 'Buzul'], answer: 1 },
  ],
  'murat-daglari': [
    { q: 'Murat Dağları hangi illerde yer alır?', options: ['Elazığ-Bingöl-Tunceli', 'Malatya-Sivas', 'Erzincan-Erzurum', 'Van-Muş'], answer: 0 },
  ],
  binboga: [
    { q: 'Binboğa Dağları hangi ildedir?', options: ['Kahramanmaraş', 'Adana', 'Mersin', 'Gaziantep'], answer: 0 },
  ],
  ilgaz: [
    { q: 'Ilgaz Dağları hangi illerde uzanır?', options: ['Kastamonu-Çankırı', 'Sinop-Kastamonu', 'Kırıkkale-Kırşehir', 'Amasya-Tokat'], answer: 0 },
  ],
  'susuz-daglari': [
    { q: 'Susuz Dağları hangi illerde yer alır?', options: ['Erzincan-Erzurum', 'Erzurum-Kars', 'Bingöl-Tunceli', 'Van-Muş'], answer: 0 },
  ],
  abant: [
    { q: 'Abant Gölü hangi ildedir?', options: ['Bolu', 'Düzce', 'Zonguldak', 'Bursa'], answer: 0 },
    { q: 'Abant Gölü hangi oluşum tipindedir?', options: ['Tektonik', 'Karstik', 'Volkanik', 'Kıyı seti'], answer: 0 },
  ],
  narligol: [
    { q: 'Narlıgöl hangi oluşum tipindedir?', options: ['Karstik', 'Tektonik', 'Volkanik', 'Buzul'], answer: 0 },
  ],
  'kucuk-cekmece': [
    { q: 'Küçükçekmece Gölü hangi oluşum tipindedir?', options: ['Kıyı set gölü', 'Tektonik', 'Karstik', 'Volkanik'], answer: 0 },
  ],
  'buyuk-cekmece': [
    { q: 'Büyükçekmece Gölü hangi oluşum tipindedir?', options: ['Kıyı set gölü', 'Tektonik', 'Karstik', 'Buzul'], answer: 0 },
  ],
  filyos: [
    { q: 'Filyos Nehri hangi bölgenin akarsusudur?', options: ['Karadeniz', 'Akdeniz', 'Ege', 'Marmara'], answer: 0 },
    { q: 'Filyos hangi illerden geçer?', options: ['Zonguldak-Bartın', 'Sinop-Kastamonu', 'Ordu-Giresun', 'Trabzon-Rize'], answer: 0 },
  ],
  goksu: [
    { q: 'Göksu Nehri hangi nehre karışır?', options: ['Seyhan', 'Ceyhan', 'Manavgat', 'Asi'], answer: 0 },
    { q: 'Göksu vadisi hangi ilde milli parktır?', options: ['Mersin', 'Adana', 'Antalya', 'Hatay'], answer: 0 },
  ],
  zap: [
    { q: 'Zap Suyu hangi nehrin koludur?', options: ['Dicle', 'Fırat', 'Seyhan', 'Yeşilırmak'], answer: 0 },
    { q: 'Zap Suyu hangi ülkeye de uzanır?', options: ['Irak', 'Suriye', 'İran', 'Yunanistan'], answer: 0 },
  ],
  tunca: [
    { q: 'Tunca Çayı hangi nehrin koludur?', options: ['Çoruh', 'Fırat', 'Kızılırmak', 'Yeşilırmak'], answer: 0 },
  ],
  gokirmak: [
    { q: 'Gökırmak Nehri hangi nehrin koludur?', options: ['Kızılırmak', 'Yeşilırmak', 'Sakarya', 'Filyos'], answer: 0 },
    { q: 'Gökırmak hangi illerden geçer?', options: ['Kastamonu-Çankırı', 'Sinop-Kastamonu', 'Kırıkkale-Kırşehir', 'Çorum-Amasya'], answer: 0 },
  ],
  delice: [
    { q: 'Delice Nehri hangi nehrin koludur?', options: ['Kızılırmak', 'Yeşilırmak', 'Sakarya', 'Filyos'], answer: 0 },
    { q: 'Delice hangi havzaya ulaşır?', options: ['Kapalı havza (Tuz Gölü)', 'Karadeniz', 'Akdeniz', 'Ege'], answer: 0 },
  ],
  'gediz-graben': [
    { q: 'Gediz grabeni hangi nehrin yerleştiği çöküntüdür?', options: ['Gediz', 'Küçük Menderes', 'Büyük Menderes', 'Aksu'], answer: 0 },
    { q: 'Gediz grabeni hangi bölgede bulunur?', options: ['Ege', 'Akdeniz', 'Karadeniz', 'Marmara'], answer: 0 },
  ],
  'menderes-graben': [
    { q: 'Büyük Menderes grabeni hangi akarsuyla ilişkilidir?', options: ['Büyük Menderes', 'Gediz', 'Küçük Menderes', 'Meriç'], answer: 0 },
  ],
  'marmara-graben': [
    { q: 'Marmara grabeni hangi fay sistemiyle ilişkilidir?', options: ['Kuzey Anadolu Fay Hattı', 'Doğu Anadolu Fay Hattı', 'Ege fayları', 'Zigana fayları'], answer: 0 },
    { q: 'Marmara grabeni hangi denizin altındadır?', options: ['Marmara', 'Ege', 'Karadeniz', 'Akdeniz'], answer: 0 },
  ],
  rendzina: [
    { q: 'Rendzina toprakları hangi bölgede yaygındır?', options: ['Akdeniz karstik arazileri', 'Karadeniz ormanları', 'İç Anadolu stepleri', 'Güneydoğu ovaları'], answer: 0 },
  ],
  organik: [
    { q: 'Organik (bataklık) toprakları hangi bölgede oluşur?', options: ['Karadeniz kıyı sulak alanları', 'İç Anadolu platoları', 'Güneydoğu ovaları', 'Ege kıyı setleri'], answer: 0 },
  ],
  talk: [
    { q: 'Talk hangi illerde çıkarılır?', options: ['Kütahya-Eskişehir', 'Zonguldak-Bartın', 'Hatay-Kilis', 'Mardin-Şırnak'], answer: 0 },
  ],
  mermer: [
    { q: 'Türkiye’nin en zengin mermer yatakları hangi illerdedir?', options: ['Afyonkarahisar-Burdur-Muğla', 'Sivas-Erzincan', 'Adana-Mersin', 'Van-Hakkari'], answer: 0 },
  ],
  pomza: [
    { q: 'Pomza hangi oluşumla ilişkilidir?', options: ['Volkanik kül', 'Kalker erimesi', 'Buzul aşındırması', 'Deniz birikimi'], answer: 0 },
  ],
  perlit: [
    { q: 'Perlit yatakları hangi illerde bulunur?', options: ['Manisa-Kütahya-Balıkesir', 'Trabzon-Rize', 'Konya-Karaman', 'Şanlıurfa-Mardin'], answer: 0 },
  ],
  manyezit: [
    { q: 'Manyezit hangi illerde çıkarılır?', options: ['Kütahya-Eskişehir', 'Zonguldak-Sinop', 'Antalya-Muğla', 'Erzurum-Kars'], answer: 0 },
  ],
  dap: [
    { q: 'DAP hangi bölgeyi kapsar?', options: ['Doğu Anadolu', 'Güneydoğu Anadolu', 'İç Anadolu', 'Karadeniz'], answer: 0 },
    { q: 'Türkiye’nin iki büyük bölgesel projesi hangileridir?', options: ['GAP ve DAP', 'GAP ve KOP', 'DAP ve KOP', 'GAP ve YHDP'], answer: 0 },
  ],
  kop: [
    { q: 'KOP hangi havzayı hedefler?', options: ['Konya kapalı havzası', 'Fırat havzası', 'Dicle havzası', 'Yeşilırmak havzası'], answer: 0 },
  ],
  oymapinar: [
    { q: 'Oymapınar Barajı hangi nehir üzerindedir?', options: ['Manavgat', 'Aksu', 'Ceyhan', 'Seyhan'], answer: 0 },
    { q: 'Oymapınar Barajı hangi ildedir?', options: ['Antalya', 'Mersin', 'Isparta', 'Burdur'], answer: 0 },
  ],
  altinkaya: [
    { q: 'Altınkaya Barajı hangi nehir üzerindedir?', options: ['Kızılırmak', 'Yeşilırmak', 'Sakarya', 'Filyos'], answer: 0 },
  ],
  'hasan-ugurlu': [
    { q: 'Hasan Uğurlu Barajı hangi nehir üzerindedir?', options: ['Yeşilırmak', 'Kızılırmak', 'Çoruh', 'Sakarya'], answer: 0 },
  ],
  koprulu: [
    { q: 'Köprülü Kanyon Milli Parkı hangi nehir vadisindedir?', options: ['Manavgat', 'Aksu', 'Alara', 'Duden'], answer: 0 },
    { q: 'Köprülü Kanyon hangi ildedir?', options: ['Antalya', 'Mersin', 'Isparta', 'Burdur'], answer: 0 },
  ],
  dilek: [
    { q: 'Dilek Yarımadası Milli Parkı hangi illeri kapsar?', options: ['İzmir-Aydın', 'Muğla-Aydın', 'Balıkesir-Çanakkale', 'İstanbul-Kocaeli'], answer: 0 },
  ],
  dalyan: [
    { q: 'Dalyan Ramsar alanı hangi ildedir?', options: ['Muğla', 'Antalya', 'Mersin', 'İzmir'], answer: 0 },
    { q: 'İztuzu Kumsalı hangi canlıyla ünlüdür?', options: ['Deniz kaplumbağası', 'Akdeniz foku', 'Yunus', 'Fok'], answer: 0 },
  ],
  menemen: [
    { q: 'Menemen Ovası hangi nehrin deltasının kuzeyindedir?', options: ['Gediz', 'Büyük Menderes', 'Küçük Menderes', 'Aksu'], answer: 0 },
  ],
  silifke: [
    { q: 'Silifke Ovası hangi nehrin deltasının kuzeyindedir?', options: ['Göksu', 'Seyhan', 'Ceyhan', 'Manavgat'], answer: 0 },
  ],
  'ataturk-bara': [
    { q: 'Atatürk Barajı hangi nehir üzerindedir?', options: ['Fırat', 'Dicle', 'Seyhan', 'Ceyhan'], answer: 0 },
    { q: 'Atatürk Barajı hangi projeye dahildir?', options: ['GAP', 'DAP', 'KOP', 'YHDP'], answer: 0 },
  ],
  keban: [
    { q: 'Keban Barajı hangi nehir üzerindedir?', options: ['Fırat', 'Dicle', 'Seyhan', 'Çoruh'], answer: 0 },
    { q: 'Keban Barajı hangi ildedir?', options: ['Elazığ', 'Malatya', 'Adıyaman', 'Şanlıurfa'], answer: 0 },
  ],
  deriner: [
    { q: 'Deriner Barajı hangi nehir üzerindedir?', options: ['Çoruh', 'Fırat', 'Kızılırmak', 'Yeşilırmak'], answer: 0 },
    { q: 'Deriner Barajı hangi illerde yer alır?', options: ['Artvin-Rize', 'Erzurum-Ağrı', 'Trabzon-Giresun', 'Ordu-Giresun'], answer: 0 },
  ],
  ilisu: [
    { q: 'Ilısu Barajı hangi nehir üzerindedir?', options: ['Dicle', 'Fırat', 'Seyhan', 'Ceyhan'], answer: 0 },
    { q: 'Ilısu Barajı hangi illeri kapsar?', options: ['Şırnak-Mardin', 'Şanlıurfa-Adıyaman', 'Batman-Siirt', 'Diyarbakır-Mardin'], answer: 0 },
  ],
  civa: [
    { q: 'Civa madeni hangi çevrede çıkarılır?', options: ['Simav (Balıkesir)', 'Zonguldak', 'Mardin', 'Erzurum'], answer: 0 },
    { q: 'Civa hangi oluşumla ilişkilendirilir?', options: ['Volkanik ve hidrotermal sahalar', 'Buzul birikimi', 'Delta çökelleri', 'Kıyı setleri'], answer: 0 },
  ],
  gumus: [
    { q: 'Gümüş madeni hangi illerimizde çıkarılır?', options: ['Gümüşhane', 'Zonguldak', 'Antalya', 'İzmir'], answer: 0 },
    { q: 'Gümüşhane ili adını hangi madenden almıştır?', options: ['Gümüş', 'Altın', 'Bakır', 'Krom'], answer: 0 },
  ],
  kayatuzu: [
    { q: 'Kaya tuzu hangi illerimizde çıkarılır?', options: ['İzmir-Çankırı', 'Samsun-Ordu', 'Bursa-Kocaeli', 'Adana-Mersin'], answer: 0 },
    { q: 'Çamaltı tuzla gölleri hangi ildedir?', options: ['İzmir', 'Aydın', 'Muğla', 'Manisa'], answer: 0 },
  ],
  'karst-kiyi': [
    { q: 'Karstik kıyıların oluşumunda hangi süreç etkilidir?', options: ['Kireçtaşı erozyonu', 'Buzul aşındırması', 'Volkanik patlama', 'Rüzgâr birikimi'], answer: 0 },
    { q: 'Karstik kıyıların tipik örnekleri hangi bölgededir?', options: ['Akdeniz (Teke Yarımadası)', 'Karadeniz', 'Marmara', 'İç Anadolu'], answer: 0 },
  ],
  tombolo: [
    { q: 'Tombolo (bağlama kumsalı) hangi oluşumla meydana gelir?', options: ['Kıyı setinin adayı anakaraya bağlaması', 'Nehir deltasının ilerlemesi', 'Buzul vadisinin derinleşmesi', 'Fay bloklarının kayması'], answer: 0 },
    { q: 'Salih Adası tombolo örneği hangi ildedir?', options: ['Muğla', 'Antalya', 'İzmir', 'Çanakkale'], answer: 0 },
  ],
  'kiyi-ovasi': [
    { q: 'Kıyı ovaları nasıl oluşur?', options: ['Akarsuların kıyıya paralel biriktirmesiyle', 'Volkanik lavların soğumasıyla', 'Buzulların erimesiyle', 'Fay kırılmasıyla'], answer: 0 },
    { q: 'Menemen Ovası kıyı ovasına örnek hangi ildedir?', options: ['İzmir', 'Adana', 'Samsun', 'Trabzon'], answer: 0 },
  ],
  'falez-kiyi': [
    { q: 'Falezli kayalık kıyıların yaygın olduğu bölge hangisidir?', options: ['Karadeniz', 'Ege', 'Akdeniz', 'Marmara'], answer: 0 },
    { q: 'Falezlerin oluşumunda hangi etken rol oynar?', options: ['Dalgaların kıyı kayalarını aşındırması', 'Akarsu birikimi', 'Rüzgâr erozyonu', 'Buzul sürüklenmesi'], answer: 0 },
  ],
};

/**
 * Neden-sonuç formatındaki sorular — her MapItem için ek derinlik sağlar.
 */
export const ITEM_CAUSE: Record<string, McqQuestion[]> = {
  agri: [
    { q: 'Doğu Anadolu volkanlarının oluşumunun temel nedeni nedir?', options: ['Levha çarpışması ve kabuk kırılması', 'Buzul erimesi', 'Deniz seviyesi yükselmesi', 'Rüzgâr aşındırması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  erciyes: [
    { q: 'Erciyes’in volkanik bir dağ olmasının nedeni nedir?', options: ['Volkanik faaliyetler (iç kuvvetler)', 'Kıvrılma ile yükselme', 'Buzul çökelmesi', 'Kıyı erozyonu'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'karacadağ-se': [
    { q: 'Karacadağ’ın kalkan volkan şeklinde oluşmasının nedeni nedir?', options: ['Akıcı bazalt lavlarının geniş alana yayılması', 'Kalker erimesi', 'Heyelan birikimi', 'Rüzgâr taşıması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'tuz-golu': [
    { q: 'Tuz Gölü’nün tuzlanmasının temel nedeni nedir?', options: ['Kapalı havzada buharlaşmanın yağışı aşması', 'Deniz suyu karışması', 'Volkanik kül düşmesi', 'Buzul erimesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  van: [
    { q: 'Van Gölü’nün sodalı ve tuzlu olmasının nedeni nedir?', options: ['Kapalı havzada yoğun buharlaşma', 'Deniz suyunun karışması', 'Yağmur suyunun tuzlu olması', 'Buzul suyu beslemesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  iznik: [
    { q: 'İznik Gölü’nün tektonik kökenli olmasının nedeni nedir?', options: ['Fay hareketleriyle oluşan çukurun suyla dolması', 'Akarsu deltası birikimi', 'Volkanik krater oluşumu', 'Heyelan seti'], answer: 0, tag: 'Neden-sonuç' },
  ],
  sapanca: [
    { q: 'Sapanca Gölü’nün oluşumunun nedeni nedir?', options: ['Tektonik çöküntüde su birikmesi', 'Kıyı setinin kapanması', 'Karstik erime', 'Volkanik set'], answer: 0, tag: 'Neden-sonuç' },
  ],
  tortum: [
    { q: 'Tortum Gölü’nün oluşumunun nedeni nedir?', options: ['Heyelan kütlesinin vadiyi kapatması', 'Tektonik çukur', 'Volkanik krater', 'Buzul erimesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  cildir: [
    { q: 'Çıldır Gölü’nün setli oluşumunun nedeni nedir?', options: ['Volkanik lav akıntılarının çukuru kapatması', 'Akarsu deltası', 'Kıyı kumulu', 'Buzul moreni'], answer: 0, tag: 'Neden-sonuç' },
  ],
  kaf: [
    { q: 'Kuzey Anadolu Fay Hattı’nın oluşumunun nedeni nedir?', options: ['Levha hareketlerinin yol açtığı yatay kayma', 'Buzul aşındırması', 'Volkanik patlama', 'Kıyı birikimi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  daf: [
    { q: 'Doğu Anadolu Fay Hattı’nın sol yanal atımlı olmasının nedeni nedir?', options: ['Arap ve Anadolu levhalarının göreli hareketi', 'Buzul erimesi', 'Deniz yükselmesi', 'Rüzgâr erozyonu'], answer: 0, tag: 'Neden-sonuç' },
  ],
  baf: [
    { q: 'Batı Anadolu’daki horst-graben sisteminin oluşum nedeni nedir?', options: ['Kabuk incelmesi ve çekme (gerilim) kuvvetleri', 'Kıvrılma kuvvetleri', 'Buzul basıncı', 'Volkanik patlama'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'marmara-graben': [
    { q: 'Marmara grabeninin oluşumunun nedeni nedir?', options: ['KAF’in batı ucundaki çekme kuvvetleri', 'Kıvrılma', 'Volkanizma', 'Buzul erimesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  toroslar: [
    { q: 'Toroslar’ın kıvrım dağları olarak oluşmasının nedeni nedir?', options: ['Levha çarpışmasıyla kabuğun sıkışması', 'Volkanik lav birikimi', 'Buzul aşındırması', 'Rüzgâr taşıması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'boyuna-karadeniz': [
    { q: 'Karadeniz kıyılarının boyuna tipte olmasının nedeni nedir?', options: ['Kıyı dağlarının kıyıya paralel uzanması', 'Akarsuların delta oluşturması', 'Kıyı setlerinin oluşması', 'Rüzgârın kıyıyı düzlemesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'enine-ege': [
    { q: 'Ege kıyılarının girintili çıkıntılı olmasının nedeni nedir?', options: ['Dağların kıyıya dik uzanması ve kıta sahanlığının genişliği', 'Boyuna dağ sıraları', 'Volkanik setler', 'Buzul kalıntıları'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'ria-mugla': [
    { q: 'Ria kıyıların oluşumunun nedeni nedir?', options: ['Akarsu vadilerinin deniz seviyesine göre sular altında kalması', 'Lav akıntılarının denize ulaşması', 'Kıyı kumullarının birikmesi', 'Buzul erimesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'dalmatic-kas': [
    { q: 'Dalmaçya kıyıların oluşumunun nedeni nedir?', options: ['Kıyıya paralel dağların kısmen sular altında kalması', 'Akarsu deltaları', 'Kıyı setleri', 'Buzul morenleri'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'terkos-lagoon': [
    { q: 'Kıyı set göllerinin oluşumunun nedeni nedir?', options: ['Kıyı setinin gerisinde suyun birikmesi', 'Tektonik çöküntü', 'Volkanik krater', 'Karstik erime'], answer: 0, tag: 'Neden-sonuç' },
  ],
  bafk: [
    { q: 'Bafra-Çarşamba deltalarının oluşumunun nedeni nedir?', options: ['Akarsuların taşıdığı alüvyonların birikmesi', 'Tektonik çöküntü', 'Volkanik set', 'Buzul erimesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'zonguldak-komur': [
    { q: 'Taşkömürünün Zonguldak çevresinde bulunmasının nedeni nedir?', options: ['Tersiyer dönemindeki gür ormanların kömürleşmesi', 'Volkanik kül birikimi', 'Buzul taşıması', 'Deniz tuzu çökelmesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'ege-jeotermal': [
    { q: 'Ege Bölgesi’nde jeotermal enerjinin bol olmasının nedeni nedir?', options: ['Faylı yapı ve genç volkanik ısı kaynakları', 'Kıvrım dağları', 'Buzullar', 'Delta ovaları'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'konya-kapali': [
    { q: 'Konya havzasının kapalı havza olmasının nedeni nedir?', options: ['Çevresinin dağlarla çevrili olması', 'Denize uzak olması', 'Yüksek rakım', 'Volkanik setler'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'ic-anadolu-steppe': [
    { q: 'İç Anadolu’da bozkır bitki örtüsünün yaygın olmasının nedeni nedir?', options: ['Az yağışlı karasal iklim', 'Bol yağışlı nemli iklim', 'Kıyıya yakınlık', 'Yüksek nem'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'akdeniz-toprak': [
    { q: 'Terra rossa topraklarının Akdeniz’de yaygın olmasının nedeni nedir?', options: ['Kireçli ana materyal ve sıcak kurak yaz iklimi', 'Bol yağış', 'Buzul erimesi', 'Volkanik kül'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'karadeniz-forest': [
    { q: 'Karadeniz ormanlarının gür olmasının nedeni nedir?', options: ['Yıl boyu nemli ve bol yağışlı iklim', 'Kurak yazlar', 'Kireçli kayaçlar', 'Yüksek rakım'], answer: 0, tag: 'Neden-sonuç' },
  ],
  bor: [
    { q: 'Bor yataklarının Ege’de yoğunlaşmasının nedeni nedir?', options: ['Volkanik ve çökel kayaçlarla ilişkili oluşumlar', 'Buzul erimesi', 'Deniz tuzu', 'Rüzgâr birikimi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  linyit: [
    { q: 'Linyitin Türkiye’de yaygın olmasının nedeni nedir?', options: ['Tersiyer dönemindeki göl ve bataklık çökelmeleri', 'Paleozoik kütleler', 'Buzul morenleri', 'Deniz resifleri'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'batman-petrol': [
    { q: 'Petrol yataklarının Güneydoğu Anadolu’da bulunmasının nedeni nedir?', options: ['Antik deniz çökellerindeki petrol kapanları', 'Volkanik faaliyet', 'Buzul erimesi', 'Kıyı birikimi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  sulfur: [
    { q: 'Kükürt yataklarının Doğu Anadolu’da yoğunlaşmasının nedeni nedir?', options: ['Volkanik kökenli oluşumlar', 'Kalker erimesi', 'Buzul çökelmesi', 'Deniz tuzu'], answer: 0, tag: 'Neden-sonuç' },
  ],
  pomza: [
    { q: 'Pomzanın Kapadokya çevresinde bol olmasının nedeni nedir?', options: ['Volkanik kül akıntılarının soğuyup hafifleşmesi', 'Kalker erimesi', 'Buzul taşıması', 'Deniz birikimi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'uludag': [
    { q: 'Uludağ’ın horst (yükselen blok) olmasının nedeni nedir?', options: ['Batı Anadolu’daki gerilim kuvvetleriyle blok yükselmesi', 'Kıvrılma', 'Volkanik patlama', 'Buzul birikimi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'menderes-graben': [
    { q: 'Büyük Menderes grabeninin oluşumunun nedeni nedir?', options: ['Kabuk incelmesi ve çekme kuvvetleri', 'Kıvrılma kuvvetleri', 'Buzul basıncı', 'Volkanik patlama'], answer: 0, tag: 'Neden-sonuç' },
  ],
  ergene: [
    { q: 'Ergene Ovası’nın delta ovası olmasının nedeni nedir?', options: ['Ergene’nin taşıdığı alüvyonların birikmesi', 'Tektonik çöküntü', 'Volkanik set', 'Buzul erimesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'koprulu': [
    { q: 'Köprülü Kanyon’un derinleşmesinin nedeni nedir?', options: ['Manavgat’ın karstik aşındırması', 'Buzul aşındırması', 'Volkanik patlama', 'Heyelan'], answer: 0, tag: 'Neden-sonuç' },
  ],
  munzur: [
    { q: 'Munzur Vadisi’nin Türkiye’nin en derin vadilerinden olmasının nedeni nedir?', options: ['Munzur Dağları’nın hızla yükselmesi ve akarsuların aşındırması', 'Buzul erimesi', 'Kıyı erozyonu', 'Rüzgâr aşındırması'], answer: 0, tag: 'Neden-sonuç' },
  ],
};

const PROVINCE_NAMES = PROVINCE_ROWS.map((row) => row.il_adi);

/**
 * Elle yazılmış soru yoksa öğe için deterministik il sorusu üretir.
 * Çeldiriciler, öğenin provinces listesinde OLMAYAN illerden seçilir —
 * çok illi öğelerde (GAP, TANAP vb.) yanlış pozitif şık oluşmaz.
 */
function generatedProvinceMcq(item: Pick<MapItem, 'id' | 'name' | 'provinces'>): McqQuestion | null {
  const correct = item.provinces?.[0];
  if (!correct) return null;
  const excluded = new Set(item.provinces ?? []);
  const hash = [...item.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const distractors: string[] = [];
  for (let step = 0; distractors.length < 3; step += 1) {
    const candidate = PROVINCE_NAMES[(hash + step * 11) % PROVINCE_NAMES.length];
    if (!excluded.has(candidate) && !distractors.includes(candidate)) distractors.push(candidate);
  }
  if (distractors.length < 3) return null;
  const slot = hash % 4;
  return {
    q: `${item.name} hangi ildedir?`,
    options: withAnswer(distractors, slot, correct),
    answer: slot,
  };
}

export function itemMcqs(item: Pick<MapItem, 'id' | 'name' | 'provinces'>): McqQuestion[] {
  const authored = [...(ITEM_MCQ[item.id] ?? []), ...(ITEM_CAUSE[item.id] ?? [])];
  if (authored.length > 0) return authored;
  const generated = generatedProvinceMcq(item);
  return generated ? [generated] : [];
}
