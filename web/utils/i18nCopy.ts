import type { AreaLabel, AreaName, Confidence } from '~/types/areas'

export type AscendLocale = 'en' | 'id'

// Complete 1-to-1 Indonesian translations for all 30 real factor strings in coffee_shop.geojson
const FACTOR_TEXT_ID: Record<string, string> = {
  'Campus buildings nearby': 'Ada gedung kampus di sekitar sini',
  'Campuses in the wider area': 'Ada kampus di area sekitar yang lebih luas',
  'Few bus stops nearby': 'Sedikit halte bus di sekitar',
  'Few campuses in the wider area': 'Sedikit kampus di area sekitar yang lebih luas',
  'Few health facilities around': 'Sedikit fasilitas kesehatan di sekitar',
  'Good transit in the wider area': 'Transportasi umum baik di area sekitar',
  'Little transit in the wider area': 'Transportasi umum minim di area sekitar',
  'No campus right nearby': 'Tidak ada kampus tepat di sekitar sini',
  'Bus stops or stations nearby': 'Dekat halte bus atau stasiun',
  'Busy shopping area around': 'Area belanja yang ramai di sekitar',
  'Clinics or hospitals nearby': 'Dekat klinik atau rumah sakit',
  'Close to a campus': 'Dekat dengan kawasan kampus',
  'Close to a train station': 'Dekat dengan stasiun kereta',
  'Far from a campus': 'Jauh dari kawasan kampus',
  'Far from a train station': 'Jauh dari stasiun kereta',
  'Few hotels in the wider area': 'Sedikit hotel di area sekitar yang lebih luas',
  'Few offices in the wider area': 'Sedikit perkantoran di area sekitar yang lebih luas',
  'Few offices nearby': 'Sedikit perkantoran di sekitar sini',
  'Few residents in the wider area': 'Sedikit penduduk di area sekitar yang lebih luas',
  'Few residents in this spot': 'Sedikit penduduk tepat di titik ini',
  'Few residents nearby': 'Sedikit penduduk di sekitar sini',
  'Few schools in the wider area': 'Sedikit sekolah di area sekitar yang lebih luas',
  'Few schools nearby': 'Sedikit sekolah di sekitar sini',
  'Few shops in the wider area': 'Sedikit toko di area sekitar yang lebih luas',
  'Few shops nearby': 'Sedikit toko di sekitar sini',
  'Health facilities in the wider area': 'Tersedia fasilitas kesehatan di area luas',
  'Hotels in the wider area': 'Banyak hotel di area sekitar yang lebih luas',
  'Hotels nearby': 'Banyak hotel dan penginapan di sekitar',
  'Many residents in the wider area': 'Banyak penduduk di area sekitar yang lebih luas',
  'Many residents in this spot': 'Banyak penduduk tepat di titik ini',
  'Many residents nearby': 'Banyak penduduk di sekitar sini',
  'Many shops nearby': 'Banyak toko dan ritel di sekitar',
  'No clinics nearby': 'Belum ada klinik di sekitar sini',
  'No hotels nearby': 'Belum ada hotel di sekitar sini',
  'Offices in the wider area': 'Banyak perkantoran di area sekitar yang lebih luas',
  'Offices nearby': 'Banyak perkantoran di sekitar sini',
  'Schools in the wider area': 'Banyak sekolah di area sekitar yang lebih luas',
  'Schools nearby': 'Banyak sekolah di sekitar sini',
}

export function translateFactorByLocale(text: string, locale: AscendLocale): string {
  if (locale !== 'id') return text
  return FACTOR_TEXT_ID[text] ?? text
}

export function formatAreaNameByLocale(areaName: AreaName, locale: AscendLocale): string {
  if (locale === 'id') {
    return areaName === 'telkom_area' ? 'Kawasan Telkom University' : 'Kota Bandung'
  }
  return areaName === 'telkom_area' ? 'Telkom University area' : 'Bandung city'
}

export const LABEL_TEXT_BY_LOCALE: Record<
  AscendLocale,
  Record<
    AreaLabel,
    {
      title: string
      shortTitle: string
      description: string
      headlineDescription: string
      quickTip: string
      extraHint?: string
    }
  >
> = {
  en: {
    opportunity: {
      title: 'Opportunity',
      shortTitle: 'Opportunity',
      description: 'Fewer coffee shops than local demand here typically supports.',
      headlineDescription: 'Fewer coffee shops than demand here typically supports.',
      quickTip: 'Fewer coffee shops operate within ~500 m than local demand usually supports. Strong sign of remaining room for a new shop.',
    },
    fair: {
      title: 'Fair',
      shortTitle: 'Fair',
      description: 'Current shop count sits within the normal range for local demand.',
      headlineDescription: 'Coffee shops here are about what demand typically supports.',
      quickTip: 'Active coffee shops roughly match what nearby residents, campuses, offices, and transit typically sustain.',
    },
    crowded: {
      title: 'Crowded',
      shortTitle: 'Crowded',
      description: 'More coffee shops already operate here than local demand typically supports.',
      headlineDescription: 'More coffee shops than demand here typically supports.',
      quickTip: 'More coffee shops already operate within ~500 m than nearby demand usually supports. Expect tougher competition.',
    },
    not_enough_demand: {
      title: 'Not enough demand',
      shortTitle: 'Low demand',
      description: 'Resident density and daily activity are currently too thin to support a new shop.',
      headlineDescription: 'Too few people nearby for a coffee shop to be sure of steady custom.',
      quickTip: 'Nearby population and daily activity cues are currently too thin to sustain steady daily coffee shop demand.',
      extraHint: 'A quiet area is not a bad area; it may suit a different business type.',
    },
  },
  id: {
    opportunity: {
      title: 'Peluang',
      shortTitle: 'Peluang',
      description: 'Jumlah kedai kopi lebih sedikit dari kapasitas yang biasanya ditopang permintaan setempat.',
      headlineDescription: 'Kedai kopi lebih sedikit dari kapasitas permintaan setempat.',
      quickTip: 'Kedai kopi aktif dalam radius ~500 m masih jauh di bawah kapasitas permintaan sekitar. Tanda kuat masih ada ruang untuk usaha baru.',
    },
    fair: {
      title: 'Seimbang',
      shortTitle: 'Seimbang',
      description: 'Jumlah kedai kopi saat ini berada dalam kisaran normal untuk permintaan setempat.',
      headlineDescription: 'Jumlah kedai kopi sudah sesuai dengan kapasitas permintaan setempat.',
      quickTip: 'Jumlah kedai kopi aktif sebanding dengan daya dukung penduduk, kampus, kantor, dan akses transit di sekitar.',
    },
    crowded: {
      title: 'Padat',
      shortTitle: 'Padat',
      description: 'Kedai kopi yang sudah beroperasi lebih banyak dari kapasitas yang biasanya ditopang permintaan.',
      headlineDescription: 'Kedai kopi sudah melebihi kapasitas permintaan setempat.',
      quickTip: 'Kedai kopi dalam radius ~500 m sudah melebihi kapasitas permintaan sekitar. Persaingan di area ini cenderung lebih ketat.',
    },
    not_enough_demand: {
      title: 'Permintaan rendah',
      shortTitle: 'Permintaan rendah',
      description: 'Kepadatan penduduk dan aktivitas harian di sekitar masih terlalu tipis untuk kedai baru.',
      headlineDescription: 'Terlalu sedikit aktivitas harian di sekitar untuk menopang pelanggan tetap.',
      quickTip: 'Kepadatan penduduk dan pemicu aktivitas harian saat ini masih terlalu tipis untuk menopang kedai kopi secara stabil.',
      extraHint: 'Area yang sepi belum tentu buruk; mungkin lebih cocok untuk jenis usaha lain.',
    },
  },
}

export const CONFIDENCE_BY_LOCALE: Record<
  AscendLocale,
  Record<Confidence, { title: string; note: string; quickTip: string }>
> = {
  en: {
    normal: {
      title: 'Normal confidence',
      note: 'Open map coverage in this neighborhood is sufficient for comparison.',
      quickTip: 'At least 3 mapped open-data places exist nearby, giving enough context for comparison.',
    },
    low: {
      title: 'Low confidence',
      note: 'Low confidence: open data may miss some outlets here, such as informal stalls.',
      quickTip: 'Fewer than 3 mapped places exist within ~500 m. Informal stalls may not appear in open data, so verify on the ground.',
    },
  },
  id: {
    normal: {
      title: 'Keyakinan normal',
      note: 'Cakupan data peta terbuka di lingkungan ini memadai untuk perbandingan.',
      quickTip: 'Terdapat minimal 3 titik data peta terbuka di sekitar sehingga perbandingan cukup representatif.',
    },
    low: {
      title: 'Keyakinan rendah',
      note: 'Keyakinan rendah: data terbuka mungkin belum mencatat sebagian usaha di sini, seperti warung atau gerobak informal.',
      quickTip: 'Kurang dari 3 titik peta terbuka tercatat dalam ~500 m. Pedagang informal mungkin belum terdata, jadi pastikan cek langsung ke lapangan.',
    },
  },
}

export const HOME_COPY_ID = {
  navbar: {
    brand: 'ASCEND',
    links: [
      { id: 'cara-kerja', label: 'Cara kerja', href: '#cara-kerja' },
      { id: 'fitur', label: 'Fitur', href: '#fitur' },
      { id: 'tentang', label: 'Tentang', href: '#tim' },
    ],
    cta: 'Buka peta',
  },

  hero: {
    eyebrow: 'SELAMAT DATANG · PETA PELUANG USAHA NUSANTARA',
    wordmark: 'ASCEND',
    wordmarkHoverNote: 'MULAI KECIL · TUMBUH BERTAHAP · CAPAI PUNCAK',
    headlineLine1: 'Temukan ruang usaha yang masih bisa',
    headlineLine2Prefix: 'kamu',
    headlineLine2Accent: 'isi.',
    subtitle:
      'Lihat di mana kedai pertamamu masih punya ruang, dari hitungan jumlah usaha terhadap kapasitas permintaan setempat, bukan sekadar firasat jalan ramai.',
    businessCoffee: 'Kedai kopi',
    businessEatery: 'Warung makan',
    comingSoon: 'SEGERA HADIR',
    eateryComingSoonTitle: 'Cakupan warung makan & kuliner segera hadir',
    eateryComingSoonBody:
      'Ascend saat ini menyajikan data terbuka langsung untuk Kedai kopi di 1.976 area. Pemetaan warung makan akan dirilis pada tahap berikutnya.',
    ctaPrimary: 'Buka peta',
    ctaSecondary: 'Lihat cara kerjanya',
    chatPlaceholder: 'Tanya Ascend: di mana mahasiswa cocok membuka kios kopi?',
    chatSubmitLabel: 'Pratinjau',
    chatComingSoonBadge: 'SEGERA HADIR · PRATINJAU ASISTEN',
    chatComingSoonBody:
      'Pencarian percakapan Tanya Ascend akan hadir di Fase 2. Sambil menunggu, kamu bisa memeriksa semua area berlabel langsung di peta aktif.',
    chatChips: [
      {
        id: 'campuses',
        label: 'DEKAT KAMPUS',
        prompt: 'Di mana mahasiswa bisa membuka kios kopi dekat kampus?',
        hint: 'Tips di peta: gunakan kolom pencarian atau filter Kawasan untuk menelusuri koridor kampus dan membandingkan permintaan mahasiswa dengan kedai aktif.',
      },
      {
        id: 'quiet-blocks',
        label: 'BLOK TENANG SEDIKIT PESAING',
        prompt: 'Tunjukkan blok tenang dengan sedikit pesaing kedai kopi',
        hint: 'Tips di peta: cari heksagon hijau Peluang saat jumlah kedai aktif dalam 500 m berada di bawah kapasitas permintaan sekitar.',
      },
      {
        id: 'low-confidence',
        label: 'AREA KEYAKINAN RENDAH',
        prompt: 'Area mana saja yang memiliki keyakinan data terbuka rendah?',
        hint: 'Tips di peta: heksagon bergaris tepi putih putus-putus menandai Keyakinan rendah karena usaha informal belum tentu tercatat di peta terbuka.',
      },
    ],
    journeyStages: [
      {
        id: 'pioneering' as const,
        step: '01',
        title: 'Merintis',
        subtitle: 'Kios kopi & A-SHOP',
      },
      {
        id: 'expansion' as const,
        step: '02',
        title: 'Bertumbuh',
        subtitle: 'Deretan ruko niaga modern',
      },
      {
        id: 'thriving' as const,
        step: '03',
        title: 'Berjaya',
        subtitle: 'Puncak ikon niaga kota',
      },
    ],
    scrollHint: 'GULIR',
    marketLedgeOpen: 'BUKA',
  },

  marqueeItems: [
    'KIOS',
    'WARUNG',
    'GEROBAK',
    'RUKO',
    'LAPAK',
    'KELONTONG',
    'KAKI LIMA',
    'PASAR',
  ],

  storyShowcase: {
    introWhisper: 'MEMASUKI GRID LINGKUNGAN',
    zoomHint: 'GULIR UNTUK MEMPERLUAS PANDANGAN',
    completeLabel: 'ASCEND · SINYAL LINGKUNGAN TERBUKA',
    skipClip: 'Lewati klip ini',
    ariaLabel: 'Panorama malam kota berbasis gulir',
  },

  background: {
    eyebrow: 'REALITAS DI LAPANGAN',
    rightEyebrow: 'PASOKAN VS PERMINTAAN · ~500 M',
    headlinePrefix: 'Ramai belum tentu',
    headlineAccent: 'ada ruang.',
    body: 'Jalan yang padat sering membuat kita yakin pembeli akan langsung berdatangan. Di balik keramaian itu, pesaing kerap sudah melebihi kapasitas permintaan setempat. Ascend memperlihatkan ruang yang tersisa sebelum kontrak sewa diteken.',
    scaleLeft: 'PADAT',
    scaleCenter: 'SEIMBANG',
    scaleRight: 'PELUANG',
    scaleCaption: 'masih ada ruang di sini',
    scaleFootnote: 'ILUSTRASI PERBANDINGAN ~500 M',
    stages: [
      {
        id: 'crowded' as const,
        label: 'Padat',
        position: 18,
        ratioText: '11 kedai vs ~6 kapasitas',
        pillText: 'ramai, ruang penuh',
        meaning: 'Jalanan ramai, tetapi pesaing sudah melampaui permintaan lokal.',
      },
      {
        id: 'fair' as const,
        label: 'Seimbang',
        position: 50,
        ratioText: '7 kedai vs ~7 kapasitas',
        pillText: 'sesuai permintaan',
        meaning: 'Jumlah kedai aktif berada dalam kisaran normal permintaan setempat.',
      },
      {
        id: 'opportunity' as const,
        label: 'Peluang',
        position: 82,
        ratioText: '3 kedai vs ~8 kapasitas',
        pillText: 'masih ada ruang',
        meaning: 'Kedai lebih sedikit dari kapasitas yang biasanya ditopang sekitar.',
      },
    ],
  },

  blindspots: {
    eyebrow: 'YANG TERSEMBUNYI DI BALIK JALAN',
    headlinePrefix: 'Tiga hal yang kerap luput dari',
    headlineAccent: 'pandangan',
    headlineSuffix: '',
    items: [
      {
        index: '01',
        eyebrow: '01 / PERSAINGAN',
        title: 'Kepadatan yang tak terlihat',
        description:
          'Sebuah ruko tampak lengang dari pinggir jalan, padahal puluhan kedai di gang sekitar sudah berebut kelompok pelanggan yang sama.',
        visualType: 'competition' as const,
      },
      {
        index: '02',
        eyebrow: '02 / PERMINTAAN',
        title: 'Permintaan yang tidak kasatmata',
        description:
          'Pelanggan harian datang dari penduduk, kampus, sekolah, perkantoran, dan titik transit dalam jangkauan jalan kaki, bukan hanya kendaraan yang melintas.',
        visualType: 'demand' as const,
      },
      {
        index: '03',
        eyebrow: '03 / SEWA',
        title: 'Sewa dibayar sebelum kepastian',
        description:
          'Pemilik usaha pemula membayar sewa di muka jauh sebelum cangkir pertama terjual. Membandingkan pasokan vs permintaan lebih dulu mengubah tebakan jadi kejelasan.',
        visualType: 'rent' as const,
      },
    ],
  },

  portal: {
    scrollCue: 'GULIR',
    eyebrow: 'MEMASUKI RUANG DATA TERBUKA',
    leadTitle: 'Selami lebih dalam petanya',
    layerTag: 'LAPISAN DATA TERBUKA · 1.976 AREA',
    title: 'LAPISAN PENGHITUNG',
    subtitle: 'Membaca tiap lingkungan kota dari tempat usaha terbuka, jaringan jalan, dan pemicu permintaan harian.',
  },

  solution: {
    eyebrow: 'CARA ASCEND MENGHITUNG',
    headlinePrefix: 'Ascend yang',
    headlineAccent: 'menghitungkannya.',
    lead: 'Alih-alih menilai sepetak trotoar sempit, Ascend membandingkan kedai aktif terhadap permintaan perkiraan di tiap area beserta enam tetangganya.',
    cardTitle: 'Satu lingkungan, dua cara memandang',
    tabSeen: 'YANG TERLIHAT MATA',
    tabCounted: 'YANG DIHITUNG ASCEND',
    callout: 'area ini + 6 tetangga, sekitar 500 m',
    seenCaption: 'Hanya jalan, deretan toko, dan kesan visual tanpa hitungan pasokan maupun permintaan.',
    legend: [
      { key: 'opportunity', label: 'Peluang', color: '#10B981', type: 'opportunity' as const },
      { key: 'fair', label: 'Seimbang', color: '#F59E0B', type: 'fair' as const },
      { key: 'crowded', label: 'Padat', color: '#EF4444', type: 'crowded' as const },
      { key: 'not_enough_demand', label: 'Permintaan rendah', color: '#64748B', type: 'not_enough_demand' as const },
      { key: 'low_confidence', label: 'Keyakinan rendah', color: '#94A3B8', type: 'low_confidence' as const },
    ],
  },

  features: {
    eyebrow: 'KEMAMPUAN UTAMA',
    headlinePrefix: 'Tujuh cara memilih dengan',
    headlineAccent: 'angka',
    headlineSuffix: ', bukan sekadar ramai.',
    availableBadge: 'TERSEDIA',
    comingSoonBadge: 'SEGERA HADIR',
    items: [
      {
        id: 'labeled-map',
        eyebrow: '01 / PETA INTERAKTIF',
        title: 'Peta berlabel',
        description:
          'Jelajahi hampir dua ribu area heksagon di zona cakupan aktif dengan label aman buta warna serta penanda tingkat keyakinan data.',
        status: 'available' as const,
        cols: 'col-span-6',
        layout: 'horizontal' as const,
        chamfer: true,
        href: '/map',
      },
      {
        id: 'area-card',
        eyebrow: '02 / RINGKASAN AREA',
        title: 'Kartu area',
        description:
          'Klik heksagon mana saja untuk membandingkan kedai dalam 500 m, kapasitas permintaan setempat, dan tiga faktor pendorong utamanya.',
        status: 'available' as const,
        cols: 'col-span-6',
        layout: 'horizontal' as const,
        chamfer: true,
        href: '/map',
      },
      {
        id: 'shortlist',
        eyebrow: '03 / PILIHAN TERSIMPAN',
        title: 'Daftar pendek',
        description:
          'Simpan hingga sepuluh kandidat lokasi secara lokal di browser tanpa akun, lalu lompat kembali hanya dengan satu klik.',
        status: 'available' as const,
        cols: 'col-span-4',
        layout: 'vertical' as const,
        chamfer: false,
        href: '/map',
      },
      {
        id: 'breakeven',
        eyebrow: '04 / SKENARIO BIAYA',
        title: 'Kalkulator balik modal',
        description:
          'Masukkan harga jual per cup, biaya bahan, dan sewa bulananmu sendiri untuk melihat target cup harian di samping tingkat persaingan.',
        status: 'coming_soon' as const,
        cols: 'col-span-4',
        layout: 'vertical' as const,
        chamfer: false,
        href: null,
      },
      {
        id: 'ask-ascend',
        eyebrow: '05 / ASISTEN PETA',
        title: 'Tanya Ascend',
        description:
          'Jelaskan target pembeli dan kecamatan incaranmu agar asisten memfilter area yang sesuai serta mengarahkan tampilan peta.',
        status: 'coming_soon' as const,
        cols: 'col-span-4',
        layout: 'vertical' as const,
        chamfer: false,
        href: null,
      },
      {
        id: 'compare',
        eyebrow: '06 / BANDINGKAN LANGSUNG',
        title: 'Bandingkan area',
        description:
          'Jajarkan dua hingga tiga area pilihan untuk menimbang ruang pasar, tingkat keyakinan data, dan pemicu permintaan lokal.',
        status: 'coming_soon' as const,
        cols: 'col-span-6',
        layout: 'horizontal' as const,
        chamfer: false,
        href: null,
      },
      {
        id: 'rent-check',
        eyebrow: '07 / KONTEKS SEWA',
        title: 'Cek sewa',
        description:
          'Catat penawaran harga sewamu secara privat di browser dan bandingkan dengan ruang pasar setempat sebelum menandatangani kontrak.',
        status: 'coming_soon' as const,
        cols: 'col-span-6',
        layout: 'horizontal' as const,
        chamfer: false,
        href: null,
      },
    ],
  },

  howItWorks: {
    eyebrow: 'METODOLOGI TERBUKA',
    headlinePrefix: 'Empat langkah dari data terbuka ke',
    headlineAccent: 'label.',
    steps: [
      {
        num: '01',
        eyebrow: 'LANGKAH 01',
        title: 'Kumpulkan data terbuka',
        description:
          'Menghimpun usaha aktif, jaringan jalan, fasilitas umum, dan perkiraan penduduk dari sumber peta berlisensi terbuka.',
        icon: 'database' as const,
      },
      {
        num: '02',
        eyebrow: 'LANGKAH 02',
        title: 'Perkirakan daya dukung permintaan',
        description:
          'Mengukur berapa banyak kedai yang biasanya ditopang lingkungan berdasarkan penduduk, kampus, sekolah, kantor, ritel, dan transit.',
        icon: 'compass' as const,
      },
      {
        num: '03',
        eyebrow: 'LANGKAH 03',
        title: 'Bandingkan dan beri label',
        description:
          'Memberi label Peluang atau Padat hanya ketika selisih kedai aktual dan perkiraan permintaan jelas melampaui variasi acak biasa.',
        icon: 'scale' as const,
      },
      {
        num: '04',
        eyebrow: 'LANGKAH 04',
        title: 'Jelaskan dalam bahasa sederhana',
        description:
          'Setiap area menampilkan tiga pendorong permintaan terkuatnya dalam bahasa sehari-hari yang mudah dipahami tanpa jargon statistik.',
        icon: 'message' as const,
      },
    ],
    doesNotTitle: 'Yang tidak dilakukan Ascend',
    doesNotEyebrow: 'BATASAN JUJUR',
    doesNotItems: [
      'Tidak memprediksi omzet, profit, atau peluang bertahan usaha dari data peta.',
      'Bukan nasihat keuangan atau pengganti pengecekan resmi zonasi dan perizinan.',
      'Pedagang informal belum tercatat sepenuhnya di data terbuka (ditandai Keyakinan rendah).',
      'Cakupan berkembang bertahap per wilayah; periksa zona aktif langsung di peta.',
    ],
  },

  team: {
    eyebrow: 'TIM ROSUN GANK · STACK 2026 (GDGoC ITB)',
    headlinePrefix: 'Tim di balik',
    headlineAccent: 'peta ini.',
    members: [
      {
        id: 'aziz',
        initials: 'AG',
        name: 'Azziz Abdul Ghofur',
        roleTag: 'KETUA · BISNIS & PITCH',
        affiliation: 'S1 Teknik Informatika · Angkatan 2023',
        bio: 'Memimpin tim dan sisi bisnis Ascend, merumuskan nilainya bagi pemilik usaha pemula serta cara cerita itu dipresentasikan.',
        theme: 'emerald' as const,
        iconSet: 'business' as const,
        poses: ['/images/team/aziz-1.webp', '/images/team/aziz-2.webp'] as const,
      },
      {
        id: 'april',
        initials: 'AY',
        name: 'Aprilianza Muhammad Yusup',
        roleTag: 'LEAD PRODUK & ML',
        affiliation: 'S1 Teknik Informatika · Angkatan 2023',
        bio: 'Memimpin arah produk dan pemodelan permintaan di 1.976 area terpetakan, mengubah hitungan lingkungan menjadi label Peluang, Seimbang, dan Padat.',
        theme: 'amber' as const,
        iconSet: 'ml' as const,
        poses: ['/images/team/april-1.webp?v=2', '/images/team/april-2.webp?v=2'] as const,
      },
      {
        id: 'bill',
        initials: 'BS',
        name: 'Bill Stephen Sembiring',
        roleTag: 'FRONT-END & UI/UX',
        affiliation: 'S1 Teknik Informatika · Angkatan 2023',
        bio: 'Merancang sistem visual Luhur Signal, peta heksagon interaktif, dan penceritaan gulir agar sinyal lingkungan terbaca dengan mudah.',
        theme: 'violet' as const,
        iconSet: 'frontend' as const,
        poses: ['/images/team/bill-1.webp', '/images/team/bill-2.webp'] as const,
      },
      {
        id: 'nopri',
        initials: 'NS',
        name: 'Nopri Anita Libertiana Saragih',
        roleTag: 'KUALITAS DATA & RISET',
        affiliation: 'S1 Teknik Informatika · Angkatan 2023',
        bio: 'Mengaudit sumber peta terbuka, cakupan jalan, serta pemicu permintaan lokal di seluruh zona studi agar area jarang data tetap ditandai jujur.',
        theme: 'rose' as const,
        iconSet: 'research' as const,
        poses: ['/images/team/nopri-1.webp', '/images/team/nopri-2.webp'] as const,
      },
    ],
  },

  cta: {
    openBadge: 'BUKA',
    eyebrow: 'SIAP KAPAN SAJA',
    headlinePrefix: 'Siap menemukan ruang untuk',
    headlineAccent: 'kedai pertamamu?',
    primaryBtn: 'Buka peta',
    secondaryBtn: 'Lihat cara kerja',
    footnote: 'GRATIS · TANPA AKUN',
  },

  footer: {
    captionChip: 'PERMINTAAN DATANG DARI TEMPAT SEPERTI INI',
    routeNodes: [
      { id: 'campus', label: 'Kampus' },
      { id: 'school', label: 'Sekolah' },
      { id: 'office', label: 'Kantor' },
      { id: 'station', label: 'Stasiun' },
      { id: 'terminal', label: 'Terminal' },
      { id: 'market', label: 'Pasar' },
    ],
    plates: [
      { id: 'open-data', label: 'KHUSUS DATA TERBUKA' },
      { id: 'no-surveys', label: 'TANPA SURVEI' },
      { id: 'no-listings', label: 'TANPA LISTING' },
    ],
    links: [
      { id: 'about' as const, label: 'Tentang' },
      { id: 'licenses' as const, label: 'Data & lisensi' },
      { id: 'privacy' as const, label: 'Privasi' },
    ],
    dataSourcesLine:
      'SUMBER DATA: KONTRIBUTOR OPENSTREETMAP · OVERTURE MAPS FOUNDATION · WORLDPOP · OPENFREEMAP / OPENMAPTILES',
    disclaimer: 'Perkiraan berbasis data terbuka. Bukan nasihat keuangan.',
    thanks: 'Terima kasih',
  },

  mapPage: {
    backToHome: 'Beranda',
    sampleBadge: 'Data contoh',
    coffeeWithin500m: 'Kedai kopi dalam sekitar 500 m',
    demandSupports: 'Permintaan biasanya menopang sekitar',
    drivesTitle: 'Yang mendorong permintaan di titik ini',
    cardFootnote:
      'Perkiraan berbasis data terbuka. Bukan nasihat keuangan. Periksa zonasi dan perizinan lewat sumber resmi sebelum menyewa.',
    saveShortlist: 'Simpan ke daftar',
    savedShortlist: 'Tersimpan ✓',
    shortlistTitle: 'Daftar pendek',
    shortlistEmptyTitle: 'Belum ada area tersimpan',
    shortlistEmptyBody:
      'Klik heksagon mana saja di peta untuk membuka kartu area, lalu simpan hingga 10 kandidat lokasi di sini.',
    unnamedArea: 'Area tanpa nama',
    retry: 'Coba lagi',
    loadError: 'Gagal memuat data peta Ascend. Periksa koneksimu atau muat ulang dataset.',
  },
} as const

export const SETTINGS_COPY: Record<
  AscendLocale,
  {
    eyebrow: string
    title: string
    titleAccent: string
    subtitleHome: string
    subtitleMap: string
    languageTitle: string
    languageHint: string
    themeTitle: string
    themeHint: string
    themeDark: string
    themeDarkDesc: string
    themeLight: string
    themeLightDesc: string
    defaultBadge: string
    experienceTitle: string
    calmMotionLabel: string
    calmMotionDesc: string
    mapPrefsTitle: string
    hoverPreviewLabel: string
    hoverPreviewDesc: string
    autoZoomLabel: string
    autoZoomDesc: string
    neighborRingLabel: string
    neighborRingDesc: string
    privacyTitle: string
    privacyNote: string
    clearShortlistBtn: string
    clearShortlistConfirm: string
    clearShortlistCancel: string
    clearShortlistYes: string
    shortlistCleared: string
    closeBtn: string
    navTooltip: string
    navTooltipHintHome: string
    navTooltipHintMap: string
  }
> = {
  en: {
    eyebrow: 'PREFERENCES · LOCAL BROWSER',
    title: 'Ascend',
    titleAccent: 'Settings',
    subtitleHome: 'Customize your language and motion comfort across Ascend.',
    subtitleMap: 'Customize language, map interface theme, and reading helpers.',
    languageTitle: 'Language',
    languageHint: 'Switch interface wording between English and Bahasa Indonesia.',
    themeTitle: 'Map Interface Theme',
    themeHint: 'Applies to the interactive map workspace only (homepage & loader stay dark).',
    themeDark: 'Dark',
    themeDarkDesc: 'Obsidian night surface',
    themeLight: 'Light',
    themeLightDesc: 'Crisp pearl daylight UI',
    defaultBadge: 'DEFAULT',
    experienceTitle: 'Motion & Comfort',
    calmMotionLabel: 'Calm animations',
    calmMotionDesc: 'Soften ambient motion and floating glow pulses for extra focus.',
    mapPrefsTitle: 'Map Reading Helpers',
    hoverPreviewLabel: 'Hover preview card',
    hoverPreviewDesc: 'Show a floating summary popover when gliding over hexagons.',
    autoZoomLabel: 'Auto zoom on select',
    autoZoomDesc: 'Smoothly zoom in when you click a hexagon on the map.',
    neighborRingLabel: '~500 m neighbor ring',
    neighborRingDesc: 'Outline the 6 surrounding neighbor hexagons when an area is selected.',
    privacyTitle: 'Local Privacy & Storage',
    privacyNote: 'All preferences and shortlist spots stay strictly in your browser. Zero accounts or tracking.',
    clearShortlistBtn: 'Clear saved shortlist',
    clearShortlistConfirm: 'Remove all saved areas from your browser shortlist?',
    clearShortlistCancel: 'Cancel',
    clearShortlistYes: 'Clear all',
    shortlistCleared: 'Shortlist cleared.',
    closeBtn: 'Done',
    navTooltip: 'Settings',
    navTooltipHintHome: 'Language & motion',
    navTooltipHintMap: 'Language, theme & map',
  },
  id: {
    eyebrow: 'PREFERENSI · LOKAL DI BROWSER',
    title: 'Pengaturan',
    titleAccent: 'Ascend',
    subtitleHome: 'Atur bahasa tampilan dan kenyamanan animasi di seluruh Ascend.',
    subtitleMap: 'Atur bahasa, mode antarmuka peta, serta alat bantu pembacaan peta.',
    languageTitle: 'Bahasa',
    languageHint: 'Ganti bahasa antarmuka antara English dan Bahasa Indonesia.',
    themeTitle: 'Mode Tampilan Peta',
    themeHint: 'Khusus untuk antarmuka peta interaktif (beranda & layar muat tetap gelap).',
    themeDark: 'Gelap',
    themeDarkDesc: 'Obsidian malam elegan',
    themeLight: 'Terang',
    themeLightDesc: 'Tampilan terang bersih',
    defaultBadge: 'BAWAAN',
    experienceTitle: 'Animasi & Kenyamanan',
    calmMotionLabel: 'Mode animasi tenang',
    calmMotionDesc: 'Redam animasi latar dan denyut cahaya agar tampilan lebih fokus.',
    mapPrefsTitle: 'Bantuan Baca Peta',
    hoverPreviewLabel: 'Kartu pratinjau hover',
    hoverPreviewDesc: 'Tampilkan ringkasan melayang saat kursor melewati heksagon.',
    autoZoomLabel: 'Zoom otomatis saat klik',
    autoZoomDesc: 'Perbesar peta otomatis saat memilih sebuah heksagon.',
    neighborRingLabel: 'Cincin 6 tetangga (~500 m)',
    neighborRingDesc: 'Tandai batas 6 heksagon tetangga di sekitar area yang dipilih.',
    privacyTitle: 'Privasi & Penyimpanan Lokal',
    privacyNote: 'Seluruh pengaturan dan daftar pendek tersimpan hanya di browser ini. Tanpa akun atau pelacakan.',
    clearShortlistBtn: 'Hapus semua daftar pendek',
    clearShortlistConfirm: 'Hapus seluruh area tersimpan dari daftar pendek di browser ini?',
    clearShortlistCancel: 'Batal',
    clearShortlistYes: 'Hapus semua',
    shortlistCleared: 'Daftar pendek dikosongkan.',
    closeBtn: 'Selesai',
    navTooltip: 'Pengaturan',
    navTooltipHintHome: 'Bahasa & animasi',
    navTooltipHintMap: 'Bahasa, tema & peta',
  },
}
