/**
 * Türkiye'nin 81 İli İçin Fiziki (Kabartma) Harita Yükselti Basamakları,
 * Ortalama Rakım Verileri ve 3B Topografik Rölyef / İzohips Sırt Hatları.
 *
 * KPSS Coğrafya Fiziki Harita Renk Kuralı:
 * - 0 – 500 m       : Yeşil (Kıyı ovaları, deltalar, Güney Marmara, Ergene ve Kıyı Ege grabenleri)
 * - 500 – 1.000 m   : Sarı (Güneydoğu Anadolu platoları, Orta Karadeniz, İç Batı Anadolu geçişi)
 * - 1.000 – 1.500 m : Turuncu (İç Anadolu yüksek platoları, Toros ve Karadeniz iç kuşağı)
 * - 1.500 – 2.000 m : Kahverengi (Doğu Anadolu geçiş kuşağı ve yüksek dağlık alanlar)
 * - 2.000 m+        : Koyu Kahverengi (Doğu Anadolu yüksek platoları — Erzurum-Kars-Ardahan-Ağrı-Van-Hakkâri)
 */

export type ElevationBandId = 'band0_500' | 'band500_1000' | 'band1000_1500' | 'band1500_2000' | 'band2000_plus';

export type ElevationBandMeta = {
  id: ElevationBandId;
  rangeLabel: string;
  colorName: string;
  lightFill: string;
  darkFill: string;
  ridgeStroke: string;
  kpssNote: string;
};

export const ELEVATION_BANDS: ElevationBandMeta[] = [
  {
    id: 'band0_500',
    rangeLabel: '0 – 500 m',
    colorName: 'Yeşil',
    lightFill: '#78B87E',
    darkFill: '#2E6B47',
    ridgeStroke: '#4D8E55',
    kpssNote: 'Alçak kıyı ovaları, deltalar (Çukurova, Bafra, Çarşamba), Ergene Havzası ve Kıyı Ege grabenleri.',
  },
  {
    id: 'band500_1000',
    rangeLabel: '500 – 1.000 m',
    colorName: 'Sarı',
    lightFill: '#E6CD6E',
    darkFill: '#8B7932',
    ridgeStroke: '#C5A842',
    kpssNote: 'Güneydoğu Anadolu platoları, İç Batı Anadolu eşiği ve Kuzeybatı Anadolu geçiş kuşağı.',
  },
  {
    id: 'band1000_1500',
    rangeLabel: '1.000 – 1.500 m',
    colorName: 'Turuncu',
    lightFill: '#DE9B52',
    darkFill: '#8F5A26',
    ridgeStroke: '#B8722C',
    kpssNote: 'İç Anadolu tabaka düzlükleri (Konya, Bozok, Uzunyayla) ve Toros/Karadeniz dağlık kuşağı.',
  },
  {
    id: 'band1500_2000',
    rangeLabel: '1.500 – 2.000 m',
    colorName: 'Kahverengi',
    lightFill: '#B86E42',
    darkFill: '#723F22',
    ridgeStroke: '#8F4E27',
    kpssNote: 'Yukarı Kızılırmak (Sivas), Çoruh-Kelkit oluğu ve Yukarı Fırat-Murat dağlık sahaları.',
  },
  {
    id: 'band2000_plus',
    rangeLabel: '2.000 m+',
    colorName: 'Koyu Kahverengi',
    lightFill: '#84462A',
    darkFill: '#542816',
    ridgeStroke: '#5E2E18',
    kpssNote: 'Erzurum-Kars-Ardahan yüksek platoları, Hakkâri (Cilo-Sat) ve Ağrı-Süphan-Tendürek volkanik çatısı.',
  },
];

export const ELEVATION_BAND_BY_ID: Record<ElevationBandId, ElevationBandMeta> = {
  band0_500: ELEVATION_BANDS[0],
  band500_1000: ELEVATION_BANDS[1],
  band1000_1500: ELEVATION_BANDS[2],
  band1500_2000: ELEVATION_BANDS[3],
  band2000_plus: ELEVATION_BANDS[4],
};

export type ProvinceElevationInfo = {
  band: ElevationBandId;
  avgMeters: number;
  reliefNote: string;
};

export const PROVINCE_ELEVATIONS: Record<string, ProvinceElevationInfo> = {
  // 0 – 500 m (Yeşil Basamak — Marmara, Kıyı Ege, Çukurova ve Kıyı Karadeniz Deltaları)
  İstanbul: { band: 'band0_500', avgMeters: 40, reliefNote: 'Çatalca-Kocaeli aşınım platosu; Türkiye’nin en alçak platolarındandır (Yeşil ton).' },
  Kocaeli: { band: 'band0_500', avgMeters: 85, reliefNote: 'Çatalca-Kocaeli aşınım düzlüğü ve İzmit Körfezi kıyı kuşağı (Yeşil ton).' },
  Yalova: { band: 'band0_500', avgMeters: 60, reliefNote: 'Güney Marmara kıyı kuşağı; fiziki haritada yeşil basamakta yer alır.' },
  Sakarya: { band: 'band0_500', avgMeters: 45, reliefNote: 'Aşağı Sakarya (Adapazarı) Ovası; fiziki haritada yeşil renkle gösterilir.' },
  Düzce: { band: 'band0_500', avgMeters: 160, reliefNote: 'Düzce tektonik çöküntü ovası; çevresi dağlık, ova tabanı yeşil basamaktadır.' },
  Edirne: { band: 'band0_500', avgMeters: 42, reliefNote: 'Ergene Havzası ve Meriç Deltası; Türkiye’de yeşil rengin en geniş olduğu ovalardandır.' },
  Tekirdağ: { band: 'band0_500', avgMeters: 55, reliefNote: 'Ergene Ovası ve Marmara kıyısı; alçak yükselti nedeniyle yeşil ton hakimdir.' },
  Kırklareli: { band: 'band0_500', avgMeters: 210, reliefNote: 'Ergene Havzası yeşil, kuzeydeki Yıldız (Istranca) Dağları orta yükseltidedir.' },
  Çanakkale: { band: 'band0_500', avgMeters: 90, reliefNote: 'Biga ve Gelibolu yarımadaları; kıyı ovaları yeşil, Kaz Dağları sarı-turuncu tondadır.' },
  Balıkesir: { band: 'band0_500', avgMeters: 145, reliefNote: 'Güney Marmara (Manyas-Gönen) ve Edremit kıyı ovaları yeşil basamaktadır.' },
  Bursa: { band: 'band0_500', avgMeters: 155, reliefNote: 'Bursa-Karacabey-İnegöl ovaları yeşil, güneydeki Uludağ (2.543 m) koyu kahverengidir.' },
  İzmir: { band: 'band0_500', avgMeters: 30, reliefNote: 'Bakırçay, Gediz ve Küçük Menderes graben/delta ovaları yeşil basamaktadır.' },
  Aydın: { band: 'band0_500', avgMeters: 65, reliefNote: 'Büyük Menderes Grabeni ve Balat Deltası fiziki haritada yeşil renkle gösterilir.' },
  Manisa: { band: 'band0_500', avgMeters: 75, reliefNote: 'Gediz Grabeni tabanı yeşil, Bozdağlar horstu orta yükselti kuşağındadır.' },
  Adana: { band: 'band0_500', avgMeters: 25, reliefNote: 'Çukurova Deltası yeşil, kuzeydeki Aladağlar (Orta Toroslar) koyu kahverengidir.' },
  Osmaniye: { band: 'band0_500', avgMeters: 125, reliefNote: 'Yukarı Çukurova (Ceyhan) ovası yeşil, Amanos (Nur) Dağları dik yükselir.' },
  Hatay: { band: 'band0_500', avgMeters: 95, reliefNote: 'Amik Graben Ovası ve Samandağ Deltası yeşil, Amanos Dağları dik yamaçlıdır.' },
  Samsun: { band: 'band0_500', avgMeters: 40, reliefNote: 'Bafra ve Çarşamba deltaları ile gerideki alçak Canik Dağları sayesinde Karadeniz’de yeşil alanın en geniş olduğu ildir.' },
  Sinop: { band: 'band0_500', avgMeters: 65, reliefNote: 'İnceburun-Boztepe kıyısı yeşil, hemen gerisinde Küre Dağları yükselir.' },
  Zonguldak: { band: 'band0_500', avgMeters: 110, reliefNote: 'Filyos vadisi ve kıyı kuşağı yeşil, iç kesim Batı Karadeniz dağlarıdır.' },
  Bartın: { band: 'band0_500', avgMeters: 35, reliefNote: 'Bartın Çayı vadisi alçak ve eğimi az olduğu için ulaşım yapılabilir (Yeşil basamak).' },

  // 500 – 1.000 m (Sarı Basamak — Güneydoğu Anadolu, İç Batı Anadolu, Orta Karadeniz ve Geçiş Kuşağı)
  Bilecik: { band: 'band500_1000', avgMeters: 520, reliefNote: 'Marmara’dan İç Anadolu platosuna geçiş eşiği; Sakarya vadisi derin yarılmıştır.' },
  Bolu: { band: 'band500_1000', avgMeters: 740, reliefNote: 'Bolu ve Köroğlu dağları arasında yer alan yüksek tektonik ova ve orman kuşağı.' },
  Karabük: { band: 'band500_1000', avgMeters: 510, reliefNote: 'Safranbolu aşınım platosu ve Batı Karadeniz dağ içi havzası.' },
  Kastamonu: { band: 'band500_1000', avgMeters: 820, reliefNote: 'Kuzeyde Küre, güneyde Ilgaz kıvrım dağları arasında Gökırmak platosu.' },
  Çorum: { band: 'band500_1000', avgMeters: 810, reliefNote: 'Orta Karadeniz’den İç Anadolu’ya geçiş kuşağı (500–1.000 m sarı basamak).' },
  Amasya: { band: 'band500_1000', avgMeters: 420, reliefNote: 'Yeşilırmak (Harşena) vadisi alçak, çevresindeki Canik ve Akdağ kütleleri orta yükseltidedir.' },
  Tokat: { band: 'band500_1000', avgMeters: 630, reliefNote: 'Kazova ve Niksar-Erbaa tektonik ovaları ile orta yükseltili dağ sıraları.' },
  Ordu: { band: 'band500_1000', avgMeters: 480, reliefNote: 'Kıyı dar, hemen gerisinde Canik ve Giresun dağlarıyla Perşembe Platosu yükselir.' },
  Giresun: { band: 'band500_1000', avgMeters: 690, reliefNote: 'Kıyı şeridi çok dar; Giresun Dağları (3.107 m) kıyıdan itibaren hızla yükselir.' },
  Trabzon: { band: 'band500_1000', avgMeters: 750, reliefNote: 'Doğu Karadeniz kıyı dağları (Zigana/Soğanlı) kıyıya paralel duvar gibi yükselir.' },
  Muğla: { band: 'band500_1000', avgMeters: 660, reliefNote: 'Menteşe Dağları kıyıya paralel ve engebeli olduğu için Kıyı Ege’nin en yüksek/dağlık yöresidir.' },
  Denizli: { band: 'band500_1000', avgMeters: 580, reliefNote: 'Çürüksu-Büyük Menderes grabeninden İç Batı Anadolu platosuna ve Honaz Dağı’na geçiş.' },
  Uşak: { band: 'band500_1000', avgMeters: 910, reliefNote: 'İç Batı Anadolu eşiği (500–1.000 m sarı basamak); Ulubey Kanyonu ve Murat Dağı.' },
  Kütahya: { band: 'band500_1000', avgMeters: 960, reliefNote: 'İç Batı Anadolu eşiğindeki yüksek plato ve kırıklı-volkanik eşik dağları.' },
  Burdur: { band: 'band500_1000', avgMeters: 950, reliefNote: 'Göller Yöresi ve Batı Toroslar karstik polye-plato kuşağı.' },
  Isparta: { band: 'band500_1000', avgMeters: 1030, reliefNote: 'Göller Yöresi (Eğirdir-Kovada) ve Dedegöl-Davraz (Batı Toroslar) kıvrım kuşağı.' },
  Antalya: { band: 'band500_1000', avgMeters: 620, reliefNote: 'Kıyıdaki Antalya Ovası yeşil, hemen gerisindeki Beydağları ve Batı Toroslar (3.086 m) kısa mesafede kahverengiye çıkar.' },
  Mersin: { band: 'band500_1000', avgMeters: 590, reliefNote: 'Silifke Deltası yeşil, hemen gerisindeki Taşeli Platosu ve Bolkar Dağları (3.524 m) çok dik yükselir.' },
  Gaziantep: { band: 'band500_1000', avgMeters: 850, reliefNote: 'Gaziantep Platosu (500–1.000 m sarı basamak); Fırat’a doğru alçalır.' },
  Kilis: { band: 'band500_1000', avgMeters: 660, reliefNote: 'Güneydoğu Anadolu’nun batısındaki az eğimli plato düzlüğü (Sarı basamak).' },
  Şanlıurfa: { band: 'band500_1000', avgMeters: 520, reliefNote: 'Şanlıurfa-Harran-Ceylanpınar düzlükleri (500–1.000 m sarı basamak) ve Karacadağ kalkan volkanı.' },
  Mardin: { band: 'band500_1000', avgMeters: 980, reliefNote: 'Mezopotamya ovasına bakan Mardin-Midyat (Mazı Dağı) kalker eşiği.' },
  Diyarbakır: { band: 'band500_1000', avgMeters: 675, reliefNote: 'Yukarı Dicle Havzası çanağı; kuzeyde Güneydoğu Toroslar, batıda Karacadağ ile çevrilidir.' },
  Adıyaman: { band: 'band500_1000', avgMeters: 670, reliefNote: 'Güneydoğu Toroslar (Nemrut Dağı 2.150 m) eteklerinden Fırat (Atatürk Barajı) havzasına inen basamak.' },
  Batman: { band: 'band500_1000', avgMeters: 550, reliefNote: 'Dicle ve Batman Çayı vadisi ile Raman-Garzan antiklinal kıvrımları.' },
  Siirt: { band: 'band500_1000', avgMeters: 895, reliefNote: 'Botan Çayı derin vadileri ve Güneydoğu Toroslar geçiş kuşağı.' },
  Ankara: { band: 'band500_1000', avgMeters: 890, reliefNote: 'Haymana Platosu ve Sakarya-Kızılırmak arası İç Anadolu tabaka düzlükleri (Sarı-turuncu geçişi).' },
  Eskişehir: { band: 'band500_1000', avgMeters: 790, reliefNote: 'Yukarı Sakarya (Yazılıkaya) platosu ve Porsuk Ovası (500–1.000 m sarı basamak).' },
  Kırıkkale: { band: 'band500_1000', avgMeters: 740, reliefNote: 'Kızılırmak vadisi ve Orta Anadolu plato düzlüğü.' },
  Kırşehir: { band: 'band500_1000', avgMeters: 985, reliefNote: 'Orta Kızılırmak Kırşehir Masifi ve Seyfe kapalı havzası.' },
  Çankırı: { band: 'band500_1000', avgMeters: 730, reliefNote: 'İç Anadolu’dan Kuzey Anadolu (Ilgaz) dağlarına geçiş basamağı.' },

  // 1.000 – 1.500 m (Turuncu Basamak — Yüksek İç Anadolu Platoları ve Toros/Karadeniz Yüksek Kuşağı)
  Konya: { band: 'band1000_1500', avgMeters: 1016, reliefNote: 'Konya Ovası, Cihanbeyli ve Obruk platoları (~1.000 m); fiziki haritada sarı-turuncu basamaktadır.' },
  Karaman: { band: 'band1000_1500', avgMeters: 1035, reliefNote: 'Konya kapalı havzası güneyi ve Orta Toroslar (Taşeli) kuzey yamaçları.' },
  Aksaray: { band: 'band1000_1500', avgMeters: 980, reliefNote: 'Tuz Gölü havzası (~905 m) ve Hasan Dağı (3.268 m) volkanik yükseltisi.' },
  Nevşehir: { band: 'band1000_1500', avgMeters: 1150, reliefNote: 'Kapadokya volkanik tüf platosu (1.000–1.500 m turuncu basamak).' },
  Niğde: { band: 'band1000_1500', avgMeters: 1230, reliefNote: 'Melendiz-Hasan Dağı volkanları ile Aladağlar ve Bolkar Dağları (3.756 m) kuşağı.' },
  Yozgat: { band: 'band1000_1500', avgMeters: 1300, reliefNote: 'İç Anadolu’nun yüksek tabaka düzlüğü olan Bozok Platosu (Turuncu basamak).' },
  Kayseri: { band: 'band1000_1500', avgMeters: 1054, reliefNote: 'Develi-Kayseri çanağı (~1.050 m) ve İç Anadolu’nun en yüksek zirvesi Erciyes Dağı (3.917 m — Koyu kahverengi).' },
  Afyonkarahisar: { band: 'band1000_1500', avgMeters: 1020, reliefNote: 'Ege’nin en yüksek iç kesimi; Sultan ve Emir dağları ile yüksek ovalar.' },
  Kahramanmaraş: { band: 'band1000_1500', avgMeters: 1120, reliefNote: 'Maraş grabeninden Nurhak, Binboğa ve Engizek dağlarına (1.500–3.000 m) yükselen dik rölyef.' },
  Elazığ: { band: 'band1000_1500', avgMeters: 1067, reliefNote: 'Yukarı Fırat Bölümü; Doğu Anadolu’nun yükseltisi en düşük (1.000–1.200 m) tektonik çukur ovalarındandır.' },
  Malatya: { band: 'band1000_1500', avgMeters: 970, reliefNote: 'Güneydoğu Toroslar kuzeyindeki Malatya tektonik çöküntü ovası; Doğu Anadolu’da rakımı en ılıman havzalardandır.' },
  Iğdır: { band: 'band1000_1500', avgMeters: 850, reliefNote: 'KPSS klasiği: Doğu Anadolu’da çevresi 2.000–5.000 m dağlarla çevrili olmasına rağmen ~850 m rakımlı çukur tektonik ovadır (Mikroklima).' },
  Rize: { band: 'band1000_1500', avgMeters: 1350, reliefNote: 'Kıyıdan birkaç km içeride Kaçkar Dağları (3.932 m) duvar gibi yükselir; gerçek alan ile izdüşüm alan farkı en fazladır.' },
  Artvin: { band: 'band1000_1500', avgMeters: 1450, reliefNote: 'Çoruh Nehri’nin derin kanyonlarla yardığı Kaçkar, Karçal ve Yalnızçam yüksek dağ kuşağı.' },
  Şırnak: { band: 'band1000_1500', avgMeters: 1350, reliefNote: 'Güneydoğu Toroslar (Cudi ve Gabar dağları) kuşağı.' },

  // 1.500 – 2.000 m (Kahverengi Basamak — Doğu Anadolu Geçişi ve Yüksek Dağlık Kuşak)
  Sivas: { band: 'band1500_2000', avgMeters: 1480, reliefNote: 'İç Anadolu’nun en yüksek ve en dağlık bölümü (Yukarı Kızılırmak); Uzunyayla Platosu, Köse ve Tecer dağları.' },
  Gümüşhane: { band: 'band1500_2000', avgMeters: 1520, reliefNote: 'Zigana ve Gümüşhane dağları arasındaki yüksek ve engebeli Kelkit-Harşit havzası.' },
  Bayburt: { band: 'band1500_2000', avgMeters: 1550, reliefNote: 'Çoruh vadisi ve Kop-Mescit dağları arasındaki yüksek plato.' },
  Erzincan: { band: 'band1500_2000', avgMeters: 1480, reliefNote: 'KAF üzerindeki Erzincan çöküntü ovası (~1.200 m) ile onu çevreleyen Munzur/Mercan ve Keşiş Dağları (3.549 m).' },
  Tunceli: { band: 'band1500_2000', avgMeters: 1650, reliefNote: 'Munzur (Mercan) Dağları (3.462 m) ve derin akarsu vadileri; Türkiye’nin en sarp arazilerindendir.' },
  Bingöl: { band: 'band1500_2000', avgMeters: 1580, reliefNote: 'Bingöl ve Şerafettin dağları ile Karlıova yüksek tektonik düğüm sahası.' },
  Muş: { band: 'band1500_2000', avgMeters: 1520, reliefNote: 'Murat Nehri’nin suladığı yüksek Muş tektonik ovası ve güneydeki Bitlis dağları.' },
  Bitlis: { band: 'band1500_2000', avgMeters: 1640, reliefNote: 'Bitlis Masifi, Nemrut Kalderası (2.935 m) ve Süphan Dağı (4.058 m) volkanik rölyefi.' },

  // 2.000 m+ (Koyu Kahverengi Basamak — Türkiye'nin Çatısı: Doğu Anadolu Yüksek Platoları ve Buzul Dağları)
  Erzurum: { band: 'band2000_plus', avgMeters: 1950, reliefNote: 'Erzurum-Kars lav platosu, Palandöken (3.127 m) ve Mescit dağları; fiziki haritada koyu kahverengi hakimdir.' },
  Kars: { band: 'band2000_plus', avgMeters: 1890, reliefNote: 'Yaklaşık 2.000 m yükseltili volkanik lav platosu ve Allahüekber Dağları (Koyu kahverengi basamak).' },
  Ardahan: { band: 'band2000_plus', avgMeters: 1920, reliefNote: 'Yalnızçam ve Allahüekber dağları arasındaki yüksek lav platosu ve Çıldır çanağı.' },
  Ağrı: { band: 'band2000_plus', avgMeters: 1980, reliefNote: 'Türkiye’nin en yüksek noktası Büyük Ağrı Dağı (5.137 m), Küçük Ağrı ve Tendürek volkanik kuşağı.' },
  Van: { band: 'band2000_plus', avgMeters: 1850, reliefNote: '1.646 m rakımlı Van Gölü yüksek kapalı havzası ve çevresindeki 3.000+ m volkanik/kıvrım dağlar.' },
  Hakkâri: { band: 'band2000_plus', avgMeters: 2250, reliefNote: 'Cilo-Sat (Buzul) Dağları (4.135 m); Türkiye’de ortalama yükseltinin ve gerçek-izdüşüm alan farkının en yüksek olduğu ildir.' },
};

/**
 * Harita üzerinde 3B topografik kabartma (rölyef) etkisi veren ana dağ kuşakları
 * ve yüksek plato sırt çizgileri (360x190 SVG koordinat uzayında).
 */
export type ReliefRidge = {
  id: string;
  label: string;
  d: string;
  labelX: number;
  labelY: number;
  elevationText: string;
};

export const TOPOGRAPHIC_RELIEF_RIDGES: ReliefRidge[] = [
  {
    id: 'kuzey-anadolu-bati',
    label: 'BATI KARADENİZ DAĞLARI',
    d: 'M 105 40 Q 132 30 162 34 Q 186 38 205 46',
    labelX: 155,
    labelY: 31,
    elevationText: 'Küre · Ilgaz · Köroğlu',
  },
  {
    id: 'kuzey-anadolu-dogu',
    label: 'DOĞU KARADENİZ (KAÇKAR) SIRALARI',
    d: 'M 218 45 Q 252 44 282 36 Q 305 31 326 30',
    labelX: 274,
    labelY: 33,
    elevationText: 'Giresun · Zigana · Kaçkar (3.932 m)',
  },
  {
    id: 'bati-toroslar',
    label: 'BATI TOROSLAR',
    d: 'M 74 146 Q 94 152 110 132 Q 122 142 136 154',
    labelX: 105,
    labelY: 146,
    elevationText: 'Bey · Akdağ · Dedegöl (3.086 m)',
  },
  {
    id: 'orta-toroslar',
    label: 'ORTA TOROSLAR',
    d: 'M 140 156 Q 165 150 186 136 Q 204 120 220 105',
    labelX: 178,
    labelY: 147,
    elevationText: 'Geyik · Bolkar · Aladağlar (3.756 m)',
  },
  {
    id: 'guneydogu-toroslar',
    label: 'GÜNEYDOĞU TOROSLAR',
    d: 'M 222 126 Q 256 114 292 118 Q 324 124 348 134',
    labelX: 286,
    labelY: 115,
    elevationText: 'Nurhak · Malatya · Hakkâri Cilo (4.135 m)',
  },
  {
    id: 'ege-horst-kusagi',
    label: 'EGE KIRIK (HORST) DAĞLARI',
    d: 'M 38 66 L 66 66 M 38 84 L 68 84 M 40 101 L 72 101 M 42 118 L 76 118 M 48 135 L 74 142',
    labelX: 54,
    labelY: 96,
    elevationText: 'Kaz · Madra · Yunt · Boz · Aydın · Menteşe',
  },
  {
    id: 'dogu-volkan-sirasi',
    label: 'DOĞU ANADOLU VOLKAN HATTI',
    d: 'M 304 102 Q 318 88 332 76 L 343 63',
    labelX: 321,
    labelY: 85,
    elevationText: 'Nemrut · Süphan · Tendürek · Ağrı (5.137 m)',
  },
];
