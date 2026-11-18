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
    { q: 'Palandöken Dağları hangi oluşum tipindedir?', options: ['Kıvrım', 'Kırık (horst)', 'Volkanik', 'Buzul'], answer: 0 },
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
    { q: 'Manyas Gölü hangi adla da bilinir?', options: ['Kuş Gölü', 'Uluabat', 'Sapanca', 'Terkos'], answer: 0 },
  ],
  eber: [
    { q: 'Eber Gölü hangi ilimizde yer alır?', options: ['Afyonkarahisar', 'Isparta', 'Burdur', 'Denizli'], answer: 0 },
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
    { q: 'Amik Ovası hangi nehir tarafından sulanır?', options: ['Asi (Orontes)', 'Fırat', 'Ceyhan', 'Seyhan'], answer: 0 },
    { q: 'Amik Ovası hangi ilde yer alan tektonik (graben) ovadır?', options: ['Hatay', 'Adana', 'Mersin', 'Antalya'], answer: 0 },
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
    { q: 'Çoruh Nehri hangi ülke topraklarından Karadeniz’e dökülür?', options: ['Gürcistan (Batum)', 'Rusya', 'Bulgaristan', 'İran'], answer: 0 },
    { q: 'Çoruh üzerinde hangi barajlar bulunmaktadır?', options: ['Yusufeli ve Deriner', 'Atatürk ve Keban', 'Ilısu ve Kralkızı', 'Oymapınar ve Manavgat'], answer: 0 },
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
    { q: 'Kuşadası Körfezi hangi kıyı tipindedir?', options: ['Enine kıyı', 'Boyuna kıyı', 'Dalmaçya kıyı', 'Haliçli kıyı'], answer: 0 },
    { q: 'Kuşadası Körfezi hangi ilimizdedir?', options: ['Aydın', 'Muğla', 'Antalya', 'Çanakkale'], answer: 0 },
  ],
  'gokova-ria': [
    { q: 'Gökova Körfezi hangi ilde yer alır?', options: ['Muğla', 'Aydın', 'İzmir', 'Antalya'], answer: 0 },
    { q: 'Gökova Körfezi hangi kıyı tipinin en tipik örneğidir?', options: ['Ria', 'Boyuna', 'Enine', 'Kıyı seti'], answer: 0 },
  ],
  'amik-delta': [
    { q: 'Samandağ kıyı deltası hangi nehrin Akdeniz’e ulaştığı yerdedir?', options: ['Asi (Orontes)', 'Fırat', 'Ceyhan', 'Seyhan'], answer: 0 },
    { q: 'Samandağ deltası hangi ildedir?', options: ['Hatay', 'Adana', 'Mersin', 'Osmaniye'], answer: 0 },
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
    { q: 'Yedigöller Milli Parkı hangi göl oluşumlarıyla bilinir?', options: ['Heyelan set gölleri', 'Karstik göller', 'Volkanik kraterler', 'Kıyı setleri'], answer: 0 },
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
    { q: 'Manganez yatakları aşağıdaki illerden hangilerinde çıkarılır?', options: ['Adana-Denizli-Karabük', 'Zonguldak-Bartın', 'Edirne-Tekirdağ', 'Rize-Trabzon'], answer: 0 },
  ],
  sulfur: [
    { q: 'Türkiye’de Keçiborlu kükürt yatakları hangi ilimizde yer alır?', options: ['Isparta', 'Edirne', 'Sinop', 'Trabzon'], answer: 0 },
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
    { q: 'Uludağ hangi oluşum tipindedir?', options: ['İç püskürük (batolit)', 'Kırık (horst)', 'Kıvrım', 'Kaldera'], answer: 0 },
  ],
  'murat-daglari': [
    { q: 'Gediz ve Büyük Menderes kollarının doğduğu Murat Dağı hangi iller arasındadır?', options: ['Kütahya-Uşak', 'Elazığ-Bingöl', 'Malatya-Sivas', 'Van-Muş'], answer: 0 },
  ],
  binboga: [
    { q: 'Binboğa Dağları hangi iller arasında uzanır?', options: ['Kahramanmaraş-Kayseri', 'Adana-Mersin', 'Hatay-Kilis', 'Gaziantep-Şanlıurfa'], answer: 0 },
  ],
  ilgaz: [
    { q: 'Ilgaz Dağları hangi illerde uzanır?', options: ['Kastamonu-Çankırı', 'Sinop-Kastamonu', 'Kırıkkale-Kırşehir', 'Amasya-Tokat'], answer: 0 },
  ],
  'susuz-daglari': [
    { q: 'Susuz Dağları hangi iller çevresinde yer alır?', options: ['Kars-Ardahan', 'Erzincan-Tunceli', 'Bingöl-Muş', 'İzmir-Manisa'], answer: 0 },
  ],
  abant: [
    { q: 'Abant Gölü hangi ildedir?', options: ['Bolu', 'Düzce', 'Zonguldak', 'Bursa'], answer: 0 },
    { q: 'Abant Gölü hangi oluşum tipindedir?', options: ['Heyelan set gölü', 'Tektonik', 'Karstik', 'Kıyı seti'], answer: 0 },
  ],
  narligol: [
    { q: 'Niğde-Aksaray sınırındaki Narlıgöl hangi oluşum tipindedir?', options: ['Volkanik (maar/krater)', 'Karstik', 'Tektonik', 'Buzul'], answer: 0 },
  ],
  'kucuk-cekmece': [
    { q: 'Küçükçekmece Gölü hangi oluşum tipindedir?', options: ['Kıyı set gölü', 'Tektonik', 'Karstik', 'Volkanik'], answer: 0 },
  ],
  'buyuk-cekmece': [
    { q: 'Büyükçekmece Gölü hangi oluşum tipindedir?', options: ['Kıyı set gölü', 'Tektonik', 'Karstik', 'Buzul'], answer: 0 },
  ],
  filyos: [
    { q: 'Filyos (Yenice) Çayı hangi bölgenin akarsuyudur?', options: ['Karadeniz', 'Akdeniz', 'Ege', 'Marmara'], answer: 0 },
    { q: 'Filyos Çayı hangi illerden geçerek Karadeniz’e dökülür?', options: ['Karabük-Bolu-Zonguldak', 'Sinop-Kastamonu', 'Ordu-Giresun', 'Trabzon-Rize'], answer: 0 },
  ],
  goksu: [
    { q: 'Mersin’de Silifke Deltası’nı oluşturarak Akdeniz’e dökülen akarsu hangisidir?', options: ['Göksu', 'Seyhan', 'Ceyhan', 'Asi'], answer: 0 },
    { q: 'Mavi Tünel projesiyle suları Konya Ovası’na aktarılan nehir hangisidir?', options: ['Göksu', 'Manavgat', 'Aksu', 'Dalaman'], answer: 0 },
  ],
  zap: [
    { q: 'Hakkâri’den geçen Zap Suyu hangi nehrin koludur?', options: ['Dicle', 'Fırat', 'Seyhan', 'Yeşilırmak'], answer: 0 },
    { q: 'Zap Suyu hangi ülkeye geçerek Dicle ile birleşir?', options: ['Irak', 'Suriye', 'İran', 'Yunanistan'], answer: 0 },
  ],
  tunca: [
    { q: 'Edirne’den geçen Tunca Nehri hangi akarsuyun koludur?', options: ['Meriç', 'Çoruh', 'Fırat', 'Kızılırmak'], answer: 0 },
  ],
  gokirmak: [
    { q: 'Gökırmak Nehri hangi nehrin koludur?', options: ['Kızılırmak', 'Yeşilırmak', 'Sakarya', 'Filyos'], answer: 0 },
    { q: 'Gökırmak hangi illerden geçerek Kızılırmak’a katılır?', options: ['Kastamonu-Sinop-Samsun', 'Kırıkkale-Kırşehir', 'Çorum-Amasya', 'Bolu-Düzce'], answer: 0 },
  ],
  delice: [
    { q: 'Delice Irmağı hangi nehrin koludur?', options: ['Kızılırmak', 'Yeşilırmak', 'Sakarya', 'Filyos'], answer: 0 },
    { q: 'Kızılırmak’ın kolu olan Delice Irmağı’nın suları hangi havzaya ulaşır?', options: ['Karadeniz açık havzası', 'Tuz Gölü kapalı havzası', 'Akdeniz havzası', 'Van Gölü kapalı havzası'], answer: 0 },
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
    { q: 'Perlit yatakları hangi illerde bulunur?', options: ['İzmir-Manisa-Balıkesir-Nevşehir', 'Trabzon-Rize', 'Konya-Karaman', 'Şanlıurfa-Mardin'], answer: 0 },
  ],
  manyezit: [
    { q: 'Manyezit hangi illerde çıkarılır?', options: ['Eskişehir-Kütahya-Konya', 'Zonguldak-Sinop', 'Antalya-Muğla', 'Erzurum-Kars'], answer: 0 },
  ],
  dap: [
    { q: 'DAP hangi bölgeyi kapsar?', options: ['Doğu Anadolu (ve Sivas)', 'Güneydoğu Anadolu', 'İç Anadolu', 'Karadeniz'], answer: 0 },
    { q: 'İç Anadolu’da yer almasına rağmen DAP kapsamına dahil edilen il hangisidir?', options: ['Sivas', 'Kayseri', 'Yozgat', 'Konya'], answer: 0 },
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
    { q: 'Altınkaya Barajı hangi ilimizdedir?', options: ['Samsun', 'Kastamonu', 'Sinop', 'Trabzon'], answer: 0 },
  ],
  'hasan-ugurlu': [
    { q: 'Hasan Uğurlu Barajı hangi nehir üzerindedir?', options: ['Yeşilırmak', 'Kızılırmak', 'Çoruh', 'Sakarya'], answer: 0 },
  ],
  koprulu: [
    { q: 'Köprülü Kanyon Milli Parkı hangi akarsu vadisindedir?', options: ['Köprüçay', 'Manavgat', 'Aksu', 'Dalaman'], answer: 0 },
    { q: 'Köprülü Kanyon hangi ildedir?', options: ['Antalya', 'Mersin', 'Isparta', 'Burdur'], answer: 0 },
  ],
  dilek: [
    { q: 'Dilek Yarımadası Büyük Menderes Deltası Milli Parkı hangi ildedir?', options: ['Aydın', 'Muğla', 'Balıkesir', 'Çanakkale'], answer: 0 },
  ],
  dalyan: [
    { q: 'Köyceğiz-Dalyan koruma alanı hangi ildedir?', options: ['Muğla', 'Antalya', 'Mersin', 'İzmir'], answer: 0 },
    { q: 'İztuzu Kumsalı hangi canlıyla ünlüdür?', options: ['Caretta caretta (deniz kaplumbağası)', 'Akdeniz foku', 'Kelaynak', 'Flamingo'], answer: 0 },
  ],
  menemen: [
    { q: 'Menemen Ovası hangi nehrin oluşturduğu deltadır?', options: ['Gediz', 'Büyük Menderes', 'Küçük Menderes', 'Bakırçay'], answer: 0 },
  ],
  silifke: [
    { q: 'Silifke Delta Ovası hangi nehrin Akdeniz’e döküldüğü yerde oluşmuştur?', options: ['Göksu', 'Seyhan', 'Ceyhan', 'Manavgat'], answer: 0 },
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
    { q: 'Deriner ve Yusufeli barajları hangi ilimizdedir?', options: ['Artvin', 'Erzurum', 'Trabzon', 'Ordu'], answer: 0 },
  ],
  ilisu: [
    { q: 'Ilısu (Veysel Eroğlu) Barajı hangi nehir üzerindedir?', options: ['Dicle', 'Fırat', 'Seyhan', 'Ceyhan'], answer: 0 },
    { q: 'Ilısu Barajı hangi illeri kapsar?', options: ['Şırnak-Mardin', 'Şanlıurfa-Adıyaman', 'Batman-Siirt', 'Diyarbakır-Mardin'], answer: 0 },
  ],
  civa: [
    { q: 'Doğada sıvı halde bulunan cıva madeni hangi illerde çıkarılır?', options: ['İzmir (Ödemiş) - Konya (Sarayönü)', 'Zonguldak - Bartın', 'Mardin - Şırnak', 'Erzurum - Kars'], answer: 0 },
    { q: 'Cıva hangi oluşumla ilişkilendirilir?', options: ['Volkanik ve hidrotermal sahalar', 'Buzul birikimi', 'Delta çökelleri', 'Kıyı setleri'], answer: 0 },
  ],
  gumus: [
    { q: 'Türkiye’nin en büyük gümüş işletmesi (Gümüşköy) hangi ilimizdedir?', options: ['Kütahya', 'Zonguldak', 'Antalya', 'İzmir'], answer: 0 },
    { q: 'Gümüşhane ili adını hangi madenden almıştır?', options: ['Gümüş', 'Altın', 'Bakır', 'Krom'], answer: 0 },
  ],
  kayatuzu: [
    { q: 'Deniz tuzundan üretim yapılan Çamaltı Tuzlası hangi ilimizdedir?', options: ['İzmir', 'Aydın', 'Muğla', 'Manisa'], answer: 0 },
    { q: 'Kaya tuzu mağaralarıyla ünlü ilimiz hangisidir?', options: ['Çankırı', 'Samsun', 'Bursa', 'Adana'], answer: 0 },
  ],
  'karst-kiyi': [
    { q: 'Karstik kıyıların oluşumunda hangi süreç etkilidir?', options: ['Kireçtaşı (kalker) erimesi', 'Buzul aşındırması', 'Volkanik patlama', 'Rüzgâr birikimi'], answer: 0 },
    { q: 'Karstik kıyıların tipik örnekleri hangi bölgededir?', options: ['Akdeniz (Teke ve Taşeli)', 'Doğu Karadeniz', 'Ergene Havzası', 'İç Anadolu'], answer: 0 },
  ],
  tombolo: [
    { q: 'Tombolo (saplı ada) hangi oluşumla meydana gelir?', options: ['Kıyı okunun adayı anakaraya bağlaması', 'Nehir deltasının ilerlemesi', 'Buzul vadisinin derinleşmesi', 'Fay bloklarının kayması'], answer: 0 },
    { q: 'Türkiye’de Kapıdağ Yarımadası ve Sinop Burnu hangi illerdeki tombolo örnekleridir?', options: ['Balıkesir ve Sinop', 'Antalya ve Mersin', 'İzmir ve Aydın', 'Rize ve Artvin'], answer: 0 },
  ],
  'kiyi-ovasi': [
    { q: 'Kıyı ovaları nasıl oluşur?', options: ['Akarsuların kıyıya paralel biriktirmesiyle', 'Volkanik lavların soğumasıyla', 'Buzulların erimesiyle', 'Fay kırılmasıyla'], answer: 0 },
    { q: 'Menemen Ovası kıyı ovasına örnek hangi ildedir?', options: ['İzmir', 'Adana', 'Samsun', 'Trabzon'], answer: 0 },
  ],
  'falez-kiyi': [
    { q: 'Falezli kayalık kıyıların yaygın olduğu bölge hangisidir?', options: ['Karadeniz', 'Ege', 'Akdeniz', 'Marmara'], answer: 0 },
    { q: 'Falezlerin oluşumunda hangi etken rol oynar?', options: ['Dalgaların kıyı kayalarını aşındırması', 'Akarsu birikimi', 'Rüzgâr erozyonu', 'Buzul sürüklenmesi'], answer: 0 },
  ],
  karayel: [
    { q: 'Türkiye’ye kuzeybatıdan esen soğuk yerel rüzgar hangisidir?', options: ['Karayel', 'Poyraz', 'Lodos', 'Samyeli'], answer: 0 },
  ],
  'yildiz-ruzgari': [
    { q: 'Karadeniz kıyılarına tam kuzeyden esen soğuk yerel rüzgar hangisidir?', options: ['Yıldız', 'Kıble', 'Lodos', 'Keşişleme'], answer: 0 },
  ],
  poyraz: [
    { q: 'Kuzeydoğudan esen soğuk ve kuru yerel rüzgar hangisidir?', options: ['Poyraz', 'Lodos', 'Samyeli', 'Kıble'], answer: 0 },
  ],
  samyeli: [
    { q: 'Güneydoğu Anadolu’da buharlaşmayı şiddetlendiren, güneydoğudan esen sıcak rüzgar hangisidir?', options: ['Samyeli (Keşişleme)', 'Karayel', 'Yıldız', 'Poyraz'], answer: 0 },
  ],
  lodos: [
    { q: 'Güneybatıdan esen, kışın kar erimelerine ve soba zehirlenmelerine yol açan sıcak rüzgar hangisidir?', options: ['Lodos', 'Poyraz', 'Yıldız', 'Karayel'], answer: 0 },
  ],
  'fon-ruzgari': [
    { q: 'Dağ yamacından alçalarak her 100 metrede yaklaşık 1 °C ısınan kurutucu rüzgar hangisidir?', options: ['Fön rüzgarı', 'Etezyen', 'Meltem', 'Poyraz'], answer: 0 },
  ],
  'karadeniz-yagis': [
    { q: 'Karadeniz ikliminde en fazla yağış hangi mevsimde düşer?', options: ['Sonbahar', 'İlkbahar', 'Yaz', 'Kış'], answer: 0 },
  ],
  'akdeniz-yagis': [
    { q: 'Akdeniz ikliminde en fazla yağış hangi mevsimde ve hangi oluşumla düşer?', options: ['Kış - Cephesel (frontal)', 'Yaz - Konveksiyonel', 'İlkbahar - Yükselim', 'Sonbahar - Yamaç'], answer: 0 },
  ],
  'ic-anadolu-yagis': [
    { q: 'İç Anadolu’da ilkbaharda görülen “Kırkikindi” yağışları hangi oluşum tipindedir?', options: ['Konveksiyonel (Yükselim)', 'Cephesel (Frontal)', 'Orografik (Yamaç)', 'Muson'], answer: 0 },
  ],
  'erzurum-kars-yagis': [
    { q: 'Erzurum-Kars-Ardahan çevresinde en fazla yağış hangi mevsimde düşer?', options: ['Yaz', 'Kış', 'İlkbahar', 'Sonbahar'], answer: 0 },
  ],
  'divan-yerlesme': [
    { q: 'Batı Karadeniz’de (Sinop, Kastamonu, Bolu, Sakarya) yaygın olan kalıcı köy altı yerleşmesi hangisidir?', options: ['Divan', 'Kom', 'Oba', 'Dalyan'], answer: 0 },
  ],
  'mezra-yerlesme': [
    { q: 'Doğu ve Güneydoğu Anadolu’da tarım ve hayvancılık yapılan kalıcı köy altı yerleşmesi hangisidir?', options: ['Mezra', 'Ağıl', 'Dam', 'Oba'], answer: 0 },
  ],
  'kom-agil': [
    { q: 'Doğu Anadolu’da hayvancılık amacıyla kurulan geçici köy altı yerleşmesi hangisidir?', options: ['Kom', 'Divan', 'Mahalle', 'Çiftlik'], answer: 0 },
  ],
  'dalyan-dam': [
    { q: 'Ege ve Akdeniz kıyılarında balıkçılık faaliyetleriyle ilişkili geçici köy altı yerleşmesi hangisidir?', options: ['Dalyan', 'Kom', 'Mezra', 'Divan'], answer: 0 },
  ],
  cittaslow: [
    { q: 'Türkiye’nin ilk “Sakin Şehri” (Cittaslow) unvanını alan ilçesi hangisidir?', options: ['Seferihisar (İzmir)', 'Halfeti (Şanlıurfa)', 'Akyaka (Muğla)', 'Şavşat (Artvin)'], answer: 0 },
    { q: 'Dünyanın ilk “Sakin Adası” (Cittaslow) unvanına sahip yerimiz hangisidir?', options: ['Gökçeada (Çanakkale)', 'Bozcaada', 'Marmara Adası', 'Avşa Adası'], answer: 0 },
  ],
  findik: [
    { q: 'Türkiye’de fındık üretiminde 1. sırada yer alan ilimiz hangisidir?', options: ['Ordu', 'Trabzon', 'Rize', 'Bartın'], answer: 0 },
  ],
  cay: [
    { q: 'Türkiye’de çay üretiminin tamamına yakını hangi bölümde yapılır?', options: ['Doğu Karadeniz (Rize çevresi)', 'Batı Karadeniz', 'Orta Karadeniz', 'Antalya Bölümü'], answer: 0 },
  ],
  pamuk: [
    { q: 'GAP ile birlikte Türkiye’de pamuk üretiminde 1. sıraya yükselen ilimiz hangisidir?', options: ['Şanlıurfa', 'Adana', 'İzmir', 'Antalya'], answer: 0 },
  ],
  incir: [
    { q: 'Türkiye’de incir üretiminde açık ara 1. sırada yer alan ilimiz hangisidir?', options: ['Aydın', 'Mersin', 'Bursa', 'Hatay'], answer: 0 },
  ],
  'uzum-kayisi': [
    { q: 'Dünya kuru kayısı üretiminde 1. sırada yer alan ilimiz hangisidir?', options: ['Malatya', 'Manisa', 'Aydın', 'Mersin'], answer: 0 },
    { q: 'Çekirdeksiz kuru üzüm üretiminde 1. sırada yer alan ilimiz hangisidir?', options: ['Manisa', 'Denizli', 'Nevşehir', 'Gaziantep'], answer: 0 },
  ],
  'hashas-kenevir': [
    { q: 'Devlet kontrolünde yetiştirilen haşhaş üretiminde 1. sıradaki ilimiz hangisidir?', options: ['Afyonkarahisar', 'Edirne', 'Rize', 'Adana'], answer: 0 },
  ],
  pirinc: [
    { q: 'Meriç ve Ergene nehirleri çevresinde pirinç (çeltik) üretiminde 1. olan ilimiz hangisidir?', options: ['Edirne', 'Konya', 'Şanlıurfa', 'Antalya'], answer: 0 },
  ],
  aycicegi: [
    { q: 'Türkiye’de yağlık ayçiçeği ve kanola üretiminde 1. sırada yer alan ilimiz hangisidir?', options: ['Tekirdağ', 'Trabzon', 'Muğla', 'Erzurum'], answer: 0 },
  ],
  'gul-lavanta': [
    { q: 'Türkiye’de gül ve lavanta üretiminde 1. sırada yer alan ilimiz hangisidir?', options: ['Isparta', 'Antalya', 'Konya', 'Aydın'], answer: 0 },
  ],
  'kucukbas-hayvancilik': [
    { q: 'Türkiye’de koyun varlığında 1. sırada yer alan ilimiz hangisidir?', options: ['Van', 'Rize', 'Bartın', 'Yalova'], answer: 0 },
    { q: 'Toroslar’da engebeli araziye uyum sağlayan ve Mersin-Antalya’da yoğunlaşan hayvancılık türü hangisidir?', options: ['Kıl keçisi', 'Tiftik keçisi', 'İpek böcekçiliği', 'Manda'], answer: 0 },
  ],
  'ipek-aricilik': [
    { q: 'Türkiye’de yaş ipek kozası üretiminde 1. sırada yer alan ilimiz hangisidir?', options: ['Diyarbakır', 'Konya', 'Sivas', 'Edirne'], answer: 0 },
    { q: 'Türkiye’de çam balı üretimiyle ünlü ilimiz hangisidir?', options: ['Muğla', 'Kars', 'Şanlıurfa', 'Yozgat'], answer: 0 },
  ],
  'petrol-rafinerileri': [
    { q: 'Hammaddeye yakınlık ilkesiyle kurulmuş tek petrol rafinerimiz hangi ildedir?', options: ['Batman', 'Kocaeli (İpraş)', 'İzmir (Aliağa)', 'Kırıkkale (Orta Anadolu)'], answer: 0 },
  ],
  'ferrokrom-aluminyum': [
    { q: 'Türkiye’de boksit madenini işleyen tek entegre alüminyum tesisi nerededir?', options: ['Seydişehir (Konya)', 'İskenderun (Hatay)', 'Murgul (Artvin)', 'Ereğli (Zonguldak)'], answer: 0 },
    { q: 'Türkiye’de ferrokrom tesisleri hangi iki ilimizde bulunur?', options: ['Elazığ ve Antalya', 'Samsun ve Artvin', 'Zonguldak ve Karabük', 'Bursa ve Kocaeli'], answer: 0 },
  ],
  'otomotiv-rayli': [
    { q: 'Yerli otomobil (Togg) fabrikası ve otomotiv sanayisinin kalbi hangi ilimizdedir?', options: ['Bursa (Gemlik)', 'Samsun', 'Erzurum', 'Mardin'], answer: 0 },
  ],
  'seker-pamuklu-sanayi': [
    { q: 'Yağış rejimi ve arazi yapısı nedeniyle aşağıdaki bölgelerden hangisinde şeker fabrikası yoktur?', options: ['Doğu Karadeniz ve Güneydoğu kıyıları', 'İç Anadolu', 'Marmara', 'Doğu Anadolu'], answer: 0 },
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
    { q: 'Taşkömürünün Zonguldak çevresinde bulunmasının nedeni nedir?', options: ['1. Jeolojik Zaman (Paleozoik) gür ormanlarının kömürleşmesi', '3. Zaman (Tersiyer) göl bataklıkları', 'Volkanik kül birikimi', 'Buzul taşıması'], answer: 0, tag: 'Neden-sonuç' },
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
    { q: 'Uludağ’ın iç püskürük (batolit) kütle olarak oluşmasının nedeni nedir?', options: ['Magmanın yer kabuğu içinde yavaşça soğuyup katılaşması', 'Kıvrılma', 'Volkanik patlama', 'Buzul birikimi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'menderes-graben': [
    { q: 'Büyük Menderes grabeninin oluşumunun nedeni nedir?', options: ['Kabuk incelmesi ve çekme kuvvetleri', 'Kıvrılma kuvvetleri', 'Buzul basıncı', 'Volkanik patlama'], answer: 0, tag: 'Neden-sonuç' },
  ],
  ergene: [
    { q: 'Ergene Ovası’nın oluşum kökeni nedir?', options: ['Tektonik çöküntü havzasının alüvyonlarla dolması', 'Deniz kıyısında delta birikimi', 'Volkanik set', 'Buzul erimesi'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'koprulu': [
    { q: 'Köprülü Kanyon’un derinleşmesinin nedeni nedir?', options: ['Köprüçay’ın kalkerli (karstik) araziyi aşındırması', 'Buzul aşındırması', 'Volkanik patlama', 'Heyelan'], answer: 0, tag: 'Neden-sonuç' },
  ],
  munzur: [
    { q: 'Munzur Vadisi’nin Türkiye’nin en derin vadilerinden olmasının nedeni nedir?', options: ['Munzur Dağları’nın hızla yükselmesi ve akarsuların aşındırması', 'Buzul erimesi', 'Kıyı erozyonu', 'Rüzgâr aşındırması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  // Beşeri ve Ekonomik Coğrafya Neden-Sonuç & KPSS Soruları
  'fon-ruzgari': [
    { q: 'Rize’de turunçgil, Çoruh vadisinde (Yusufeli) zeytin yetişebilmesinin temel nedeni nedir?', options: ['Fön rüzgarlarının oluşturduğu kış ılıklığı (mikroklima)', 'Enlem etkisi', 'Karstik arazi yapısı', 'Yüksek nem oranı'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'igdir-mikroklima': [
    { q: 'Doğu Anadolu’da yer alan Iğdır Ovası’nda pamuk tarımı yapılabilmesinin nedeni nedir?', options: ['Çevresine göre çukurda kalması ve fön etkisi (mikroklima)', 'Muson rüzgarları', 'Kıyıya yakın olması', 'Kireçli topraklar'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'erzurum-kars-yagis': [
    { q: 'Erzurum-Kars Platosu’nda büyükbaş mera hayvancılığının gelişmesinin temel nedeni nedir?', options: ['Konveksiyonel yaz yağışlarıyla gür alpin çayırların yetişmesi', 'Kışların ılık geçmesi', 'Şeker fabrikalarının varlığı', 'Maki bitki örtüsü'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'mentese-seyrek': [
    { q: 'Menteşe Yöresi’nde iklim elverişli olmasına rağmen nüfusun seyrek olmasının nedeni nedir?', options: ['Dağlık ve engebeli yer şekilleri', 'Yetersiz yağış ve kuraklık', 'Şiddetli kış soğukları', 'Karstik obruklar'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'teke-taseli-seyrek': [
    { q: 'Teke ve Taşeli platolarında nüfus yoğunluğunun az olmasında hangi faktör belirleyicidir?', options: ['Karstik (kalkerli) yapı ve engebeli arazi', 'Yüksek sanayileşme', 'Volkanik tüf örtüsü', 'Taban suyunun yüzeye yakın olması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'tuz-golu-seyrek': [
    { q: 'Tuz Gölü çevresinde yer şekilleri düz olmasına rağmen nüfusun seyrek olmasının temel nedeni nedir?', options: ['Şiddetli kuraklık ve yetersiz yağış', 'Engebeli topografya', 'Gür orman örtüsü', 'Heyelan riski'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'demir-celik': [
    { q: 'Karabük ve Ereğli’de demir madeni çıkarılmamasına rağmen demir-çelik fabrikası kurulmasının nedeni nedir?', options: ['Enerji kaynağına (taşkömürüne) yakınlık', 'Hammaddeye yakınlık', 'Pazar büyüklüğü', 'Turizm potansiyeli'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'bakir-isleme': [
    { q: 'Samsun’da bakır madeni çıkarılmamasına rağmen bakır işleme (izabe) tesisi bulunmasının nedeni nedir?', options: ['Liman ve ulaşım (hinterland) avantajı', 'Hammadde bolluğu', 'Enerji kaynağına yakınlık', 'Ucuz iş gücü'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'limanlar-ticaret': [
    { q: 'Sinop’un Karadeniz’in tek doğal limanı olmasına rağmen gelişememesinin nedeni nedir?', options: ['Küre Dağları nedeniyle iç kesimlerle ulaşımın (hinterlandın) dar olması', 'Kıyı derinliğinin az olması', 'Sınır kapılarına uzak olması', 'Kurak iklim'], answer: 0, tag: 'Neden-sonuç' },
  ],
  pamuk: [
    { q: 'GAP tamamlandıkça pamuk üretiminde 1. sıranın Ege’den Güneydoğu Anadolu’ya (Şanlıurfa) geçmesinin nedeni nedir?', options: ['Sulama olanaklarının artması ve yüksek yaz sıcaklığı', 'Kış yağışlarının azalması', 'Toprakların yıkanması', 'Makineli tarımın azalması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  cay: [
    { q: 'Çay fabrikalarının tamamının Doğu Karadeniz’de toplanmasının nedeni nedir?', options: ['Hammaddenin çabuk bozulması (hammaddeye yakınlık)', 'Ulaşım kolaylığı', 'Enerji bolluğu', 'Tüketici nüfusun fazlalığı'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'cittaslow-dogu-guneydogu': [
    { q: 'Fırat Nehri üzerindeki Birecik Barajı suları altında kalan ve Cittaslow (Sakin Şehir) ağında yer alan yerleşim hangisidir?', options: ['Halfeti (Şanlıurfa)', 'Seferihisar (İzmir)', 'Gökçeada (Çanakkale)', 'Gerze (Sinop)'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'cittaslow-karadeniz-akdeniz': [
    { q: 'Karadeniz Bölgesi’nde Cittaslow (Sakin Şehir) unvanına sahip yerleşimlerden hangisi Artvin ilinde yer alır?', options: ['Şavşat', 'Akyaka', 'Vize', 'Yenipazar'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'savunma-havacilik-sanayi': [
    { q: 'Kırıkkale’de silah, mühimmat ve savunma sanayi tesislerinin kurulmasında temel belirleyici ilke nedir?', options: ['Stratejik güvenlik (ülkenin iç kesiminde korunaklı konum)', 'Liman bağlantısı', 'Deniz ticaretine yakınlık', 'Taşkömürü yataklarına yakınlık'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'tersane-gemi-sanayi': [
    { q: 'Türkiye’de sivil ve askeri tersane (gemi inşa) sanayisinin en çok yoğunlaştığı körfez ve kıyı kuşağı hangisidir?', options: ['İstanbul (Tuzla) - Yalova (Altınova) - Kocaeli (Gölcük)', 'Sinop - Kastamonu - Bartın', 'Antalya - Muğla - Aydın', 'Rize - Artvin - Giresun'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'serbest-ticaret-bolgeleri': [
    { q: 'Türkiye’de serbest ticaret bölgelerinin kurulmasındaki temel ekonomik amaç nedir?', options: ['İhracata dayalı yatırım, üretim ve dış ticareti teşvik etmek', 'İç göçü kırsal alanlara yönlendirmek', 'Yalnızca tarımsal sulamayı artırmak', 'Maden aramalarını kısıtlamak'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'organize-sanayi-ticaret': [
    { q: 'Güneydoğu Anadolu Bölgesi’nde ulaşım kavşağında yer alarak bölgenin en büyük sanayi ve ticaret merkezi haline gelen il hangisidir?', options: ['Gaziantep', 'Hakkâri', 'Tunceli', 'Ardahan'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'ladin-agaci': [
    { q: 'Türkiye’de Doğu Ladini (Picea orientalis) ağacının doğal olarak yetiştiği tek coğrafi bölüm hangisidir?', options: ['Doğu Karadeniz Bölümü (Ordu - Artvin arası)', 'Orta Kızılırmak Bölümü', 'Ergene Bölümü', 'Adana Bölümü'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'kizilcam-ormani': [
    { q: 'Yaz kuraklığına en dayanıklı iğne yapraklı ağaç olan Kızılçam ormanlarının tahrip edildiği Akdeniz ve Ege kıyılarında hangi bitki örtüsü gelişir?', options: ['Maki', 'Alpin çayır', 'Tundra', 'Psödomaki'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'saricam-ormani': [
    { q: 'Kars Sarıkamış çevresinde 2.700 metre yükseltiye kadar çıkabilen ve soğuğa en dayanıklı iğne yapraklı ağaç türü hangisidir?', options: ['Sarıçam', 'Kızılçam', 'Sığla', 'Zeytin'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'sedir-karacam': [
    { q: 'Toros Dağları’nda 1.000-2.000 metre yükselti kuşağında Kızılçamın üst sınırında yaygınlaşan karakteristik iğne yapraklı ağaç hangisidir?', options: ['Toros Sediri ve Karaçam', 'Doğu Ladini', 'Sığla ağacı', 'Datça hurması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'kayin-gurgen': [
    { q: 'Karadeniz iklimine ait geniş yapraklı bir ağaç olan Kayın ağacının Hatay Amanos (Nur) Dağları’nda da görülmesi aşağıdakilerden hangisine örnektir?', options: ['Relikt (kalıntı) bitki', 'Antropojen bozkır', 'Garig (frigana)', 'Halomorfik bitki'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'mese-ormani': [
    { q: 'İklim seçiciliği az olduğu için Türkiye’nin tüm bölgelerinde yetişebilen ve ormanlarımızda kapladığı alan bakımından 1. sırada olan ağaç türü hangisidir?', options: ['Meşe', 'Ladin', 'Sığla', 'Sedir'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'sigla-agaci': [
    { q: 'Yağı ilaç ve parfümeri (kozmetik) sanayisinde kullanılan endemik Sığla (Günlük) ağacı Türkiye’de yalnızca hangi il ve çevresinde doğal yayılış gösterir?', options: ['Muğla (Köyceğiz - Fethiye - Marmaris)', 'Kars (Sarıkamış)', 'Edirne (Ergene)', 'Konya (Cihanbeyli)'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'karliova-dugumu': [
    { q: 'Kuzey Anadolu Fay Hattı (KAF) ile Doğu Anadolu Fay Hattı’nın (DAF) kesiştiği tektonik düğüm noktası hangi ilimizdedir?', options: ['Bingöl (Karlıova)', 'Konya (Karapınar)', 'Kırklareli (Vize)', 'Sinop (Boyabat)'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'kil-kecisi': [
    { q: 'Engebeli arazi yapısı ve maki bitki örtüsüne uyum sağlayan Kıl Keçisi yetiştiriciliğinin en yoğun olduğu bölge ve 1. il hangisidir?', options: ['Akdeniz Bölgesi (Toroslar) — Mersin', 'Marmara Bölgesi — Edirne', 'Karadeniz Bölgesi — Rize', 'İç Anadolu Bölgesi — Eskişehir'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'tiftik-kecisi': [
    { q: 'Parlak yünü (mohair) dokuma sanayisinde kullanılan Tiftik (Angora) Keçisi yetiştiriciliğinde öne çıkan iki temel il hangisidir?', options: ['Ankara ve Siirt', 'Rize ve Trabzon', 'İzmir ve Aydın', 'Edirne ve Tekirdağ'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'manda-yetistiriciligi': [
    { q: 'Sulak ve bataklık delta sahalarını seven Manda yetiştiriciliğinde Türkiye’de 1. sırada yer alan il hangisidir?', options: ['Samsun', 'Konya', 'Muğla', 'Hakkâri'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'buyukbas-besi': [
    { q: 'Büyük tüketici nüfus ve yem/şeker fabrikalarının çevresinde gelişen büyükbaş besi ve ahır hayvancılığında sığır sayısında 1. il hangisidir?', options: ['Konya', 'Rize', 'Tunceli', 'Bartın'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'ipek-bocekciligi': [
    { q: 'Dut ağacı yaprağına bağlı olarak yapılan İpek Böcekçiliğinde (yaş ipek kozası üretiminde) Türkiye’de 1. sırada yer alan il hangisidir?', options: ['Diyarbakır', 'Kars', 'Yozgat', 'Sinop'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'kumes-hayvanciligi': [
    { q: 'Kümes hayvancılığının Marmara ve Ege bölgelerinde (Manisa, Balıkesir, Bolu, Sakarya) yoğunlaşmasının temel nedeni nedir?', options: ['Büyük tüketim merkezlerine (pazar) ve ulaşım hatlarına yakınlık', 'Yaz yağışlarının fazla olması', 'Karstik arazi yapısı', 'Alpin çayırların geniş yer kaplaması'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'balikcilik-su-urunleri': [
    { q: 'Türkiye’de deniz balıkçılığında (avcılık) 1. bölge Karadeniz iken, kültür balıkçılığında (dalyan yetiştiriciliği) 1. sırada yer alan bölge ve il hangisidir?', options: ['Ege Bölgesi — Muğla', 'İç Anadolu Bölgesi — Ankara', 'Güneydoğu Anadolu — Mardin', 'Doğu Anadolu — Kars'], answer: 0, tag: 'Neden-sonuç' },
  ],
  'nemrut-ramsar': [
    { q: '2013 yılında Türkiye’nin 14. Ramsar sulak alanı olarak tescillenen volkanik kaldera gölü hangi ilimizdedir?', options: ['Bitlis (Nemrut Kalderası)', 'Adıyaman (Nemrut Dağı)', 'Ağrı (Tendürek)', 'Manisa (Kula)'], answer: 0, tag: 'Ramsar' },
  ],
  kuyucak: [
    { q: 'Kuzeydoğu Anadolu’da (Kars - Arpaçay) yer alan ve Doğu Anadolu Bölgesi’nin ilk Ramsar sulak alanı olan göl hangisidir?', options: ['Kuyucuk Gölü', 'Çıldır Gölü', 'Hazar Gölü', 'Tortum Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'kizilirmak-ramsar': [
    { q: 'Karadeniz Bölgesi’nde Ramsar Sözleşmesi kapsamında korunan tek sulak alan hangisidir?', options: ['Kızılırmak Deltası (Samsun)', 'Abant Gölü (Bolu)', 'Uzungöl (Trabzon)', 'Borabay Gölü (Amasya)'], answer: 0, tag: 'Ramsar' },
  ],
  'manyas-ramsar': [
    { q: 'Balıkesir Bandırma’da yer alan, Türkiye’nin ilk Ramsar alanlarından (1994) biri olan ve “Kuşcenneti Milli Parkı”nı barındıran tektonik göl hangisidir?', options: ['Manyas (Kuş) Gölü', 'Sapanca Gölü', 'İznik Gölü', 'Terkos Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'uluabat-ramsar': [
    { q: 'Bursa’da yer alan, nilüfer çiçekleri ve Gölyazı yarımadası ile tanınan Güney Marmara Ramsar sulak alanı hangisidir?', options: ['Uluabat (Apolyont) Gölü', 'İznik Gölü', 'Sapanca Gölü', 'Büyükçekmece Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'gediz-ramsar': [
    { q: 'Ege Bölgesi’nin tek resmi Ramsar alanı olan ve içinde Çamaltı Tuzlası ile İzmir Kuş Cenneti’ni barındıran sulak alan hangisidir?', options: ['Gediz Deltası (İzmir)', 'Bafa Gölü (Muğla)', 'Marmara Gölü (Manisa)', 'Işıklı Gölü (Denizli)'], answer: 0, tag: 'Ramsar' },
  ],
  'burdur-ramsar': [
    { q: 'Nesli tehlike altındaki Dikkuyruk ördeğinin önemli kışlama alanı olduğu için 1994’te Türkiye’nin ilk Ramsar alanları arasına alınan Göller Yöresi gölü hangisidir?', options: ['Burdur Gölü', 'Eğirdir Gölü', 'Salda Gölü', 'Beyşehir Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'sultan-sazligi': [
    { q: 'Kayseri Develi Ovası’nda Erciyes Dağı’nın güneyinde yer alan, tatlı ve tuzlu su ekosistemlerini bir arada barındıran Ramsar alanı hangisidir?', options: ['Sultan Sazlığı', 'Eber Gölü', 'Akşehir Gölü', 'Tuz Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'meke-ramsar': [
    { q: 'Konya Karapınar’da iç içe geçmiş volkanik maar ve koni yapısı nedeniyle “Dünyanın Nazar Boncuğu” olarak adlandırılan Ramsar alanı hangisidir?', options: ['Meke Maarı (Gölü)', 'Acıgöl Maarı', 'Narlıgöl', 'Nemrut Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'kizoren-obrugu': [
    { q: 'Türkiye’nin 14 Ramsar sulak alanı içinde “karstik obruk gölü” oluşumuna sahip tek örnek hangisidir?', options: ['Kızören Obruğu (Konya)', 'Cennet-Cehennem Obruğu (Mersin)', 'Salda Gölü (Burdur)', 'Kovada Gölü (Isparta)'], answer: 0, tag: 'Ramsar' },
  ],
  'seyfe-ramsar': [
    { q: 'İç Anadolu Bölgesi’nde Kırşehir (Mucur) sınırlarında yer alan ve flamingo kolonileriyle bilinen tektonik Ramsar alanı hangisidir?', options: ['Seyfe Gölü', 'Mogan Gölü', 'Eymir Gölü', 'Tuzla Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'goksu-ramsar': [
    { q: 'Mersin Silifke’de Akgöl ve Paradeniz lagünlerini kapsayan, saz horozu ve deniz kaplumbağalarının yaşam alanı olan Ramsar alanı hangisidir?', options: ['Göksu Deltası', 'Asi Deltası', 'Köyceğiz Gölü', 'Dalaman Deltası'], answer: 0, tag: 'Ramsar' },
  ],
  'akyatan-ramsar': [
    { q: 'Adana Karataş’ta Çukurova deltası kıyısında yer alan, Türkiye’nin en büyük lagün gölü ve Ramsar alanı hangisidir?', options: ['Akyatan Lagünü', 'Terkos Lagünü', 'Büyükçekmece Lagünü', 'Bafa Gölü'], answer: 0, tag: 'Ramsar' },
  ],
  'yumurtalik-ramsar': [
    { q: 'Adana’da Akyatan Lagünü ile birlikte Ramsar Sözleşmesi kapsamında korunan ve nadir Halep çamı (Pinus halepensis) ormanı barındıran diğer kıyı sulak alanı hangisidir?', options: ['Yumurtalık Lagünleri', 'Göksu Deltası', 'Gediz Deltası', 'Kızılırmak Deltası'], answer: 0, tag: 'Ramsar' },
  ],
  'gobeklitepe-karahantepe': [
    { q: 'MÖ 9600’lere uzanan T biçimli dikilitaşlarıyla “Tarihin Sıfır Noktası” kabul edilen UNESCO Dünya Mirası Göbeklitepe ve Karahantepe (Taş Tepeler) hangi ilimizdedir?', options: ['Şanlıurfa', 'Gaziantep', 'Mardin', 'Adıyaman'], answer: 0, tag: 'Antik Kent' },
  ],
  catalhoyuk: [
    { q: 'Sokaksız, damdan girişli bitişik kerpiç evleriyle insanlığın ilk kentsel yerleşimlerinden biri kabul edilen UNESCO mirası Çatalhöyük Neolitik Kenti hangi ilimizdedir?', options: ['Konya (Çumra)', 'Çorum (Boğazkale)', 'Ankara (Polatlı)', 'Malatya (Battalgazi)'], answer: 0, tag: 'Antik Kent' },
  ],
  arslantepe: [
    { q: '2021 yılında UNESCO Dünya Mirası Listesi’ne kaydedilen, dünyanın en eski kerpiç sarayı, mühürleri ve kılıçlarının bulunduğu Arslantepe Höyüğü hangi ilimizdedir?', options: ['Malatya', 'Elazığ', 'Kayseri', 'Sivas'], answer: 0, tag: 'Antik Kent' },
  ],
  'hattusa-alacahoyuk': [
    { q: 'Hitit İmparatorluğu’nun başkenti olan ve UNESCO Dünya Mirası Listesi’nde yer alan Hattuşa (Boğazkale) ile Alacahöyük hangi ilimizdedir?', options: ['Çorum', 'Yozgat', 'Kırşehir', 'Amasya'], answer: 0, tag: 'Antik Kent' },
  ],
  gordion: [
    { q: '2023 yılında UNESCO Dünya Mirası Listesi’ne giren, Frigya Krallığı’nın başkenti ve Kral Midas Tümülüsü’nün bulunduğu Gordion Antik Kenti hangi ilimizdedir?', options: ['Ankara (Polatlı)', 'Eskişehir (Seyitgazi)', 'Afyonkarahisar (İhsaniye)', 'Kütahya (Çavdarhisar)'], answer: 0, tag: 'Antik Kent' },
  ],
  kultepe: [
    { q: 'Asur Ticaret Kolonileri’nin merkezi olan ve Anadolu’da en eski çivi yazılı tabletlerin bulunmasıyla yazılı tarihin başlangıcı sayılan Kültepe (Kaniş-Karum) hangi ilimizdedir?', options: ['Kayseri', 'Konya', 'Nevşehir', 'Niğde'], answer: 0, tag: 'Antik Kent' },
  ],
  'troya-assos': [
    { q: 'Homeros’un İlyada destanına konu olan UNESCO mirası Troya (Truva) ve Athena Tapınağı ile bilinen Assos (Behramkale) antik kentleri hangi ilimizdedir?', options: ['Çanakkale', 'Balıkesir', 'Bursa', 'İzmir'], answer: 0, tag: 'Antik Kent' },
  ],
  efes: [
    { q: 'Küçük Menderes Nehri’nin taşıdığı alüvyonlarla deltası dolduğu için liman özelliğini kaybederek denizden içeride kalan ve Celsus Kütüphanesi ile ünlü UNESCO mirası antik kent hangisidir?', options: ['Efes (İzmir - Selçuk)', 'Aspendos (Antalya - Serik)', 'Aizanoi (Kütahya)', 'Sagalassos (Burdur)'], answer: 0, tag: 'Antik Kent' },
  ],
  bergama: [
    { q: 'Parşömen kağıdının icat edildiği, antik dünyanın ünlü tıp merkezi Asklepion ve dik Akropol tiyatrosuna sahip UNESCO mirası Pergamon Antik Kenti hangi ilimizdedir?', options: ['İzmir (Bergama)', 'Manisa (Salihli)', 'Aydın (Karacasu)', 'Muğla (Milas)'], answer: 0, tag: 'Antik Kent' },
  ],
  'milet-didyma-priene': [
    { q: 'Büyük Menderes Nehri’nin alüvyonlarıyla Balat Ovası’nın dolması sonucu deniz bağlantısını kaybedip karada kalan Milet ve Priene antik kentleri hangi ilimizdedir?', options: ['Aydın', 'İzmir', 'Muğla', 'Denizli'], answer: 0, tag: 'Antik Kent' },
  ],
  aphrodisias: [
    { q: 'Mermer ocaklarına yakınlığıyla Roma dönemi heykelcilik okulu olarak ünlenen ve Ara Güler’in fotoğraflarıyla dünyaya tanıtılan UNESCO mirası Aphrodisias Antik Kenti hangi ilimizdedir?', options: ['Aydın (Karacasu)', 'Denizli (Pamukkale)', 'Muğla (Yatağan)', 'Burdur (Ağlasun)'], answer: 0, tag: 'Antik Kent' },
  ],
  'hierapolis-laodikeia': [
    { q: 'Pamukkale travertenleriyle birlikte Türkiye’nin iki UNESCO Karma (Doğal + Kültürel) Mirası alanından birini oluşturan Hierapolis Antik Kenti hangi ilimizdedir?', options: ['Denizli', 'Aydın', 'Manisa', 'Afyonkarahisar'], answer: 0, tag: 'Antik Kent' },
  ],
  sardes: [
    { q: 'Lidya Krallığı’nın başkenti olan, Kral Yolu’nun başlangıcında yer alan ve tarihte devlet güvenceli ilk madeni paranın basıldığı Sardes (Sart) Antik Kenti hangi ilimizdedir?', options: ['Manisa (Salihli)', 'İzmir (Selçuk)', 'Uşak (Ulubey)', 'Kütahya (Çavdarhisar)'], answer: 0, tag: 'Antik Kent' },
  ],
  aizanoi: [
    { q: 'Anadolu’nun en iyi korunmuş Zeus Tapınağı’na ve dünyanın ilk borsa (Macellum / fiyat fermanı) yapısına sahip Aizanoi Antik Kenti hangi ilimizdedir?', options: ['Kütahya (Çavdarhisar)', 'Eskişehir (Han)', 'Bursa (İznik)', 'Balıkesir (Erdek)'], answer: 0, tag: 'Antik Kent' },
  ],
  'knidos-stratonikeia': [
    { q: 'Datça yarımadası ucundaki bilim kenti Knidos, Bodrum’daki Halikarnassos ve “Gladyatörler Kenti” Stratonikeia antik kentleri hangi ilimizdedir?', options: ['Muğla', 'Antalya', 'Aydın', 'İzmir'], answer: 0, tag: 'Antik Kent' },
  ],
  'xanthos-letoon': [
    { q: 'Likya Birliği’nin idari başkenti ve kutsal merkezi olarak 1988’de UNESCO Dünya Mirası Listesi’ne alınan Xanthos-Letoon antik kentleri hangi iki ilimizin sınırında yer alır?', options: ['Antalya ve Muğla', 'İzmir ve Aydın', 'Mersin ve Adana', 'Denizli ve Burdur'], answer: 0, tag: 'Antik Kent' },
  ],
  'patara-myra-olympos': [
    { q: 'Dünyanın ilk demokratik meclis (parlamento) binasına ve antik deniz fenerine ev sahipliği yapan Patara ile Noel Baba (Aziz Nikolaos) kilisesinin bulunduğu Myra antik kentleri hangi ilimizdedir?', options: ['Antalya', 'Muğla', 'Mersin', 'Hatay'], answer: 0, tag: 'Antik Kent' },
  ],
  'perge-aspendos-side': [
    { q: 'Kusursuz akustiğiyle günümüzde de konser ve gösterilerde kullanılan dünyanın en iyi korunmuş antik Roma tiyatrosuna sahip Aspendos ile Perge ve Side antik kentleri hangi ilimizdedir?', options: ['Antalya', 'Muğla', 'Burdur', 'Mersin'], answer: 0, tag: 'Antik Kent' },
  ],
  sagalassos: [
    { q: 'Toroslar’da 1.700 metre rakımda kurulu olan ve 1.800 yıldır suyu akan görkemli Antoninler Çeşmesi ile tanınan Sagalassos Antik Kenti hangi ilimizdedir?', options: ['Burdur (Ağlasun)', 'Antalya (Serik)', 'Isparta (Yalvaç)', 'Denizli (Honaz)'], answer: 0, tag: 'Antik Kent' },
  ],
  zeugma: [
    { q: 'Fırat Nehri (Birecik Barajı) kıyısında yer alan ve dünyaca ünlü “Çingene Kızı” mozaiğinin çıkarıldığı Zeugma (Belkıs) Antik Kenti hangi ilimizdedir?', options: ['Gaziantep (Nizip)', 'Şanlıurfa (Halfeti)', 'Hatay (Antakya)', 'Kahramanmaraş (Afşin)'], answer: 0, tag: 'Antik Kent' },
  ],
  'dara-antik': [
    { q: 'Kayaya oyulmuş devasa yer altı su sarnıçları (zindan), baraj ve nekropolü nedeniyle “Mezopotamya’nın Efes’i” olarak adlandırılan Dara Antik Kenti hangi ilimizdedir?', options: ['Mardin', 'Şanlıurfa', 'Diyarbakır', 'Batman'], answer: 0, tag: 'Antik Kent' },
  ],
  'nemrut-kommagene': [
    { q: '2.150 metre yükseklikte Kommagene Kralı I. Antiokhos tarafından yaptırılan dev tanrı heykelleri ve tümülüsü ile UNESCO Dünya Mirası Listesi’nde yer alan Nemrut Dağı hangi ilimizdedir?', options: ['Adıyaman (Kâhta)', 'Bitlis (Tatvan)', 'Malatya (Darende)', 'Elazığ (Harput)'], answer: 0, tag: 'Antik Kent' },
  ],
  'ani-harabeleri': [
    { q: 'Arpaçay sınırında İpek Yolu üzerinde kurulan, “1001 Kiliseli Şehir” olarak bilinen ve Anadolu’daki ilk Türk camisi Ebu’l Menuçehr Camii’ni barındıran UNESCO mirası Ani Harabeleri hangi ilimizdedir?', options: ['Kars', 'Ardahan', 'Erzurum', 'Ağrı'], answer: 0, tag: 'Antik Kent' },
  ],
  'tuspa-cavustepe': [
    { q: 'Tarihi Şamran (Menua) sulama kanalı ve maden işçiliğiyle ünlü Urartu Krallığı’nın başkenti Tuşpa ile Çavuştepe Kalesi hangi ilimizdedir?', options: ['Van', 'Bitlis', 'Muş', 'Hakkâri'], answer: 0, tag: 'Antik Kent' },
  ],
};

function balanceMcqOptions(mcq: McqQuestion, seedKey: string): McqQuestion {
  const hash = [...`${seedKey}:${mcq.q}`].reduce(
    (acc, ch, idx) => (acc * 31 + ch.charCodeAt(0) + idx) >>> 0,
    7,
  );
  const targetAnswer = hash % 4;
  if (targetAnswer === mcq.answer) return mcq;
  const correctText = mcq.options[mcq.answer];
  const distractors = mcq.options.filter((_, idx) => idx !== mcq.answer);
  const rotatedDistractors = distractors.map(
    (_, idx) => distractors[(idx + (hash >>> 2)) % distractors.length],
  );
  return {
    ...mcq,
    options: withAnswer(rotatedDistractors, targetAnswer, correctText),
    answer: targetAnswer,
  };
}

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
  const authored = [...(ITEM_MCQ[item.id] ?? []), ...(ITEM_CAUSE[item.id] ?? [])].map((mcq) =>
    balanceMcqOptions(mcq, item.id),
  );
  if (authored.length > 0) return authored;
  const generated = generatedProvinceMcq(item);
  return generated ? [generated] : [];
}
