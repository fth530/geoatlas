export type LayerId =
  | 'provinces'
  | 'mountains'
  | 'lakes'
  | 'plains'
  | 'rivers'
  | 'coasts'
  | 'geology'
  | 'soil'
  | 'minerals'
  | 'projects';

export type TopicStatus = 'new' | 'studying' | 'review' | 'weak' | 'done';

export type MapItem = {
  id: string;
  name: string;
  layer: Exclude<LayerId, 'provinces'>;
  subtype: string;
  subtypeLabel: string;
  provinces: string[];
  tags?: string[];
  elevation?: string;
  description: string;
  examTip?: string;
};

export type Layer = {
  id: LayerId;
  label: string;
  icon: string;
  filters: { id: string; label: string }[];
  description: string;
};

export const LAYERS: Layer[] = [
  {
    id: 'provinces',
    label: 'İller',
    icon: 'map',
    filters: [{ id: 'all', label: '81 il' }],
    description: 'Plaka kodları ve il sınırları',
  },
  {
    id: 'mountains',
    label: 'Dağlar',
    icon: 'triangle',
    filters: [
      { id: 'all', label: 'Tüm dağlar' },
      { id: 'fold', label: 'Kıvrım' },
      { id: 'horst', label: 'Kırık' },
      { id: 'volcanic', label: 'Volkanik' },
      { id: 'glacier', label: 'Buzul izli' },
    ],
    description: 'Kıvrım, kırık ve volkanik dağlar',
  },
  {
    id: 'lakes',
    label: 'Göller',
    icon: 'circle',
    filters: [
      { id: 'all', label: 'Tüm göller' },
      { id: 'tectonic', label: 'Tektonik' },
      { id: 'karstic', label: 'Karstik' },
      { id: 'mixed', label: 'Karma' },
      { id: 'volcanic', label: 'Volkanik' },
      { id: 'set', label: 'Doğal set' },
      { id: 'glacial', label: 'Buzul' },
    ],
    description: 'Oluşum türlerine göre göller',
  },
  {
    id: 'plains',
    label: 'Plato & ova',
    icon: 'layers',
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'karstic', label: 'Karstik' },
      { id: 'volcanic', label: 'Volkanik' },
      { id: 'erosion', label: 'Aşınım' },
      { id: 'delta', label: 'Delta' },
      { id: 'tectonic', label: 'Tektonik' },
    ],
    description: 'Yükselti düzlükleri ve ovalar',
  },
  {
    id: 'rivers',
    label: 'Akarsular',
    icon: 'activity',
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'blacksea', label: 'Karadeniz' },
      { id: 'mediterranean', label: 'Akdeniz' },
      { id: 'aegean', label: 'Ege' },
      { id: 'outside', label: 'Sınır aşan' },
      { id: 'closed', label: 'Kapalı havza' },
    ],
    description: 'Akarsu ağları ve havzalar',
  },
  {
    id: 'coasts',
    label: 'Kıyılar',
    icon: 'wind',
    filters: [
      { id: 'all', label: 'Tüm kıyılar' },
      { id: 'longitudinal', label: 'Boyuna' },
      { id: 'transverse', label: 'Enine' },
      { id: 'ria', label: 'Ria' },
      { id: 'dalmatic', label: 'Dalmaçya' },
      { id: 'lagoon', label: 'Kıyı seti' },
    ],
    description: 'Kıyı tipleri ve kıyı şekilleri',
  },
  {
    id: 'geology',
    label: 'Jeoloji',
    icon: 'layers',
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'fault', label: 'Fay hatları' },
      { id: 'volcanic', label: 'Volkanik alan' },
      { id: 'massif', label: 'Masif' },
    ],
    description: 'Faylar, volkanizma ve jeolojik yapılar',
  },
  {
    id: 'soil',
    label: 'Toprak & bitki',
    icon: 'feather',
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'chernozem', label: 'Çernozyom' },
      { id: 'terra-rossa', label: 'Terra rossa' },
      { id: 'steppe', label: 'Bozkır' },
      { id: 'forest', label: 'Orman' },
    ],
    description: 'Türkiye’nin toprak ve bitki örtüsü',
  },
  {
    id: 'minerals',
    label: 'Maden & enerji',
    icon: 'compass',
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'metal', label: 'Metalik maden' },
      { id: 'industrial', label: 'Endüstriyel' },
      { id: 'coal', label: 'Kömür' },
      { id: 'oil', label: 'Petrol' },
      { id: 'renewable', label: 'Yenilenebilir' },
    ],
    description: 'Maden yatakları ve enerji kaynakları',
  },
  {
    id: 'projects',
    label: 'Projeler',
    icon: 'navigation',
    filters: [
      { id: 'all', label: 'Tümü' },
      { id: 'regional', label: 'Bölgesel proje' },
      { id: 'ramsar', label: 'Ramsar alanı' },
      { id: 'park', label: 'Milli park' },
    ],
    description: 'Bölgesel projeler ve koruma alanları',
  },
];

export const MAP_COLORS: Record<string, string> = {
  volcanic: '#D47B51',
  fold: '#737D9C',
  horst: '#9B795A',
  glacier: '#5B91A0',
  tectonic: '#7489B8',
  karstic: '#9D80B3',
  mixed: '#637B87',
  volcanicLake: '#D47B51',
  set: '#A777A0',
  glacial: '#5B91A0',
  delta: '#5086C4',
  erosion: '#B99055',
  closed: '#8E7BB4',
  blacksea: '#528CA0',
  mediterranean: '#428B9A',
  aegean: '#8D7AC7',
  longitudinal: '#568B9C',
  transverse: '#6199C4',
  ria: '#8296B1',
  dalmatic: '#9478AA',
  lagoon: '#A777A0',
  fault: '#C8685A',
  massif: '#897968',
  chernozem: '#8A6D47',
  'terra-rossa': '#C16E51',
  steppe: '#A9985D',
  forest: '#7B8FA1',
  metal: '#6D8290',
  industrial: '#A27A55',
  coal: '#5F6268',
  oil: '#4D5255',
  renewable: '#7887D8',
  regional: '#536DC4',
  ramsar: '#598DA0',
  park: '#7591C9',
};

export const MAP_ITEMS: MapItem[] = [
  { id: 'agri', name: 'Büyük Ağrı Dağı', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Ağrı'], elevation: '5.137 m', description: 'Türkiye’nin en yüksek dağıdır. Tabakalı volkan yapısındadır.', examTip: 'Zirvesinde Türkiye’nin en büyük takke buzulu bulunur.' },
  { id: 'tendurek', name: 'Tendürek Dağı', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Ağrı', 'Van'], elevation: '3.533 m', description: 'Çift kraterli volkanik dağdır.', examTip: 'Ağrı ile Van arasında uzanır.' },
  { id: 'suphan', name: 'Süphan Dağı', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Bitlis', 'Ağrı'], elevation: '4.058 m', description: 'Van Gölü’nün kuzeyinde yer alan volkanik dağ.', examTip: 'Türkiye’nin en yüksek üçüncü dağıdır.' },
  { id: 'nemrut-bitlis', name: 'Nemrut Dağı', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Bitlis'], elevation: '2.935 m', description: 'Kaldera yapısı ve sıcak-soğuk gölleriyle bilinen volkanik dağ.', examTip: 'Adıyaman’daki Nemrut Dağı ile karıştırma; Van Gölü’nün oluşumunda lavları etkilidir.' },
  { id: 'erciyes', name: 'Erciyes Dağı', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Kayseri'], elevation: '3.917 m', description: 'İç Anadolu’nun en yüksek dağıdır.', examTip: 'Zirvesinde güncel buzul izleri bulunur.' },
  { id: 'hasan', name: 'Hasan Dağı', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Aksaray', 'Niğde'], elevation: '3.268 m', description: 'Çift zirveli volkanik dağ.', examTip: 'Kapadokya tüf sahasını oluşturan volkanik kuşağın parçasıdır.' },
  { id: 'karacadağ-se', name: 'Karacadağ', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Şanlıurfa', 'Diyarbakır'], elevation: '1.957 m', description: 'Geniş bazalt lavlarının oluşturduğu kalkan volkanı.', examTip: 'Türkiye’nin tek kalkan volkanı olarak öğretilir.' },
  { id: 'kuladag', name: 'Kula Volkanları', layer: 'mountains', subtype: 'volcanic', subtypeLabel: 'Volkanik', provinces: ['Manisa'], elevation: '850 m', description: 'Türkiye’nin en genç volkanik oluşumları arasında yer alır.', examTip: 'Kula Jeoparkı ile tanınır.' },
  { id: 'kackar', name: 'Kaçkar Dağları', layer: 'mountains', subtype: 'fold', subtypeLabel: 'Kıvrım', provinces: ['Rize', 'Artvin'], tags: ['glacier'], elevation: '3.932 m', description: 'Kuzey Anadolu Dağları’nın en yüksek zirvelerindendir.', examTip: 'Güncel vadi ve sirk buzulları görülür.' },
  { id: 'cilo', name: 'Cilo-Sat Dağları', layer: 'mountains', subtype: 'fold', subtypeLabel: 'Kıvrım', provinces: ['Hakkâri'], tags: ['glacier'], elevation: '4.135 m', description: 'Türkiye’nin en yüksek kıvrım dağları arasında yer alır.', examTip: 'Büyük vadi buzulları ve sirk gölleri bulunur.' },
  { id: 'aladaglar', name: 'Aladağlar', layer: 'mountains', subtype: 'fold', subtypeLabel: 'Kıvrım', provinces: ['Niğde', 'Adana', 'Kayseri'], tags: ['glacier'], elevation: '3.756 m', description: 'Orta Torosların yüksek dağ kütlelerinden biridir.', examTip: 'Demirkazık zirvesi ve güncel buzul izleriyle bilinir.' },
  { id: 'kazdaglari', name: 'Kaz Dağları', layer: 'mountains', subtype: 'horst', subtypeLabel: 'Kırık (horst)', provinces: ['Balıkesir', 'Çanakkale'], elevation: '1.774 m', description: 'Biga Yarımadası’ndaki yaşlı kütlelerden biridir.', examTip: 'Ege horstlarının en kuzeyinde yer alır.' },
  { id: 'bozdaglar', name: 'Bozdağlar', layer: 'mountains', subtype: 'horst', subtypeLabel: 'Kırık (horst)', provinces: ['İzmir', 'Manisa'], elevation: '2.159 m', description: 'Gediz ve Küçük Menderes grabenleri arasında uzanır.', examTip: 'Ege’nin doğu-batı doğrultulu horst sistemindedir.' },
  { id: 'amanos', name: 'Amanos (Nur) Dağları', layer: 'mountains', subtype: 'horst', subtypeLabel: 'Kırık (horst)', provinces: ['Hatay'], elevation: '2.240 m', description: 'Hatay’da yer alan kırık dağ sırası.', examTip: 'Akdeniz Bölgesi’nde öne çıkan horst örneğidir.' },
  { id: 'tuz-golu', name: 'Tuz Gölü', layer: 'lakes', subtype: 'tectonic', subtypeLabel: 'Tektonik', provinces: ['Ankara', 'Konya', 'Aksaray'], description: 'Kapalı havzada yer alır; yazın buharlaşmayla alanı daralır.', examTip: 'Suyu tuzludur.' },
  { id: 'iznik', name: 'İznik Gölü', layer: 'lakes', subtype: 'tectonic', subtypeLabel: 'Tektonik', provinces: ['Bursa'], description: 'Marmara Bölgesi’ndeki tektonik göllerden biridir.', examTip: 'Gideğeni olduğu için suyu tatlıdır.' },
  { id: 'sapanca', name: 'Sapanca Gölü', layer: 'lakes', subtype: 'tectonic', subtypeLabel: 'Tektonik', provinces: ['Sakarya', 'Kocaeli'], description: 'Marmara Bölgesi’nde uzanan tektonik göl.', examTip: 'Açık havza özelliği suyun tatlı olmasını sağlar.' },
  { id: 'salda', name: 'Salda Gölü', layer: 'lakes', subtype: 'karstic', subtypeLabel: 'Karstik', provinces: ['Burdur'], description: 'Beyaz hidromanyezit kıyılarıyla bilinen derin göl.', examTip: 'Karstik oluşumludur.' },
  { id: 'van', name: 'Van Gölü', layer: 'lakes', subtype: 'mixed', subtypeLabel: 'Karma: tektonik + volkanik set', provinces: ['Van', 'Bitlis'], description: 'Tektonik çanağın Nemrut lavlarıyla kapanmasıyla oluşmuştur.', examTip: 'Türkiye’nin en büyük sodalı gölüdür; kapalı havzadır.' },
  { id: 'beysehir', name: 'Beyşehir Gölü', layer: 'lakes', subtype: 'mixed', subtypeLabel: 'Karma: tektonik + karstik', provinces: ['Konya', 'Isparta'], description: 'Türkiye’nin en büyük tatlı su gölüdür.', examTip: 'Denize ulaşmadığı için kapalı havza kabul edilir.' },
  { id: 'meke', name: 'Meke Maarı', layer: 'lakes', subtype: 'volcanicLake', subtypeLabel: 'Volkanik maar', provinces: ['Konya'], description: 'Volkanik gaz patlamasıyla oluşmuş maar gölü.', examTip: 'Karapınar çevresindeki volkanik göllerden biridir.' },
  { id: 'cildir', name: 'Çıldır Gölü', layer: 'lakes', subtype: 'set', subtypeLabel: 'Volkanik set', provinces: ['Ardahan', 'Kars'], description: 'Lav seti oluşumlu doğal göl.', examTip: 'Kışın yüzeyi donar; tatlı sudur.' },
  { id: 'terkos', name: 'Terkos (Durusu) Gölü', layer: 'lakes', subtype: 'set', subtypeLabel: 'Kıyı seti', provinces: ['İstanbul'], description: 'Kıyı kordonunun gerisinde oluşan lagün gölü.', examTip: 'Kıyı set gölü örneğidir.' },
  { id: 'tortum', name: 'Tortum Gölü', layer: 'lakes', subtype: 'set', subtypeLabel: 'Heyelan seti', provinces: ['Erzurum'], description: 'Heyelan seti gölüdür; Tortum Şelalesi ile ilişkilidir.', examTip: 'Karadeniz ve Doğu Anadolu çevresindeki heyelan seti örneklerindendir.' },
  { id: 'uludag-sirk', name: 'Uludağ sirk gölleri', layer: 'lakes', subtype: 'glacial', subtypeLabel: 'Buzul sirk gölleri', provinces: ['Bursa'], description: 'Uludağ’daki eski buzul izleriyle ilişkili küçük sirk gölleri.', examTip: 'Uludağ’da güncel değil, geçmiş dönem buzul şekilleri görülür.' },
  { id: 'erzurum-kars', name: 'Erzurum-Kars-Ardahan Platosu', layer: 'plains', subtype: 'volcanic', subtypeLabel: 'Volkanik plato', provinces: ['Erzurum', 'Kars', 'Ardahan'], elevation: 'Yaklaşık 2.000 m', description: 'Lav örtüleriyle oluşmuş yüksek plato sahası.', examTip: 'Çernozyom, yaz yağışları ve büyükbaş mera hayvancılığıyla eşleştirilir.' },
  { id: 'teke', name: 'Teke Platosu', layer: 'plains', subtype: 'karstic', subtypeLabel: 'Karstik plato', provinces: ['Antalya', 'Muğla'], description: 'Kalker erimesinin etkili olduğu geçirgen plato.', examTip: 'Nüfus seyrek, kıl keçisi yetiştiriciliği yaygındır.' },
  { id: 'taseli', name: 'Taşeli Platosu', layer: 'plains', subtype: 'karstic', subtypeLabel: 'Karstik plato', provinces: ['Mersin', 'Karaman'], description: 'Türkiye’nin en engebeli karstik platolarındandır.', examTip: 'Karstik arazi nedeniyle nüfus seyrektir.' },
  { id: 'bafra', name: 'Bafra Ovası', layer: 'plains', subtype: 'delta', subtypeLabel: 'Delta ovası', provinces: ['Samsun'], description: 'Kızılırmak’ın taşıdığı alüvyonlarla oluşmuştur.', examTip: 'Samsun çevresinde falez azdır; kıyı birikimi gelişmiştir.' },
  { id: 'carsamba', name: 'Çarşamba Ovası', layer: 'plains', subtype: 'delta', subtypeLabel: 'Delta ovası', provinces: ['Samsun'], description: 'Yeşilırmak’ın oluşturduğu delta ovasıdır.', examTip: 'Samsun kıyılarında delta gelişimini destekleyen örnek.' },
  { id: 'ergene', name: 'Ergene Ovası', layer: 'plains', subtype: 'tectonic', subtypeLabel: 'Tektonik ova', provinces: ['Tekirdağ', 'Edirne', 'Kırklareli'], description: 'Trakya’daki geniş tektonik ova.', examTip: 'Aktif fay hattında bulunmayan tektonik ova örneği olarak sorulabilir.' },
  { id: 'kizilirmak', name: 'Kızılırmak', layer: 'rivers', subtype: 'blacksea', subtypeLabel: 'Karadeniz havzası', provinces: ['Sivas', 'Kayseri', 'Nevşehir', 'Kırıkkale', 'Çankırı', 'Çorum', 'Samsun'], description: 'Türkiye sınırları içinde doğup Karadeniz’e dökülen en uzun akarsudur.', examTip: 'Bafra Deltası’nı oluşturur.' },
  { id: 'yesilirmak', name: 'Yeşilırmak', layer: 'rivers', subtype: 'blacksea', subtypeLabel: 'Karadeniz havzası', provinces: ['Sivas', 'Tokat', 'Amasya', 'Samsun'], description: 'Orta Karadeniz’e dökülen önemli akarsulardandır.', examTip: 'Çarşamba Deltası’nı oluşturur.' },
  { id: 'firat', name: 'Fırat Nehri', layer: 'rivers', subtype: 'outside', subtypeLabel: 'Sınır aşan akarsu', provinces: ['Erzincan', 'Elazığ', 'Malatya', 'Tunceli', 'Adıyaman', 'Şanlıurfa'], description: 'Türkiye’den doğup Suriye ve Irak yönüne ilerler.', examTip: 'Üzerinde Keban ve Atatürk barajları bulunur.' },
  { id: 'ceyhan', name: 'Ceyhan Nehri', layer: 'rivers', subtype: 'mediterranean', subtypeLabel: 'Akdeniz havzası', provinces: ['Kahramanmaraş', 'Adana'], description: 'Akdeniz’e ulaşan önemli akarsulardandır.', examTip: 'Seyhan ile birlikte Çukurova’nın birikim şekillerini besler.' },
  { id: 'konya-kapali', name: 'Konya kapalı havzası', layer: 'rivers', subtype: 'closed', subtypeLabel: 'Kapalı havza', provinces: ['Konya', 'Aksaray'], description: 'Akarsuların denize ulaşmadığı iç havza.', examTip: 'Tuz Gölü, Konya kapalı havzasında yer alır.' },
  { id: 'gediz', name: 'Gediz Nehri', layer: 'rivers', subtype: 'aegean', subtypeLabel: 'Ege havzası', provinces: ['Kütahya', 'Uşak', 'Manisa', 'İzmir'], description: 'Ege Bölgesi’ndeki graben ovalarını besler.', examTip: 'Menemen Ovası’nda Ege Denizi’ne ulaşır.' },
  { id: 'boyuna-karadeniz', name: 'Boyuna kıyılar', layer: 'coasts', subtype: 'longitudinal', subtypeLabel: 'Boyuna kıyı', provinces: ['Rize', 'Trabzon', 'Giresun', 'Artvin'], description: 'Dağlar kıyıya paralel uzanır.', examTip: 'Kıta sahanlığı dar, falezler yaygındır.' },
  { id: 'enine-ege', name: 'Enine kıyılar', layer: 'coasts', subtype: 'transverse', subtypeLabel: 'Enine kıyı', provinces: ['İzmir', 'Aydın', 'Muğla'], description: 'Dağlar kıyıya dik uzanır; girinti ve çıkıntı fazladır.', examTip: 'Kıta sahanlığı geniştir.' },
  { id: 'ria-mugla', name: 'Ria kıyıları', layer: 'coasts', subtype: 'ria', subtypeLabel: 'Ria kıyı', provinces: ['Muğla', 'İstanbul'], description: 'Akarsu vadilerinin deniz altında kalmasıyla oluşur.', examTip: 'Muğla kıyıları ve Haliç örnek verilir.' },
  { id: 'dalmatic-kas', name: 'Dalmaçya kıyıları', layer: 'coasts', subtype: 'dalmatic', subtypeLabel: 'Dalmaçya kıyı', provinces: ['Antalya'], description: 'Kıyıya paralel uzanan dağların sular altında kalmasıyla ada dizileri oluşur.', examTip: 'Kaş-Finike kıyıları örnektir.' },
  { id: 'terkos-lagoon', name: 'Terkos kıyı set gölü', layer: 'coasts', subtype: 'lagoon', subtypeLabel: 'Kıyı set gölü', provinces: ['İstanbul'], description: 'Kıyı setinin gerisinde denizden ayrılarak oluşan lagün.', examTip: 'Büyükçekmece, Küçükçekmece ve Durusu/Terkos örnekleri önemlidir.' },
  { id: 'kaf', name: 'Kuzey Anadolu Fay Hattı', layer: 'geology', subtype: 'fault', subtypeLabel: 'Fay hattı', provinces: ['Bolu', 'Düzce', 'Sakarya', 'Amasya', 'Tokat', 'Erzincan', 'Bingöl'], description: 'Saros’tan Karlıova’ya uzanan sağ yanal atımlı fay sistemi.', examTip: 'Erzincan, Tokat, Amasya, Bolu ve Düzce hattı KAF ile ilişkilidir.' },
  { id: 'daf', name: 'Doğu Anadolu Fay Hattı', layer: 'geology', subtype: 'fault', subtypeLabel: 'Fay hattı', provinces: ['Hatay', 'Kahramanmaraş', 'Adıyaman', 'Malatya', 'Elazığ', 'Bingöl'], description: 'Karlıova’da KAF ile birleşen sol yanal atımlı fay sistemi.', examTip: 'Malatya ve Elazığ DAF hattı üzerindedir.' },
  { id: 'kulavolkan', name: 'Kula volkanik sahası', layer: 'geology', subtype: 'volcanic', subtypeLabel: 'Volkanik alan', provinces: ['Manisa'], description: 'Ege’deki genç volkanik oluşum sahası.', examTip: 'Türkiye’nin en genç volkanik konilerindendir.' },
  { id: 'menderes-masifi', name: 'Menderes Masifi', layer: 'geology', subtype: 'massif', subtypeLabel: 'Masif arazi', provinces: ['Aydın', 'Denizli', 'Muğla', 'Manisa'], description: 'Ege’de geniş alan kaplayan yaşlı metamorfik kütle.', examTip: 'Birinci jeolojik zamanın yaşlı masif arazileri içinde değerlendirilir.' },
  { id: 'erzurum-toprak', name: 'Erzurum-Kars çernozyomları', layer: 'soil', subtype: 'chernozem', subtypeLabel: 'Çernozyom', provinces: ['Erzurum', 'Kars', 'Ardahan'], description: 'Yaz yağışları ve çayır örtüsüyle gelişen koyu renkli topraklar.', examTip: 'Büyükbaş mera hayvancılığıyla ilişkilendirilir.' },
  { id: 'akdeniz-toprak', name: 'Terra rossa', layer: 'soil', subtype: 'terra-rossa', subtypeLabel: 'Terra rossa', provinces: ['Antalya', 'Mersin', 'Hatay'], description: 'Kalkerli arazilerde görülen Akdeniz’in kırmızı renkli toprağı.', examTip: 'Kalker ve sıcak-nemli Akdeniz koşullarıyla eşleştirilir.' },
  { id: 'ic-anadolu-steppe', name: 'Bozkır bitki örtüsü', layer: 'soil', subtype: 'steppe', subtypeLabel: 'Bozkır', provinces: ['Konya', 'Ankara', 'Yozgat'], description: 'Yağışın az olduğu iç kesimlerde yaygın doğal bitki örtüsü.', examTip: 'Kahverengi ve kestane renkli bozkır topraklarıyla birlikte düşünülür.' },
  { id: 'karadeniz-forest', name: 'Nemli orman kuşağı', layer: 'soil', subtype: 'forest', subtypeLabel: 'Orman', provinces: ['Rize', 'Artvin', 'Trabzon'], description: 'Yağışın fazla olduğu Karadeniz kıyı kuşağında yaygın orman örtüsü.', examTip: 'Doğu Karadeniz’de geniş yapraklı ve karma ormanlar öne çıkar.' },
  { id: 'zonguldak-komur', name: 'Taşkömürü', layer: 'minerals', subtype: 'coal', subtypeLabel: 'Taşkömürü', provinces: ['Zonguldak'], description: 'Zonguldak çevresindeki taşkömürü yatakları.', examTip: 'Türkiye’de taşkömürünün öne çıkan çıkarım alanıdır.' },
  { id: 'eskisehir-luletasi', name: 'Lületaşı', layer: 'minerals', subtype: 'industrial', subtypeLabel: 'Endüstriyel maden', provinces: ['Eskişehir'], description: 'Eskişehir ile özdeşleşmiş endüstriyel hammaddedir.', examTip: 'Maden-yöre eşleştirmelerinde sık kullanılır.' },
  { id: 'elazig-bakir', name: 'Bakır', layer: 'minerals', subtype: 'metal', subtypeLabel: 'Metalik maden', provinces: ['Elazığ'], description: 'Elazığ-Maden çevresinde çıkarılan metalik maden.', examTip: 'Maden yatakları ile sanayi hammaddelerini eşleştir.' },
  { id: 'batman-petrol', name: 'Petrol', layer: 'minerals', subtype: 'oil', subtypeLabel: 'Petrol', provinces: ['Batman', 'Diyarbakır', 'Siirt'], description: 'Güneydoğu Anadolu’da çıkarılan önemli enerji kaynağı.', examTip: 'Batman rafinerisi ve petrol üretim sahalarıyla eşleştirilir.' },
  { id: 'ege-jeotermal', name: 'Jeotermal enerji', layer: 'minerals', subtype: 'renewable', subtypeLabel: 'Yenilenebilir enerji', provinces: ['Aydın', 'Denizli', 'Manisa'], description: 'Ege’nin kırıklı yapısı sıcak su kaynaklarını destekler.', examTip: 'Batı Anadolu, jeotermal kaynakların yoğun olduğu alandır.' },
  { id: 'gap', name: 'GAP', layer: 'projects', subtype: 'regional', subtypeLabel: 'Bölgesel proje', provinces: ['Şanlıurfa', 'Diyarbakır', 'Adıyaman', 'Mardin', 'Batman', 'Siirt', 'Şırnak', 'Kilis', 'Gaziantep'], description: 'Fırat ve Dicle havzalarında sulama ve enerji yatırımlarını kapsar.', examTip: 'Atatürk Barajı ve sulama projeleriyle birlikte düşünülür.' },
  { id: 'nemrut-ramsar', name: 'Nemrut Kalderası', layer: 'projects', subtype: 'ramsar', subtypeLabel: 'Ramsar alanı', provinces: ['Bitlis'], description: 'Kaldera içindeki göller ve sulak alan ekosistemiyle bilinir.', examTip: 'Nemrut Dağı ile Adıyaman’daki Nemrut’u ayırt et.' },
  { id: 'kackar-park', name: 'Kaçkar Dağları Milli Parkı', layer: 'projects', subtype: 'park', subtypeLabel: 'Milli park', provinces: ['Rize', 'Artvin'], description: 'Yüksek dağ ekosistemi, buzul şekilleri ve doğal yaşam alanlarıyla korunur.', examTip: 'Kaçkar Dağları’nın konumuyla birlikte öğren.' },
];

export const TOPIC_DETAILS = [
  { id: 'mountains', title: 'Dağlar', subtitle: 'Kıvrım, kırık ve volkanik dağlar', icon: 'triangle' },
  { id: 'lakes', title: 'Göller', subtitle: 'Oluşum türleri ve özellikleri', icon: 'circle' },
  { id: 'plains', title: 'Platolar ve ovalar', subtitle: 'Delta, tektonik ve karstik şekiller', icon: 'layers' },
  { id: 'rivers', title: 'Akarsular ve havzalar', subtitle: 'Açık, kapalı ve sınır aşan havzalar', icon: 'activity' },
  { id: 'coasts', title: 'Kıyı tipleri', subtitle: 'Boyuna, enine, ria ve diğer kıyılar', icon: 'wind' },
  { id: 'geology', title: 'Jeoloji ve iç kuvvetler', subtitle: 'Fay hatları, masifler ve volkanizma', icon: 'layers' },
  { id: 'soil', title: 'Toprak ve bitki örtüsü', subtitle: 'Toprak türleri ve doğal bitki kuşakları', icon: 'feather' },
  { id: 'minerals', title: 'Madenler ve enerji', subtitle: 'Yataklar, kaynaklar ve santraller', icon: 'compass' },
  { id: 'projects', title: 'Projeler ve koruma alanları', subtitle: 'GAP, Ramsar alanları ve milli parklar', icon: 'navigation' },
  { id: 'provinces', title: 'İller ve bölgeler', subtitle: '81 il, plaka kodu ve bölge bilgisi', icon: 'map' },
];

export const STATUS_OPTIONS: { id: TopicStatus; label: string; color: string }[] = [
  { id: 'new', label: 'Başlamadım', color: '#8A90A1' },
  { id: 'studying', label: 'Çalışıyorum', color: '#5D74D5' },
  { id: 'review', label: 'Tekrar', color: '#B78948' },
  { id: 'weak', label: 'Zayıf', color: '#C36D5C' },
  { id: 'done', label: 'Tamamlandı', color: '#617FC7' },
];

export const STATUS_LABEL: Record<TopicStatus, string> = {
  new: 'Başlamadım',
  studying: 'Çalışıyorum',
  review: 'Tekrar',
  weak: 'Zayıf',
  done: 'Tamamlandı',
};
