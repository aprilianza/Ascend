# PRD: Ascend, Peta Permintaan vs Persaingan untuk Usaha Makanan Baru di Bandung

**Tim:** Rosun Gank · **Lomba:** STACK 2026 (GDGoC ITB) · **Case:** Case 2, Stronger Communities and Everyday Services
**Status:** Draf v3.1 (versi bahasa Indonesia) · **Terakhir diperbarui:** 24 Nov 2026 · **Versi sebelumnya:** v3 (24 Nov), v2 (22 Nov), v1 (21 Nov)

> **Dokumen acuan tunggal.** File ini menggantikan `tasks/archive/prd-ascend.md` dan `tasks/archive/prd-ascend-id.md`. Kalau ada perbedaan, yang berlaku adalah file ini.

> Catatan bahasa: dokumen ini untuk internal tim. Istilah teknis, nama field, kode, dan teks antarmuka sengaja dibiarkan dalam bahasa Inggris karena aplikasi, proposal, video, dan pitching wajib berbahasa Inggris [5].

---

## 0. Apa yang berubah di v3 (baca ini dulu)

| # | Bagian | v2 | v3 | Alasan |
|---|---|---|---|---|
| 1 | Soal uang | Non-goal: tidak memprediksi omzet, profit, atau peluang bertahan | Tetap tidak ada prediksi dari data peta, **tetapi** ada kalkulator balik modal (break-even) dan masa balik modal berdasarkan angka pengguna sendiri (US-022) | Data terbuka tidak punya data penjualan maupun riwayat tutup usaha di Bandung, dan handbook melarang bukti karangan [5]. Kalkulator skenario menjawab "berapa cup yang harus saya jual di sini?" secara jujur (§1.1). |
| 2 | Konsep Loconomics | Belum dipertimbangkan | 17 konsep ditinjau: 9 dibawa dalam bentuk yang disesuaikan, 8 tidak dibawa (§14), lengkap dengan pengaman orisinalitas | Handbook melarang entri lomba sebelumnya diajukan ulang, diganti nama, atau dikemas ulang [5]. Yang dibawa hanya ide umum; tidak ada kode, data, teks, desain, atau nama fitur. |
| 3 | Chat (US-017) | Menjawab dengan chip area | Juga menggerakkan peta: pindah ke area, menyorot, memfilter, membuka perbandingan, menjalankan kalkulator | Disesuaikan dari ide "konsultan yang menggerakkan peta"; alur utama lebih mudah didemokan (Functionality 30% di final) [5]. |
| 4 | Kecocokan jenis usaha (US-023 baru) | Tidak ada | Kartu area menampilkan label coffee shop dan eatery berdampingan setelah model eatery jadi | Disesuaikan dari ide "rekomendasi jenis usaha"; tidak butuh model baru. |
| 5 | Jangkauan jalan kaki (US-024 baru) | Hanya k-ring | Tambahan P2 (stretch): pesaing dalam 5 menit jalan kaki menurut jaringan jalan asli | Disesuaikan dari ide isochrone jalan kaki; rel, sungai, dan jalan tol memutus rute pejalan kaki. |
| 6 | Sewa (US-020, US-021) | Harga dari pengguna + pembanding | Ditambah pengecekan sewa vs ruang pasar di tampilan perbandingan, dan fitur opsional "baca harga sewa dari foto" | Disesuaikan dari ide biaya vs potensi dan foto ke angka, hanya memakai data pengguna sendiri. |
| 7 | Rubrik | Baru sebagian dipetakan | Pemetaan lengkap rubrik semifinal dan final ke item PRD (§15) | Setiap fitur harus jelas mendapat nilai dari mana. |
| 8 | Pembaruan handbook | Handbook lama | Tautan template deklarasi, pitching 10 + 10 menit, deck maksimal 15 slide; rencana harian disusun ulang mulai 24 Nov | Handbook terbaru [5]. |

Aturan cakupan v3: **tidak ada tambahan baru yang masuk Fase 1.** Semua tambahan v3 masuk P2 atau P3, supaya daftar Must untuk semifinal tetap realistis.

### Status implementasi pipeline (25 Nov, data v1)

US-000, US-002 sampai US-008, dan US-006a selesai; detail di `docs/model_report.md` dan `pipeline/data/SOURCES.md`. Temuan dari data asli yang **mengubah** ketentuan di bawah (proposal harus memakai versi ini):

| # | Ketentuan PRD | Yang terjadi di data asli | Keputusan |
|---|---|---|---|
| 1 | US-003: hanya `operating_status = 'open'` | 79.931 dari 80.052 tempat Overture tidak punya status (null); hanya 119 yang `open` | Ambil `open` + null; buang hanya yang berstatus closed. Dicatat sebagai keterbatasan |
| 2 | US-006: uji Poisson k-ring 1 | Over-dispersion: dispersi Pearson 2,76 pada k-ring 1 | Sesuai pemicu §7.2, label memakai **uji negative binomial** (`negbin_kring1`, dispersi 0,127). Data contract naik ke v1.1.0 (tambahan, UI tidak berubah). Hasil: 18 opportunity, 142 crowded, 1.696 fair, 120 not_enough_demand |
| 3 | US-006: tidak ada label di atas 60% | `fair` 85,8%; alpha 0,01 sampai 0,10 tidak bisa menurunkannya di bawah 60% | Alpha tetap 0,05; opportunity + crowded 8,1% (target 5 sampai 35% terpenuhi). Alasan di `model_report.md` §3 |
| 4 | US-001: Python 3.11 | Dikembangkan di Python 3.12 | Kode kompatibel ≥ 3.11 (`pyproject.toml`); versi library dikunci di `requirements.txt` |
| 5 | §10 | Script simulasi dijalankan | Tabel §10 diganti dengan output script (seed 42) |

Belum selesai dari bagian April: cek sampel 30 data (US-003, formulir `docs/sample_check_coffee.csv`, dikerjakan Nopri). US-016, US-023, US-024 adalah P2 (setelah semifinal).

### Revisi v3.1 (24 Nov, hasil review)

| # | Bagian | Masalah di v3 | Perbaikan di v3.1 |
|---|---|---|---|
| 1 | §0, US-021, D8 | Mengutip kalimat abstrak yang tidak ada di PDF abstrak | Kutipan diganti dengan isi abstrak yang sebenarnya; harga sewa dari pengguna dan pembanding publik ditandai sebagai **cakupan baru** yang harus dijelaskan di proposal |
| 2 | US-018, §8 | Metrik "jumlah pilihan berlabel `crowded`" sirkular | Pilihan dinilai terhadap hasil cek lapangan (US-019), bukan label Ascend |
| 3 | §10 | `docs/sim_labels.py` belum ada | Script wajib ada dan bisa dijalankan ulang sebelum tabel dikutip di proposal (US-006a) |
| 4 | US-007, US-011 | SHAP menjelaskan heksagon pusat, kartu menampilkan k-ring; cek aditivitas dan catatan skala log hilang | Faktor diberi judul yang jelas; cek aditivitas dan catatan skala log dikembalikan |
| 5 | US-002 s/d US-004, Lampiran A | Efek tepi: heksagon di batas wilayah kehilangan tetangga dan POI di luar batas; bbox bisa memotong Bojongsoang | Data diambil dengan buffer 1 km; label hanya untuk heksagon di dalam wilayah; bbox dihitung dari batas wilayah |
| 6 | US-003, US-006 | Kriteria dedup dan definisi POI lebih kabur dari v2 | Dikembalikan ke definisi v2 (`rapidfuzz`, definisi mapped POI) |
| 7 | §4 | Penomoran FR loncat; FR-13 s/d 18 merujuk ke v1 | FR ditulis lengkap dan dinomori ulang berurutan |
| 8 | §8 | Target kecepatan peta untuk 30 Nov padahal US-014 berstatus Should | Target berlaku untuk build yang dideploy atau build lokal |
| 9 | §9 | D1, D2, D4, D8 mengubah jawaban 22 Nov tanpa catatan | Kolom "Berubah dari 22 Nov" ditambahkan; D4 direkonsiliasi (fast food lokal masuk, chain keluar) |
| 10 | §11, §14 | Ketentuan handbook terbaru belum ada di folder; pemberitahuan ke tim Loconomics hanya "sebaiknya" | Catatan verifikasi handbook; pemberitahuan wajib sebelum deklarasi ditandatangani |

### Perubahan dari v1 ke v2 (disimpan sebagai referensi)

| # | Bagian | v1 | v2 | Alasan |
|---|---|---|---|---|
| 1 | Kategori Overture (US-003) | Filter memakai `categories` (`coffee_shop`, `cafe`) | Filter memakai `taxonomy.hierarchy` / `taxonomy.primary`; hanya `operating_status = 'open'` | Overture menghapus properti `categories` dari skema places sejak rilis September 2026 [1][2]. Kode v1 akan gagal di rilis terbaru. |
| 2 | Label (US-006) | Per heksagon `gap ≥ 1 & ratio ≤ 0.67` | Uji Poisson pada k-ring 1 (heksagon + 6 tetangga), alpha 0,05, ditambah gap minimal | Simulasi (§10): aturan v1 memberi label opportunity/crowded ke sekitar 25% heksagon bahkan saat pasokan sama dengan permintaan. Aturan Poisson k-ring menurunkan label palsu ke sekitar 6% dan presisinya kira-kira dua kali lipat. |
| 3 | SHAP (US-007) | SHAP dari model final yang dilatih dengan semua data | SHAP dari model fold yang sama dengan yang menghasilkan estimasi out-of-fold (OOF) heksagon itu | Kartu menampilkan angka OOF; alasannya harus dari model yang sama, kalau tidak angka dan alasan bisa bertentangan. |
| 4 | Area Telkom (US-002) | Lingkaran 3 km | Poligon Kecamatan Dayeuhkolot + Bojongsoang | Label administratif jelas, mencakup kawasan kos mahasiswa (Sukapura, Sukabirus, Lengkong, Cipagalo). |
| 5 | Layer sewa (US-021) | Hanya formulir dari pemilik | Harga dari pengguna (disimpan di browser) + pembanding publik yang diizinkan + sampel pemilik yang setuju | Abstrak hanya menyebut *"Rental samples will come only from owners who give permission"* dan *"rental layer on Final Day"*. Harga sewa yang dimasukkan pengguna sendiri tetap sesuai semangat itu (datanya milik pengguna), tetapi pembanding publik adalah **cakupan baru** dan harus disebut sebagai perluasan di proposal, bukan sebagai janji abstrak. *(Dikoreksi di v3.1: v3 mengutip kalimat yang tidak ada di abstrak.)* Syarat Rumah123 melarang membangun basis data properti dari listing-nya [3], jadi data listing butuh izin tertulis. |
| 6 | Chat (US-017) | Umum | Menjelaskan cara "budget" dan "target customers" dipakai; tanpa data pribadi; syarat Gemini dicatat | Abstrak menjanjikan personalisasi berdasarkan budget, target pembeli, dan kecamatan. Tier gratis Gemini memakai prompt untuk mengembangkan produk Google dan melarang aplikasi yang kemungkinan dipakai orang di bawah 18 tahun [4]. |
| 7 | Cakupan Fase 1 | 14 story, semua wajib sebelum 30 Nov | Dibagi Must / Should + rencana harian | Handbook menyebut produk jadi belum diwajibkan di semifinal; yang dinilai proposal dan video [5]. |
| 8 | Bagian baru | Tidak ada | Deliverable semifinal (§11), pemetaan proposal, privasi, pembagian tugas, arsitektur dan trade-off | Rubrik Execution and Validation 20% meminta milestone, peran, pengujian, risiko, dan rencana Final Day [5]. |

---

## 1. Pengantar dan Gambaran Umum

Orang yang membuka usaha makanan atau minuman kecil di Bandung sering memilih lokasi berdasarkan intuisi: jalan yang kelihatan ramai, saran teman, atau tempat yang kebetulan kosong. Mereka tidak bisa melihat apakah di area itu jumlah usaha sejenis sudah melebihi yang biasanya bisa ditampung permintaan setempat, dan baru tahu setelah membayar sewa.

**Ascend** adalah peta web gratis yang menunjukkan di mana coffee shop baru (dan nanti, warung makan kecil) masih punya ruang. Peta membagi wilayah studi menjadi heksagon H3 (sekitar 0,105 km² per sel). Untuk setiap heksagon, Ascend:

1. Menghitung berapa coffee shop yang **sudah beroperasi** di heksagon itu dan 6 tetangganya (data peta terbuka).
2. Memperkirakan berapa coffee shop yang biasanya bisa ditampung oleh **permintaan** di lingkungan itu (penduduk, kampus, sekolah, kantor, akses transportasi), memakai model hitungan LightGBM.
3. Menguji apakah selisihnya lebih besar dari variasi acak biasa, lalu memberi label **"opportunity"**, **"fair"**, atau **"crowded"**, beserta tiga alasan terkuat di balik estimasi itu.

Pengguna memilih jenis usaha, menjelajahi peta berlabel, membuka kartu area yang menjelaskan labelnya, lalu menyimpan daftar pendek. Fase berikutnya menambahkan asisten chat yang mempersonalisasi daftar dan menggerakkan peta, kalkulator balik modal berdasarkan angka pengguna, tampilan perbandingan, dan layer sewa.

| Fase | Waktu | Yang dikirim |
|---|---|---|
| **P1 Semifinal** | 22 sampai 30 Nov 2026 | Pipeline data, model coffee shop, peta web statis dengan kartu area (Must); daftar pendek, panel About, deployment (Should) |
| **P2 Pra-Final** | 1 sampai 15 Des 2026 | Backend FastAPI, model eatery, asisten chat dengan aksi peta, kalkulator balik modal, kecocokan jenis usaha, studi validasi pengguna, cek lapangan |
| **P3 Final Day** | 16 Des 2026 (build session) | Tampilan perbandingan dengan pengecekan sewa vs ruang pasar, layer sewa (fitur foto sebagai stretch) |

Pengumuman Top 10 tanggal 7 Des; masa resmi pengembangan produk 7 sampai 16 Des [5]. Handbook tidak melarang lanjut bekerja antara 1 dan 6 Des, jadi P2 dimulai langsung setelah pengumpulan semifinal. Jaga riwayat commit apa adanya; panitia bisa meminta riwayat pengembangan [5].

> **Pengingat aturan lomba:** fitur yang masih direncanakan tidak boleh ditampilkan sebagai sudah selesai. Semua yang belum dibangun diberi tanda "Coming soon" di antarmuka, dicatat sebagai Planned di README, dan disebut sebagai sisa pekerjaan di video [5].

### 1.1 Kenapa Ascend tidak memprediksi omzet, profit, atau peluang bertahan, dan apa penggantinya

**Kenapa tidak diprediksi dari data peta**

- **Tidak ada data untuk belajar.** Prediksi omzet per area butuh data penjualan atau belanja per area. Data peta terbuka tidak punya itu. Loconomics berencana mendapat data belanja dan harga menu lewat survei lapangan dengan aplikasi yang disediakan lombanya sendiri; Ascend tidak punya data seperti itu, dan data survei itu milik proyek Loconomics.
- **Tidak ada riwayat tutup usaha.** Prediksi peluang bertahan butuh data buka dan tutup usaha per area selama bertahun-tahun. `operating_status` di Overture bisa menandai sebagian tempat yang sudah tutup, tetapi tidak menyimpan riwayatnya. US-000 menghitungnya, tetapi itu tidak cukup untuk melatih atau memvalidasi model peluang bertahan.
- **Aturan lomba.** Temuan riset dan hasil uji harus dilaporkan akurat, dan bukti karangan dilarang [5]. Angka omzet per heksagon yang tidak bisa divalidasi adalah klaim yang tidak bisa diuji, dan juri boleh bertanya ke anggota mana pun bagaimana angka itu dihitung [5].
- **Abstrak tidak pernah menjanjikannya.** Menambahkannya sekarang justru memperlebar jarak antara abstrak dan proposal (Communication 10%).

**Penggantinya: kalkulator skenario (US-022)**

Pengguna memasukkan angkanya sendiri; Ascend menghitung dan menaruh hasilnya di samping gambaran persaingan area itu. Rumus standarnya: titik impas (unit) = biaya tetap ÷ (harga per unit − biaya variabel per unit) [15].

Contoh dari panduan yang terbit di Indonesia [16]: harga Rp18.000 per cup, biaya variabel Rp8.000 per cup, biaya tetap Rp6.000.000 per bulan → kontribusi Rp10.000 per cup → 600 cup per bulan → **20 cup per hari** untuk 30 hari buka. Di kartu, ini muncul sebagai: "You need about 20 cups a day to break even. This area is *crowded*: 9 coffee shops within about 500 m, where demand typically supports about 5." Angka dalam kalimat contoh itu hanya ilustrasi.

Ascend tidak pernah menyebut berapa cup yang *akan* terjual. Pengguna yang menilai apakah target itu realistis, dan peta menunjukkan seberapa berat persaingannya.

### Glosarium

| Istilah | Arti |
|---|---|
| **H3** | Grid heksagon dari Uber. Setiap heksagon punya ID berupa teks. Kita memakai **resolusi 9**: luas rata-rata 0,105 km², panjang sisi rata-rata sekitar 200 m. |
| **k-ring** | Satu heksagon beserta tetangganya sampai *k* langkah. `k=1` = heksagon + 6 tetangga, sekitar 0,74 km²: semua yang berada kira-kira dalam 500 m (6 menit jalan kaki) dari pusatnya. |
| **Actual count** | Jumlah coffee shop yang saat ini tercatat di peta di dalam heksagon (atau di dalam k-ring-nya, bila disebutkan). |
| **Expected count** | Jumlah coffee shop yang diprediksi model hanya dari fitur permintaan. |
| **Gap** | `expected − actual` pada k-ring. Positif = masih ada ruang; negatif = jumlah usaha melebihi yang biasanya ditampung permintaan. |
| **Prediksi OOF (out-of-fold)** | Prediksi untuk sebuah heksagon yang dibuat oleh model yang tidak melihat area heksagon itu saat dilatih. |
| **SHAP** | Menunjukkan seberapa besar setiap fitur menaikkan atau menurunkan satu prediksi. |
| **Fitur permintaan** | Menggambarkan calon pembeli (penduduk, mahasiswa, pekerja, komuter). Tidak pernah berupa jumlah usaha makanan. |

---

## 2. Tujuan

- **G-1:** Setiap heksagon di wilayah studi (Kota Bandung + Dayeuhkolot + Bojongsoang) punya label coffee shop paling lambat 30 Nov 2026.
- **G-2:** Setiap label dijelaskan dengan 3 faktor utama dalam bahasa Inggris sederhana.
- **G-3:** Pengguna baru bisa dari membuka situs sampai menyimpan daftar 3 area dalam waktu kurang dari 2 menit.
- **G-4:** Model permintaan mengalahkan baseline yang hanya memakai jumlah penduduk pada error validasi silang spasial (§8), dan metriknya dicantumkan di proposal.
- **G-5:** Area dengan keyakinan rendah ditandai secara jujur (data terbuka tidak mencatat pedagang informal).
- **G-6:** Pipeline bisa diulang dari data mentah dengan satu perintah per tahap.
- **G-7 (kesesuaian Case 2):** Menunjukkan perbaikan yang realistis seperti yang diminta handbook: memilih lokasi lebih cepat, lebih sedikit memilih area padat, dan penanganan data pengguna yang hati-hati [5].

---

## 3. User Story

Pengguna utama: **pemilik usaha makanan atau minuman kecil yang baru pertama kali membuka usaha di Bandung** (misalnya mahasiswa yang membuka kios kopi) dan tidak mampu membayar jasa analisis lokasi profesional.
Pengguna sekunder: **developer** yang membangun dan merawat pipeline.

Label prioritas: **[Must]** wajib untuk video dan proposal semifinal; **[Should]** dikerjakan kalau waktu cukup sebelum 30 Nov; **[P2]** / **[P3]** fase berikutnya.

### Fase 1 (22 sampai 30 Nov 2026)

#### US-000 [Must]: Cek kategori asli sebelum menulis filter
**Deskripsi:** Sebagai developer, saya perlu melihat label taxonomy Overture dan tag OSM yang benar-benar ada di Bandung sebelum menetapkan konfigurasi kategori.

**Kriteria penerimaan:**
- [ ] Jalankan query di Lampiran A pada rilis Overture terbaru untuk bounding box wilayah studi; simpan hasilnya (label utama, hierarki, jumlah) ke `docs/category_check.csv`
- [ ] Lakukan hal yang sama untuk OSM `amenity=cafe|restaurant|fast_food|food_court` dan nilai `cuisine=*`
- [ ] Tim menyepakati daftar include/exclude final (lihat §9, keputusan D3 dan D4) dan menuliskannya ke `pipeline/config/categories.yaml`
- [ ] Konfirmasi skema: catat di `pipeline/data/SOURCES.md` apakah rilis yang dipakai memang sudah tidak punya `categories` dan memakai `taxonomy` [1][2]. Bila ternyata `categories` masih ada, filter tetap memakai `taxonomy` (bila tersedia) dan perbedaannya dicatat

#### US-001 [Must]: Repositori dan struktur proyek
**Kriteria penerimaan:**
- [ ] Repositori Git dengan folder `pipeline/`, `web/`, `api/` (placeholder), `docs/`
- [ ] `.gitignore` mengecualikan data mentah, `.env`, virtual environment, `node_modules/`, hasil build
- [ ] `.env.example` mencantumkan semua variabel tanpa nilai asli
- [ ] `README.md` di root: ringkasan, cara setup `pipeline/` dan `web/`, sumber data beserta lisensinya, bagian **AI assistance** (alat dan perannya), tabel **Status** (Done / In progress / Planned)
- [ ] Dependensi Python 3.11 dikunci versinya; `ruff check pipeline/` lolos

#### US-002 [Must]: Wilayah studi dan grid H3
**Kriteria penerimaan:**
- [ ] Batas Kota Bandung, Dayeuhkolot, dan Bojongsoang diambil dari batas administratif OSM (atau Overture divisions), disimpan di `pipeline/data/boundaries/`; `area_name` bernilai `kota_bandung` atau `telkom_area`
- [ ] Gabungan wilayah diisi sel H3 resolusi 9 → `pipeline/data/processed/grid.parquet` dengan kolom `h3`, `area_name`, `kecamatan`, `in_study_area`
- [ ] **Buffer tepi:** grid juga mencakup sel dalam jarak 1 km di luar batas wilayah (`in_study_area = false`). Sel buffer dipakai untuk menghitung jumlah k-ring dan fitur heksagon di tepi, tetapi tidak diberi label dan tidak ditampilkan di peta. Tanpa buffer, heksagon di batas wilayah kehilangan tetangga dan terlihat lebih sepi dari kenyataan
- [ ] Bounding box untuk semua query data (Overture, OSM, WorldPop) = bbox gabungan batas wilayah + 1 km, dihitung dari poligon dan disimpan di `pipeline/config/area.yaml`; tidak memakai angka bbox yang diketik tangan
- [ ] Script mencetak jumlah sel di dalam wilayah (`in_study_area = true`). **Perkiraan sekitar 1.950** ((167,31 + 11,03 + 27,81) km² ÷ 0,105 km²) [6][7]; jumlah di luar rentang 1.700 sampai 2.200 berarti batas wilayahnya salah. Jumlah sel buffer dicetak terpisah
- [ ] Peta pratinjau disimpan ke `docs/figures/grid.png`
- [ ] Lint lolos

#### US-003 [Must]: Lokasi coffee shop (data target)
**Kriteria penerimaan:**
- [ ] Overture Places di-query dengan DuckDB untuk bounding box wilayah studi + buffer 1 km (US-002); nama rilis dicatat di `pipeline/data/SOURCES.md`
- [ ] Filter memakai `taxonomy` (bukan `categories`, yang sudah tidak ada) sesuai daftar di `categories.yaml` (keputusan D3)
- [ ] Hanya ambil `operating_status = 'open'` (nilai null dihitung terpisah) dan `confidence ≥ 0.5` (bisa diatur)
- [ ] OSM `amenity=cafe` diunduh untuk bounding box yang sama (`internet_cafe` adalah tag terpisah dan tidak ikut)
- [ ] Duplikat antarsumber digabung: dua data berjarak maksimal **30 m** dihitung satu bila `rapidfuzz.fuzz.token_set_ratio(name_a, name_b) ≥ 80` setelah nama dinormalisasi (huruf kecil, tanda baca dibuang, kata umum seperti "kopi", "coffee", "cafe", "kedai" dibuang). Data tanpa nama hanya digabung bila berjarak maksimal 10 m
- [ ] Output `coffee_shops.parquet`: `id`, `name`, `lat`, `lon`, `source`, `h3`, `taxonomy_primary`
- [ ] Mencetak jumlah sebelum dan sesudah penghapusan duplikat per sumber
- [ ] **Cek sampel:** 30 data acak dicek lewat citra jalanan atau kunjungan langsung; tingkat kesalahan ditulis di `docs/model_report.md` (target ≤ 15%)
- [ ] Lint lolos

#### US-004 [Must]: Fitur permintaan per heksagon
**Kriteria penerimaan:**
- [ ] Penduduk: WorldPop Global2 R2025A, Indonesia, 100 m constrained, **tahun 2026** (keputusan D5), dijumlahkan per heksagon → `pop`
- [ ] Jumlah per heksagon dari OSM (dan Overture bila OSM tipis): universitas/kampus, sekolah, kantor, halte bus/angkot dan peron, stasiun kereta
- [ ] Jumlah k-ring untuk `k=1` dan `k=2` (`pop_k1`, `pop_k2`, `campus_k2`, dan seterusnya)
- [ ] Jarak: `dist_campus_m`, `dist_station_m`
- [ ] **Tidak ada jumlah usaha makanan atau minuman sebagai fitur**; script gagal bila ada nama kolom yang mengandung `cafe`, `coffee`, `restaurant`, `food`, atau `eatery`
- [ ] Fitur dihitung untuk semua sel termasuk sel buffer (US-002), supaya jumlah k-ring heksagon di tepi wilayah tidak terpotong
- [ ] Output `features.parquet`, satu baris per `h3`, tanpa nilai kosong
- [ ] Lint lolos

#### US-005 [Must]: Model permintaan dengan validasi silang spasial
**Kriteria penerimaan:**
- [ ] Regressor LightGBM, `objective="poisson"`, target = jumlah coffee shop aktual per heksagon
- [ ] `GroupKFold` 5 fold, grup = induk H3 resolusi 7 (sekitar 5,2 km² per grup, sekitar 40 grup)
- [ ] Baseline: Poisson GLM dengan `log1p(pop_k1)` memakai fold yang sama
- [ ] Metrik untuk keduanya: rata-rata Poisson deviance, MAE, korelasi Spearman (expected vs actual)
- [ ] Expected count setiap heksagon = prediksi OOF-nya
- [ ] **Kelima model fold disimpan** (`pipeline/models/coffee_shop_fold{0..4}.lgb`) beserta tabel fold untuk setiap heksagon (dibutuhkan US-007)
- [ ] Metrik ditulis di `docs/model_report.md` dan `pipeline/models/metrics.json`; random seed dikunci
- [ ] Lint lolos

#### US-006 [Must]: Gap, label, dan tingkat keyakinan
**Deskripsi:** Sebagai pengguna, saya ingin setiap area diberi label sederhana, dan labelnya benar-benar bermakna, bukan sekadar kebetulan acak.

**Kriteria penerimaan:**
- [ ] Untuk setiap heksagon, hitung pada k-ring 1: `A` = jumlah aktual, `E` = jumlah expected OOF, `gap = E − A`
- [ ] Label (parameter di `pipeline/config/labels.yaml`):
  - `opportunity` jika `P(X ≤ A | Poisson(E)) < alpha` **dan** `gap ≥ min_gap`
  - `crowded` jika `P(X ≥ A | Poisson(E)) < alpha` **dan** `gap ≤ −min_gap`
  - `fair` untuk selain itu
  - nilai bawaan: `alpha = 0.05`, `min_gap = 1.0`
- [ ] `not_enough_demand` (abu-abu) jika `pop_k1` di bawah persentil ke-10 **dan** `E < 0.3`; label ini menggantikan "opportunity"
- [ ] `confidence = low` jika k-ring 1 berisi kurang dari 3 mapped POI (bisa diatur). **Mapped POI** = semua tempat Overture (semua kategori, setelah filter `confidence` dan `operating_status`) ditambah semua node/way OSM yang punya tag `amenity`, `shop`, atau `office`, dengan duplikat digabung seperti di US-003
- [ ] Label hanya dihitung untuk heksagon dengan `in_study_area = true`; sel buffer ikut dijumlahkan ke k-ring tetangganya
- [ ] Mencetak proporsi tiap label. Target kewajaran: tidak ada satu label pun di atas 60%; opportunity + crowded bersama-sama antara 5% dan 35%. Jika di luar itu, setel `alpha` (0,01 sampai 0,10) dan catat nilai akhir beserta alasannya di `docs/model_report.md`
- [ ] Contoh: `A = 0`, `E = 4.2` → P(X ≤ 0) = 0,015 < 0,05 dan gap 4,2 → `opportunity`. `A = 0`, `E = 1.5` → P = 0,22 → `fair` (bisa saja kebetulan)
- [ ] Lint lolos

#### US-006a [Must]: Script simulasi aturan label (bukti untuk §10)
**Deskripsi:** Sebagai tim, kami perlu script simulasi yang benar-benar ada dan bisa dijalankan ulang, karena tabel §10 akan dikutip di proposal dan handbook melarang bukti yang tidak bisa ditunjukkan.

**Kriteria penerimaan:**
- [ ] `docs/sim_labels.py` ada di repositori, memakai random seed tetap, dan mencetak tabel yang sama dengan §10 (skenario A dan B, ketiga aturan)
- [ ] Parameter simulasi (jumlah heksagon, rata-rata permintaan, proporsi kantong) ditulis di bagian atas script dan dijelaskan di `docs/model_report.md`
- [ ] Bila hasil jalan ulang berbeda dari angka di §10, angka di §10 diperbarui mengikuti hasil script, bukan sebaliknya
- [ ] Tabel §10 baru boleh masuk proposal setelah item ini selesai

#### US-007 [Must]: Penjelasan sederhana dengan SHAP
**Kriteria penerimaan:**
- [ ] Untuk setiap heksagon, SHAP `TreeExplainer` dijalankan pada **model fold yang menghasilkan prediksi OOF-nya**
- [ ] Cek aditivitas: untuk setiap heksagon, base value + jumlah nilai SHAP = prediksi mentah model (skala log) dengan selisih maksimal 0,01
- [ ] 3 fitur dengan nilai SHAP absolut terbesar disimpan beserta tandanya
- [ ] Template kalimat di `pipeline/config/feature_labels.yaml`, misalnya `pop_k1` → "Many residents nearby" / "Few residents nearby"
- [ ] Disimpan sebagai `{ "feature": "pop_k1", "text": "Many residents nearby", "effect": +0.8 }`. Nilai SHAP LightGBM Poisson ada di skala log, jadi `effect` hanya dipakai untuk urutan dan arah (↑/↓), tidak pernah ditampilkan sebagai "+0.8 outlets"
- [ ] **Cakupan penjelasan:** angka di kartu (A dan E) dihitung pada k-ring 1, sedangkan SHAP menjelaskan prediksi heksagon pusat. Karena itu faktor ditampilkan dengan judul "What drives demand at this spot", bukan sebagai penjelasan angka k-ring. Fitur seperti `pop_k1` dan `campus_k2` sudah merangkum sekitarnya, jadi faktornya tetap relevan untuk area sekitar. Hal ini ditulis satu kalimat di panel About
- [ ] Cek sampel 5 heksagon acak didokumentasikan di `docs/model_report.md`
- [ ] Lint lolos

#### US-008 [Must]: Ekspor data peta
**Kriteria penerimaan:**
- [ ] `web/public/data/coffee_shop.geojson` dengan `h3`, `kecamatan`, `area_name`, `actual` dan `expected` (per heksagon dan per k-ring, 1 desimal), `gap`, `p_value`, `label`, `confidence`, `factors`. Bentuk persisnya mengikuti **data contract v1.0.0** (`docs/data-contract.md`, `docs/schema/`)
- [ ] Sebelum menulis file, `07_export` menjalankan `pipeline/tools/contract.py`; bila gagal, pipeline berhenti dan file lama tidak ditimpa
- [ ] `web/public/data/meta.json`: rilis dan tahun data, metrik model, parameter label, waktu pembuatan
- [ ] Ukuran GeoJSON di bawah 3 MB (koordinat dibulatkan 5 desimal)
- [ ] Satu perintah menjalankan seluruh pipeline (`make all` atau `python -m pipeline.run`), didokumentasikan di README

#### US-009 [Must]: Peta berlabel
**Kriteria penerimaan:**
- [ ] Nuxt 3 + MapLibre GL JS, basemap **OpenFreeMap** (keputusan D6), berpusat di Bandung
- [ ] Warna isi: opportunity hijau, fair kuning, crowded merah, not_enough_demand abu-abu; tingkat terang warnanya juga dibedakan
- [ ] Heksagon berkeyakinan rendah: lebih transparan, garis tepi putus-putus
- [ ] Legenda untuk keempat warna dan gaya keyakinan rendah
- [ ] Atribusi: OpenFreeMap, OpenMapTiles, OpenStreetMap contributors, Overture Maps Foundation, WorldPop
- [ ] Berfungsi di lebar 375 px dan di desktop
- [ ] `nuxi typecheck` dan ESLint lolos; dicek langsung di browser

#### US-010 [Should]: Memilih jenis usaha
- [ ] Pemilih: "Coffee shop" aktif; "Eatery" nonaktif dengan tanda "Coming soon"
- [ ] Indikator loading; pesan error dengan tombol "Retry" bila file gagal dimuat

#### US-011 [Must]: Kartu area
- [ ] Klik heksagon membuka kartu (panel samping di desktop, bottom sheet di ponsel)
- [ ] Isi: kecamatan, badge label, "Coffee shops within about 500 m: X", "Demand typically supports: about Y", lalu 3 faktor dengan ↑ / ↓ di bawah judul "What drives demand at this spot" (lihat US-007)
- [ ] Catatan keyakinan rendah: "Low confidence: open data may miss some outlets here, such as informal stalls."
- [ ] Catatan kaki: "Estimate based on open data. Not financial advice. Check zoning and permits with official sources before signing a lease." + tautan ke About
- [ ] Tombol Esc atau klik di luar kartu menutupnya

#### US-012 [Should]: Daftar pendek
- [ ] Tombol "Save to shortlist" / "Saved ✓"; panel berisi kecamatan, label, actual vs expected; klik untuk pindah ke area; tombol Remove; maksimal 10
- [ ] Disimpan di `localStorage`; aplikasi tetap berjalan bila penyimpanan tidak tersedia

#### US-013 [Must]: Panel About dan penanda kejujuran
- [ ] Panel About (≤ 200 kata): sumber data, arti "expected", aturan label dalam bahasa sederhana, keterbatasan (pedagang informal, tahun data, model mempelajari pola umum, bukan permintaan sebenarnya)
- [ ] Menampilkan metrik dan versi data dari `meta.json`
- [ ] Semua fitur yang belum dibangun (Eatery, chat, kalkulator, perbandingan, sewa) bertanda "Coming soon" dan tidak bisa dipakai
- [ ] Tabel Status di README selalu diperbarui

#### US-014 [Should]: Deployment
- [ ] Build statis `nuxt generate` di Vercel atau Netlify lewat HTTPS; URL dicantumkan di README
- [ ] Peta pertama tampil dalam waktu kurang dari 3 detik pada simulasi Fast 4G
- [ ] Tidak ada secret di repo maupun hasil build
- [ ] **Cadangan lokal:** `npm run preview` berjalan offline dengan GeoJSON yang dibundel (handbook meminta cadangan demo lokal [5])

### Fase 2 (1 sampai 15 Des 2026)

#### US-015 [P2]: Backend FastAPI
- [ ] `GET /areas?business_type=`, `GET /areas/{h3}?business_type=`, `GET /meta`, `GET /areas/search?business_type=&kecamatan=&label=&limit=`
- [ ] Data dimuat sekali saat startup; `business_type` tidak dikenal → 422; `h3` tidak dikenal → 404
- [ ] `pytest` untuk setiap endpoint
- [ ] Web app beralih ke API lewat environment variable, dengan file statis sebagai cadangan

#### US-016 [P2]: Jenis usaha eatery
- [ ] Daftar kategori eatery di `categories.yaml` (keputusan D4); tidak ada perubahan kode selain konfigurasi
- [ ] Metrik tersendiri di `docs/model_report.md`; pilihan Eatery diaktifkan

#### US-017 [P2]: Asisten chat AI berbasis data peta
**Deskripsi:** Sebagai pengguna, saya menjelaskan budget, target pembeli, dan kecamatan pilihan saya, lalu asisten menyarankan area dari peta yang cocok untuk saya.

**Kriteria penerimaan:**
- [ ] Panel chat; permintaan dikirim ke `POST /chat`; API key Gemini hanya ada di server
- [ ] Hanya lewat function calling: `search_areas(business_type, kecamatan, label, customer_focus, limit)`, `get_area(h3)`, `get_rent_quotes()` (membaca harga sewa yang dimasukkan pengguna di browser ini dan dikirim bersama permintaan)
- [ ] **Aksi peta (baru di v3):** asisten bisa mengembalikan perintah antarmuka yang dijalankan web app: `fly_to(h3)`, `highlight(h3_list)`, `set_filter(label, kecamatan)`, `open_compare(h3_list)`. Perintah hanya mengubah tampilan, tidak pernah mengubah data, dan setiap perintah terlihat oleh pengguna (misalnya "Showing 3 areas in Lengkong")
- [ ] **Kalkulator (baru di v3):** `run_breakeven(inputs)` memakai fungsi yang sama dengan US-022, jadi angka di chat dan di kalkulator selalu sama
- [ ] **Target pembeli** dipetakan ke fitur: `students` → mengutamakan area yang faktor kampusnya termasuk faktor teratas; `office_workers` → fitur kantor; `residents` → fitur penduduk; `commuters` → fitur transportasi
- [ ] **Budget:** asisten hanya membandingkan dengan harga sewa yang dimasukkan pengguna (US-021). Asisten tidak pernah mengarang angka sewa
- [ ] Setiap angka dalam jawaban berasal dari hasil fungsi; setiap area yang disarankan tampil sebagai chip yang membuka kartunya
- [ ] Menolak pertanyaan yang tidak bisa dijawab data (harga sewa pasti, profit, jaminan berhasil)
- [ ] Panel chat menampilkan: "Do not enter personal information." Tidak ada nama, nomor telepon, atau ID akun yang dikirim ke Gemini (tier gratis Gemini memakai konten untuk mengembangkan produk Google [4])
- [ ] Aplikasi tidak ditujukan untuk pengguna di bawah 18 tahun (syarat Gemini API [4]); panel About menulis "for users 18+"
- [ ] Maksimal 20 pesan per sesi; pesan error yang ramah bila gagal
- [ ] Set uji 10 prompt; setiap angka cocok dengan data; hasilnya di `docs/chat_eval.md`

#### US-018 [P2]: Studi validasi pengguna
- [ ] Minimal 10 calon pemilik usaha (mahasiswa yang berencana membuka usaha juga dihitung), persetujuan dicatat, hanya inisial yang disimpan
- [ ] Setiap peserta memilih 3 area dua kali: hanya dengan Google Maps vs dengan Ascend, urutannya diselang-seling
- [ ] **Pilihan dinilai terhadap hasil cek lapangan, bukan terhadap label Ascend** (memakai label Ascend sirkular: pengguna Ascend pasti menghindari label yang mereka lihat). Supaya bisa dinilai, peserta memilih dari daftar area kandidat yang tetap (misalnya 20 heksagon campuran ketiga label), dan semua kandidat itu ikut dicek di US-019
- [ ] Metrik utama: rata-rata jumlah coffee shop hasil cek lapangan (termasuk pedagang informal) dalam sekitar 500 m dari area yang dipilih; makin rendah makin baik. Metrik sekunder: waktu memilih, tingkat keyakinan 1 sampai 5
- [ ] Ringkasan jujur di `docs/validation.md`, termasuk hasil negatif; data mentah di `docs/validation_raw.csv`

#### US-019 [P2]: Cek lapangan area opportunity teratas
- [ ] 10 heksagon `opportunity` dengan gap terbesar, **ditambah semua area kandidat studi validasi (US-018)**; dicek lewat kunjungan atau citra jalanan
- [ ] Yang dicatat: usaha yang terlihat (termasuk pedagang informal), catatan, tanggal; proporsi yang terbukti "tidak padat" ditulis di `docs/field_check.md`

#### US-022 [P2]: Kalkulator balik modal dan masa balik modal (baru di v3)
**Deskripsi:** Sebagai pemilik usaha pemula, saya ingin memasukkan harga, biaya, dan harga sewa untuk sebuah area, lalu melihat berapa cup per hari yang harus terjual supaya impas, agar saya bisa menilai apakah area itu realistis untuk saya.

**Kriteria penerimaan:**
- [ ] Input: harga rata-rata per cup (Rp), biaya variabel per cup (bahan, cup, kemasan), biaya tetap bulanan (sewa, otomatis terisi dari harga sewa yang dimasukkan pengguna untuk area ini bila ada; gaji; listrik dan air; lain-lain), jumlah hari buka per bulan, biaya awal sekali bayar (opsional)
- [ ] Output: kontribusi per cup; titik impas dalam cup per bulan dan per hari; bila pengguna mengisi "cups per day I expect", tampilkan untung atau rugi per bulan dan masa balik modal untuk biaya awal
- [ ] Baris sensitivitas: titik impas bila sewa naik 20% dan bila harga turun 10%
- [ ] Bila harga ≤ biaya variabel: pesan "Each cup loses money at these numbers" dan titik impas tidak ditampilkan
- [ ] Strip konteks area dari kartu: label, jumlah coffee shop dalam sekitar 500 m, jumlah yang biasanya ditampung permintaan
- [ ] Teks di layar: "Scenario based on your numbers. Ascend does not predict your sales."
- [ ] Tidak ada nilai bawaan tersembunyi: contoh angka hanya muncul sebagai placeholder, lengkap dengan sumbernya [16]
- [ ] Nilai disimpan hanya di browser
- [ ] Unit test (Vitest) untuk rumus, termasuk kontribusi nol dan negatif serta hari buka nol
- [ ] Fungsi yang sama dipakai oleh chat (`run_breakeven`) dan tampilan perbandingan
- [ ] Typecheck/lint lolos; dicek di browser

Catatan: story ini tidak membutuhkan pipeline data. Tarik ke Fase 1 hanya jika semua item Must P1 sudah selesai paling lambat 27 Nov.

#### US-023 [P2]: Kecocokan jenis usaha di kartu area (baru di v3)
- [ ] Setelah US-016, kartu menampilkan kedua label, misalnya "Coffee shop: crowded · Eatery: opportunity"
- [ ] Satu baris petunjuk yang hanya memakai kedua label itu: "Less competition for eateries than for coffee shops here"
- [ ] Tidak ada model baru; kalimatnya tidak pernah menyebut usaha mana yang lebih menguntungkan

#### US-024 [P2 stretch]: Jangkauan jalan kaki (baru di v3)
- [ ] Untuk setiap pusat heksagon, area yang bisa dicapai dalam 5 menit jalan kaki (sekitar 400 m pada kecepatan 4,8 km/jam) dihitung pada jaringan jalan kaki OSM dengan OSMnx dan disimpan di pipeline
- [ ] Kartu menampilkan "Coffee shops within a 5-minute walk: X" menggantikan jumlah k-ring bila tersedia
- [ ] Label tetap memakai aturan k-ring kecuali perbandingan di area cek lapangan menunjukkan jangkauan jalan kaki lebih baik; hasilnya dicatat apa pun kesimpulannya
- [ ] Waktu proses dan ukuran file dicatat; dilewati bila mengancam rencana Final Day

### Fase 3 (Final Day, 16 Des 2026)

#### US-020 [P3]: Membandingkan 2 sampai 3 area dari daftar pendek
- [ ] Pilih 2 atau 3 area dari daftar → "Compare"; satu kolom per area: label, actual vs expected, gap, keyakinan, faktor, dan harga sewa pengguna bila ada
- [ ] Tombol "Compare" nonaktif bila kurang dari 2 area, disertai petunjuk
- [ ] **Pengecekan sewa vs ruang pasar (baru di v3):** bila pengguna sudah memasukkan harga sewa untuk area yang dibandingkan, setiap kolom menampilkan sewa per m² di samping label; area diberi catatan "High rent for a crowded area" bila harga sewanya di atas median harga sewa pengguna sendiri **dan** labelnya `crowded`. Hanya memakai data pengguna; tidak ada klaim harga sewa tingkat kota
- [ ] Bila pengguna sudah mengisi kalkulator (US-022), setiap kolom menampilkan titik impas cup per hari dengan harga sewa area tersebut

#### US-021 [P3]: Layer sewa (dikembangkan dari abstrak)

> Abstrak menulis: *"Rental samples will come only from owners who give permission"* dan menjadwalkan *"rental layer on Final Day"*. Story ini memperluasnya dengan harga sewa milik pengguna sendiri dan pembanding publik. Di proposal, perluasan ini disebut terus terang sebagai pengembangan setelah abstrak.
**Deskripsi:** Sebagai pengguna, saya ingin memasukkan harga sewa yang saya terima dan melihatnya di samping tingkat permintaan area, ditambah pembanding publik, supaya saya bisa mencoret area yang tidak terjangkau.

**Kriteria penerimaan:**
- [ ] **Harga sewa dari pengguna:** di kartu area, pengguna bisa memasukkan sewa bulanan (Rp) dan luas tempat (m²). Disimpan hanya di browser (`localStorage`), ditampilkan di kartu dan di tampilan perbandingan sebagai "Your quote: Rp X/month (Rp Y per m²)" di samping label dan gap area. Tidak ada yang dikirim ke server kecuali pengguna memilih untuk berbagi
- [ ] **Berbagi secara sukarela:** kotak centang terpisah "Share this quote anonymously to help other users". Data yang dibagikan hanya berisi ID heksagon, sewa, luas, dan bulan; tidak pernah lokasi persis, nama, atau kontak
- [ ] **Pembanding publik (hanya dari sumber yang mengizinkan):**
  - Laporan triwulanan properti komersial Bank Indonesia (PPKom) menerbitkan indeks harga untuk beberapa kota termasuk Bandung, dan indeks segmen sewa ritel [8]. Cek dulu di seri data BI yang bisa diunduh apakah segmen sewa ritel tersedia khusus untuk Bandung; pakai hanya sebagai konteks tingkat kota ("Bandung commercial rent index changed X% year on year"), tidak pernah sebagai harga per area
  - Portal listing hanya dengan izin tertulis. Syarat Rumah123 melarang pengambilan data otomatis dan "building a database of property information" dari kontennya [3]. Tim mengirim email permohonan izin ke platform listing sekarang (lihat §9, D8); tanpa izin, data listing tidak dipakai
  - Median harga sewa yang dibagikan pengguna per heksagon, hanya ditampilkan bila sudah ada minimal 3 data
- [ ] Setiap angka sewa di layar diberi label asal: "Your quote", "Shared by users (n)", "Bank Indonesia index", atau "Synthetic (demo)"
- [ ] Tim bisa menghapus data sewa yang dibagikan atas permintaan (prosesnya di README)
- [ ] **Stretch: baca harga sewa dari foto (baru di v3).** Pengguna mengunggah foto penawaran sewa atau selebaran; Gemini vision mengisi formulir (sewa, periode, luas) sebagai *usulan* yang harus dikonfirmasi atau diedit pengguna. Foto tidak disimpan; nomor telepon dan nama dibuang dan tidak pernah ditampilkan. Akurasi dicek pada 20 foto (contoh penawaran buatan tim sendiri atau yang sudah mendapat izin), hasilnya ditulis di `docs/model_report.md`. Bila tingkat keyakinan ekstraksi rendah, formulir dibiarkan kosong, bukan ditebak
- [ ] Typecheck/lint lolos; dicek di browser

---

## 4. Kebutuhan Fungsional

**Pipeline data**
- FR-1: Hanya data terbuka: Overture Maps Places, OpenStreetMap, WorldPop, ditambah publikasi Bank Indonesia untuk konteks sewa.
- FR-2: Grid H3 resolusi 9 untuk Kota Bandung + Dayeuhkolot + Bojongsoang.
- FR-3: Filter Overture memakai `taxonomy` dan `operating_status`; duplikat antarsumber digabung.
- FR-4: Hanya fitur permintaan; pipeline gagal bila jumlah usaha makanan dipakai sebagai fitur.
- FR-5: Jenis usaha diatur lewat `categories.yaml` tanpa mengubah kode.
- FR-6: Setiap tahap bisa dijalankan sendiri; seluruh pipeline dengan satu perintah.

**Model**
- FR-7: Model LightGBM Poisson dengan fitur permintaan.
- FR-8: Validasi silang spasial 5 fold dikelompokkan per induk H3 resolusi 7; baseline yang hanya memakai penduduk diuji dengan fold yang sama.
- FR-9: Expected count yang ditampilkan adalah prediksi OOF; penjelasannya dari model fold yang sama.
- FR-10: Label memakai uji Poisson k-ring 1 di `labels.yaml`.
- FR-11: Area dengan POI jarang ditandai `confidence = low`.
- FR-12: 3 faktor SHAP teratas per heksagon dalam bahasa Inggris sederhana.

**Web app**
- FR-13: Web app menampilkan peta heksagon berlabel dengan legenda dan atribusi data.
- FR-14: Pengguna bisa memilih jenis usaha; jenis yang belum tersedia terlihat jelas nonaktif.
- FR-15: Klik heksagon membuka kartu area berisi label, actual count, expected count, faktor, dan peringatan keyakinan bila relevan.
- FR-16: Pengguna bisa menyimpan sampai 10 area ke daftar pendek yang disimpan di browser.
- FR-17: Panel About menampilkan versi data, metrik, dan keterbatasan.
- FR-18: Web app berjalan di browser ponsel (lebar ≥ 375 px) dan desktop.

**Backend dan AI (P2)**
- FR-19: Endpoint area, pencarian, dan metadata (US-015).
- FR-20: Fakta di chat hanya dari fungsi backend; menolak pertanyaan yang tidak bisa dijawab data.
- FR-21: API key hanya di environment variable server.
- FR-22: Tidak ada data pribadi yang dikirim ke model bahasa.
- FR-23: Kalkulator balik modal hanya memakai input pengguna; satu fungsi bersama untuk kalkulator, chat, dan perbandingan.
- FR-24: Aksi peta dari chat hanya mengubah tampilan, tidak pernah data.

**Final Day (P3)**
- FR-25: Membandingkan 2 sampai 3 area dari daftar pendek.
- FR-26: Harga sewa tetap di browser kecuali pengguna memilih berbagi; data yang dibagikan diagregasi per heksagon dengan n ≥ 3; setiap angka sewa menunjukkan asalnya.

**Kejujuran dan kepatuhan**
- FR-27: Fitur yang belum selesai ditandai "Coming soon" dan Planned.
- FR-28: README dan proposal mengungkapkan bantuan AI yang material (alat dan perannya), data pihak ketiga, dan library beserta lisensinya [5].
- FR-29: Setiap angka atau tabel bukti yang dikutip di proposal (metrik model, simulasi §10, uji kegunaan) harus bisa direproduksi dari file di repositori.

---

## 5. Di Luar Cakupan (Non-Goals)

- Tidak memprediksi omzet, profit, atau peluang bertahan dari data peta (§1.1). Angka uang hanya muncul sebagai skenario balik modal yang dihitung dari angka yang dimasukkan pengguna (US-022), dengan label "Scenario based on your numbers".
- Tidak memakai ulang kode, data, teks, gambar, prompt, antarmuka, atau nama fitur dari Loconomics atau entri lomba lain sebelumnya (§14).
- Tidak menjamin usaha akan berhasil; bukan nasihat keuangan.
- Tidak mencakup kota selain Kota Bandung, Dayeuhkolot, dan Bojongsoang.
- Tidak mencakup jenis usaha selain coffee shop (P1) dan eatery (P2).
- Tidak ada akun, login, atau daftar pendek yang tersinkron ke cloud.
- Tidak ada data keramaian pejalan kaki secara langsung.
- Tidak mengambil data otomatis dari Google Maps, portal listing, atau sumber apa pun yang syaratnya melarang.
- Tidak ada aplikasi mobile native.
- Tidak ada pembayaran, marketplace listing, atau pencocokan penyewa dan pemilik (itu ranah LapakIn).
- Tidak ada backend di P1.

---

## 6. Pertimbangan Desain

- Pengguna awam: tidak ada kata "residual", "SHAP", "H3", "p-value" di antarmuka. Pakai "areas", "coffee shops nearby", "demand typically supports".
- Antarmuka berbahasa Inggris (bahasa resmi lomba).
- Peta layar penuh; pemilih jenis usaha dan tombol About di atas; legenda di kiri bawah; kartu sebagai panel samping atau bottom sheet; daftar pendek bisa diciutkan.
- Aman untuk buta warna: label selalu ditulis sebagai teks di samping warna.
- Semua tombol bisa dijangkau keyboard; Esc menutup kartu; kontras teks ≥ 4,5:1.
- Mockup Figma untuk layar P2/P3 boleh muncul di video semifinal dengan label "Mockup".

---

## 7. Pertimbangan Teknis

### 7.1 Arsitektur

```
                 OFFLINE PIPELINE (Python 3.11)                         SERVING
 ┌───────────────────────────────────────────────────────────┐
 │ Overture Places ─┐                                         │
 │ (taxonomy, open) │  02_places ──► coffee_shops.parquet ─┐  │
 │ OSM amenity ─────┘                                      │  │
 │                                                         ▼  │
 │ OSM boundaries ──► 01_grid ──► grid.parquet ──► 04_train (5 fold LightGBM,
 │ WorldPop 2026 ──┐                 │              GroupKFold res-7) │
 │ OSM campus/     ├─► 03_features ──┘                    │           │
 │ office/transit ─┘                                      ▼           │
 │                         05_score (k-ring Poisson labels, confidence)│
 │                         06_explain (SHAP from fold model)           │
 │                         07_export ──► coffee_shop.geojson, meta.json│
 └───────────────────────────────────────────────────────────┬────────┘
                                                             │
     P1: static files ───────────────────────────────────────┼──► Nuxt 3 + MapLibre (Vercel/Netlify)
                                                             │      basemap: OpenFreeMap
     P2: FastAPI loads the same files ◄──────────────────────┘      shortlist + rent quotes in localStorage
           │  /areas  /areas/search  /meta  /chat
           └──► Gemini (function calling; tools call the API, never invent numbers)
```

### 7.2 Trade-off utama

| Keputusan | Dipilih | Alternatif | Alasan dipilih | Ditinjau ulang bila |
|---|---|---|---|---|
| Penyajian di P1 | GeoJSON statis | Backend sejak awal | Sekitar 2.000 heksagon muat dalam satu file di bawah 3 MB; tanpa biaya hosting; tidak ada yang bisa rusak saat demo | Chat butuh pencarian (P2) |
| Grid | H3 res 9 + k-ring 1 untuk label | Sel res 8 (sekitar 0,74 km²) | Res 9 menjaga detail peta; k-ring 1 sesuai jangkauan jalan kaki dan menstabilkan hitungan | Pengguna merasa heksagon terlalu kecil |
| Aturan label | Uji Poisson pada k-ring | Ambang gap/rasio tetap | Ambang tetap salah melabeli variasi acak (§10) | Data asli menunjukkan over-dispersion; ganti dengan uji negative binomial |
| Model | LightGBM Poisson | Hanya Poisson GLM | Menangkap efek non-linear (kampus + transportasi); GLM tetap jadi baseline | LightGBM tidak mengalahkan baseline: sajikan GLM dengan jujur |
| Penjelasan | SHAP dari model fold | SHAP dari satu model final | Angka dan alasan dari model yang sama | Tidak perlu ditinjau |
| LLM | Gemini dengan function calling | Jawaban teks bebas | Angka terikat data, tidak ada area karangan | Kuota gratis habis saat demo: siapkan rekaman demo cadangan |

### 7.3 Library

`duckdb` (Overture), `osmnx` atau Overpass API (OSM), `rasterio` + `exactextract` (WorldPop), `h3` v4, `geopandas`, `lightgbm`, `shap`, `scikit-learn`, `scipy` (uji Poisson), `ruff`. Web: `nuxt` 3, `maplibre-gl`, Vitest. Backend (P2): `fastapi`, `google-genai`, `pytest`.

### 7.4 Risiko yang sudah diketahui

- **Sirkularitas:** model mempelajari di mana usaha biasanya berada berdasarkan permintaan, bukan permintaan yang sebenarnya. Gap menunjukkan area yang berbeda dari pola umum kota. Ini dijelaskan di panel About dan proposal.
- **Bias pemetaan:** jumlah kantor dan halte di OSM sebagian mencerminkan seberapa lengkap suatu area dipetakan. Mitigasi: penanda keyakinan, cek sampel, cek lapangan.
- **Pedagang informal tidak tercatat:** penanda keyakinan rendah + cek lapangan.
- **Tahun data:** WorldPop 2026 adalah estimasi model dari rilis alpha (R2025A) [9]; Overture dan OSM adalah snapshot 2026. Tahun data ditampilkan di About.
- **Perubahan skema Overture:** kunci nama rilis; filter kategori ada di konfigurasi.
- **Lisensi:** OSM ODbL ("© OpenStreetMap contributors"); sitasi WorldPop DOI 10.5258/SOTON/WP00839 [9]; lisensi Overture Places berbeda per sumber (sebagian besar CDLA Permissive 2.0, Foursquare Apache 2.0, AllThePlaces CC0) [10]; OpenFreeMap boleh dipakai komersial dengan atribusi [11].
- **Secret:** API key Gemini hanya di server.
- **Demo gagal:** build cadangan lokal; rekaman demo chat bila kuota Gemini habis.

### 7.5 Privasi (Case 2 meminta penanganan data pengguna yang tepat [5])

| Data | Disimpan di mana | Catatan |
|---|---|---|
| Daftar pendek | Hanya di browser | Tanpa akun |
| Harga sewa | Hanya di browser | Dibagikan hanya bila pengguna memilih; diagregasi, n ≥ 3 |
| Pesan chat | Dikirim ke Gemini lewat server kita | Peringatan agar tidak memasukkan data pribadi; tidak ada log selain jumlah error |
| Studi validasi | `docs/validation_raw.csv` | Persetujuan dicatat, hanya inisial |
| Cek lapangan | `docs/field_check.md` | Tidak ada foto orang atau pelat nomor |
| Input kalkulator | Hanya di browser | Tidak dikirim kecuali pengguna meminta chat memakainya |
| Foto sewa (stretch) | Dikirim sekali ke Gemini untuk ekstraksi, tidak disimpan | Nomor telepon dan nama dibuang |

---

## 8. Ukuran Keberhasilan

**Model (paling lambat 30 Nov)**
- Rata-rata Poisson deviance LightGBM minimal 10% lebih rendah dari baseline pada validasi silang spasial.
- Korelasi Spearman (expected vs actual, fold yang ditahan) ≥ 0,5.
- Tingkat kesalahan cek sampel kategori ≤ 15%.

**Produk (paling lambat 30 Nov)**
- 3 orang di luar tim bisa menyimpan daftar 3 area dalam waktu kurang dari 2 menit.
- Peta tampil dalam waktu kurang dari 3 detik pada Fast 4G, diukur pada build yang dideploy (US-014) atau, bila US-014 belum selesai, pada build lokal `npm run preview` dengan throttling Fast 4G.
- Tidak ada fitur belum selesai yang ditampilkan sebagai sudah selesai.

**Dampak (paling lambat Final Day)**
- Area yang dipilih dengan Ascend punya **rata-rata coffee shop hasil cek lapangan yang lebih sedikit** dibanding area yang dipilih hanya dengan Google Maps (dinilai terhadap cek lapangan, bukan label Ascend).
- Sekunder: waktu memilih dengan Ascend tidak lebih lama, dan rata-rata tingkat keyakinan lebih tinggi.
- Minimal 7 dari 10 area `opportunity` yang dicek di lapangan terbukti tidak padat.

> Ini target. Kalau meleset, hasilnya dilaporkan apa adanya [5].

---

## 9. Keputusan atas Open Question v1

Kolom **Berubah dari 22 Nov** mencatat bila keputusan ini menggantikan jawaban tim pada 22 Nov (PRD lama di `tasks/archive/`). Semua perubahan di bawah perlu dikonfirmasi tim saat menyepakati PRD ini.

| # | Pertanyaan | Keputusan | Berubah dari 22 Nov | Alasan dan bukti |
|---|---|---|---|---|
| D1 | Area Telkom: lingkaran 3 km atau kecamatan? | **Poligon Kecamatan Dayeuhkolot + Bojongsoang.** Titik kampus `-6.9733, 107.6303` tetap dipakai untuk `dist_campus_m`. | Ya: sebelumnya lingkaran radius 3 km | Kampus berada di Sukapura, Dayeuhkolot [12]; Bojongsoang bersebelahan. Kecamatan memberi nama untuk kartu dan cocok dengan statistik BPS. Luas 11,03 dan 27,81 km² [7]; total grid sekitar 1.950 sel. |
| D2 | Ambang label | **Uji Poisson k-ring 1, alpha 0,05, gap minimal 1** (US-006). Setel alpha sekali dengan data asli; catat alasannya. | Ya: sebelumnya ambang gap/rasio tetap + tuning bila satu label > 60% | Simulasi §10 (`docs/sim_labels.py`): aturan v1 salah melabeli sekitar 27% heksagon; Poisson k-ring sekitar 7%, dengan presisi sekitar dua kali lipat. |
| D3 | Definisi coffee shop | **Masuk:** tempat di Overture dengan `taxonomy.primary` `coffee_shop` atau `cafe` (atau hierarkinya memuat keduanya), OSM `amenity=cafe`. Kios kopi ikut dihitung bila tercatat di kategori ini. **Tidak masuk:** roastery tanpa tempat duduk, kedai teh, bubble tea, juice bar, toko khusus dessert, warnet. Pastikan lewat US-000. | Sebagian: inti sama (coffee shop + cafe + kios; tanpa roastery dan dessert); v3 juga mengeluarkan kedai teh, bubble tea, juice bar | Contoh hierarki di Overture: `[food_and_drink, non_alcoholic_beverage_venue, coffee_shop]` [13]. Bubble tea dan juice bar berada di induk yang sama, jadi memfilter berdasarkan induknya akan menghitung terlalu banyak. |
| D4 | Definisi eatery | **Masuk:** tempat di Overture yang hierarkinya memuat `restaurant` (semua jenis masakan, termasuk casual eatery), warung makan, dan fast food **lokal**; OSM `amenity=restaurant|fast_food|food_court`. **Tidak masuk:** fast food **chain** (data dengan tag `brand`/`brand:wikidata` dari daftar chain di `categories.yaml`, misalnya McDonald's, KFC, Richeese), fine dining, bar, toko roti, dessert, katering saja. | Ya, direkonsiliasi: 22 Nov mengeluarkan fast food chain dan fine dining; v3 memasukkan semua fast food. v3.1 memasukkan fast food lokal (banyak warung makan dipetakan sebagai `fast_food`) tetapi tetap mengeluarkan chain | Hierarki Overture menggabungkan semua restoran ke `restaurant` [1]; ini mencakup warung makan yang dipetakan sebagai restoran. Chain bukan pesaing setara bagi pemilik usaha kecil. Daftar final dari US-000. |
| D5 | Tahun WorldPop | **Global2 R2025A, 100 m constrained, tahun 2026.** | Tidak: tetap "tahun terbaru apa adanya", sekarang tahunnya ditetapkan | Estimasi tahunan 2015 sampai 2030, dirilis September 2025 [9]; tahun 2026 cocok dengan tahun data Overture/OSM. Catatan di About: estimasi model, rilis alpha. |
| D6 | Basemap | **Instance publik OpenFreeMap.** Cadangan: heksagon di atas latar polos (demo lokal). | Tidak | Gratis, tanpa API key, tanpa batas tampilan, boleh dipakai komersial; MapLibre menambahkan atribusi otomatis [11]. |
| D7 | Pembagian tugas | Lihat §12 (usulan; tim yang menetapkan). | Tidak: Aprilianza tetap memegang pipeline dan model | Proposal wajib mencantumkan peran dan kontribusi; juri boleh bertanya teknis ke anggota mana pun [5]. |
| D8 | Data sewa | Harga dari pengguna (browser) + indeks BI PPKom Bandung + harga yang dibagikan secara sukarela; data listing hanya dengan izin tertulis; data sintetis boleh untuk demo bila diberi label. | Ya, diperluas: 22 Nov hanya sampel pemilik yang setuju + sintetis berlabel bila kurang dari 15 | Abstrak hanya menjanjikan sampel dari pemilik yang memberi izin dan layer sewa di Final Day; sisanya perluasan yang disebut di proposal. Syarat Rumah123 [3]; BI PPKom memasukkan Bandung dalam indeks kotanya [8] (cek apakah segmen sewa ritel tersedia per kota); handbook mengizinkan data demo yang berizin atau sintetis [5]. **Tindakan sekarang:** email ke platform listing (Rumah123/99.co, OLX, Mamikos) untuk meminta izin menampilkan harga sewa teragregasi di prototipe lomba mahasiswa yang nonkomersial. |

---

## 10. Bukti untuk D2: simulasi aturan label

> **Status (25 Nov):** `docs/sim_labels.py` sudah ada (US-006a selesai). Tabel di bawah adalah output script itu (seed 42, rata-rata 20 kali ulang) dan menggantikan angka 24 Nov. Jalankan `python docs/sim_labels.py` untuk mereproduksinya; angka ini boleh dikutip di proposal.

`sim_labels.py` (di `docs/`) membuat 2.269 heksagon sintetis dengan permintaan yang bervariasi secara spasial (rata-rata 1,8 usaha per heksagon; 41% heksagon memperkirakan kurang dari 1) dan mengambil jumlah aktual dari distribusi Poisson. Model diasumsikan sempurna, jadi setiap label di skenario A adalah alarm palsu. **Semua data sintetis, bukan data Bandung.**

| Aturan | Skenario A: pasokan = permintaan di semua tempat (semua seharusnya "fair") | Skenario B: 10% kantong kurang pasokan + 10% kelebihan pasokan. Presisi / recall |
|---|---|---|
| v1: per heksagon, gap/rasio | 14,6% opportunity, 12,7% crowded | opportunity 28% / 46%, crowded 32% / 48% |
| Uji Poisson, per heksagon | 0,5%, 2,8% | 67% / 8%, 51% / 24% |
| **Uji Poisson, k-ring 1 (dipilih)** | **3,1%, 3,8%** | **57% / 42%, 51% / 50%** |

Cara membaca: dengan aturan v1, sekitar 7 dari 10 label "opportunity" hanyalah kebetulan (presisi 28%), dan 27% heksagon diberi label padahal pasokan sama dengan permintaan. Uji per heksagon memang tepat, tetapi hampir tidak menemukan apa-apa (recall 8%) karena hitungannya terlalu kecil. Menjumlahkan per k-ring menemukan sekitar 4 dari 10 sel kantong yang nyata sambil menjaga alarm palsu sekitar 3 sampai 4% per label; presisinya sekitar dua kali aturan v1. Data asli punya tambahan noise dari error model, jadi presisi aslinya akan lebih rendah; karena itulah ada cek lapangan (US-019).

---

## 11. Deliverable semifinal (batas 30 Nov 2026, 23.59 WIB) [5]

| Item | Ketentuan | Penanggung jawab |
|---|---|---|
| Proposal PDF | Maksimal 10 halaman isi (tidak termasuk cover, referensi, dan deklarasi); bahasa Inggris; disarankan A4, huruf 11 sampai 12 pt, spasi 1,15, margin 2,5 cm | Ajis (lead), semua |
| Declaration of Originality | Ditandatangani, dilampirkan di proposal; template di s.id/DeclarationOfOriginalitySTACK2026 | Keempat anggota menandatangani |
| Video | Maksimal 2 menit, 1080p, audio jelas, narasi atau subtitle bahasa Inggris; memperkenalkan tim, masalah, solusi, menampilkan alur pengguna atau prototipe awal, **menyebut apa yang sudah selesai dan apa yang belum**; diunggah di Instagram, tautannya dimasukkan ke form | Bill (edit), Ajis (naskah) |
| Biaya pendaftaran | Tim semifinal membayar biaya per tim; jumlah dan batas waktunya diumumkan bersama hasil semifinal [5] | Ajis |
| Cadangan | Simpan PDF, file video, dan bukti pengiriman yang persis sama dengan yang dikirim | Ajis |

> **Verifikasi handbook:** tautan template deklarasi (s.id/DeclarationOfOriginalitySTACK2026) dan ketentuan unggah video ke Instagram berasal dari handbook terbaru. `Handbook STACK 2026.docx` di folder proyek masih versi lama (menulis "template will be given later" dan tidak menyebut Instagram untuk video). Simpan handbook terbaru ke folder proyek dan cocokkan tabel ini sebelum 29 Nov.

**Kerangka proposal dipetakan ke handbook dan PRD ini**

| Bagian proposal (handbook) | Halaman | Isi dari PRD ini |
|---|---|---|
| Project and Team Identity | 0,5 | Judul (sama dengan babak penyisihan), tim, Case 2, peran dari §12 |
| Problem and User Analysis | 2 | §1 + bukti dari abstrak; alternatif (Google Maps, LapakIn, riset K-Means) |
| Proposed Solution | 1,5 | Alur pengguna (peta → kartu → daftar pendek → chat → perbandingan → sewa), fitur pembeda. Sebut terus terang bahwa kalkulator balik modal, harga sewa dari pengguna, dan pembanding publik adalah pengembangan setelah abstrak |
| Technical Design | 2,5 | Diagram §7.1, metode model dan label (tabel §10, hanya setelah US-006a selesai), sumber data dan lisensi |
| Development Plan | 1,5 | Milestone (§13), progres saat ini (jujur), kontribusi anggota, tugas Final Day: tampilan perbandingan + layer sewa |
| Validation and Impact | 1,5 | Metrik model vs baseline, uji kegunaan singkat, studi yang direncanakan (US-018, US-019), risiko, privasi (§7.5), keberlanjutan |
| References and Declaration | (tidak dihitung) | Sumber, pengungkapan bantuan AI, deklarasi yang ditandatangani |

---

## 12. Pembagian tugas (usulan, tim yang menetapkan)

| Anggota | Peran | Bertanggung jawab atas | Cadangan |
|---|---|---|---|
| Azziz Abdul Ghofur (ketua) | Ketua, backend dan integrasi AI, lead proposal | Proposal, naskah video, US-015, US-017 (termasuk aksi peta), modul rumus US-022, koordinasi US-018, catatan orisinalitas §14 | US-005 |
| Aprilianza Muhammad Yusup | Lead produk dan ML | US-000, US-002 sampai US-008, US-006a (script simulasi), laporan model, US-016, US-023, US-024 | US-017 |
| Bill Stephen Sembiring | Front-end dan UI/UX | US-001 (web), US-009 sampai US-014, US-020, antarmuka US-022, editing video | US-021 |
| Nopri Anita Libertiana Saragih | Kualitas data dan riset | Cek sampel US-003, cek lapangan US-019, rekrutmen dan sesi US-018, sumber sewa dan email izin US-021, kasus uji US-022, bagian masalah di proposal | Teks US-013 |

Setiap anggota harus bisa menjelaskan bagiannya saat build session dan tanya jawab [5].

---

## 13. Rencana harian menuju semifinal (disusun ulang 24 Nov)

Bila tugas 22 sampai 23 Nov dari v2 belum selesai, kerjakan dulu pada 24 Nov.

| Tanggal | Pipeline/ML (April) | Web (Bill) | Proposal/video (Ajis) | Data/riset (Nopri) |
|---|---|---|---|---|
| Sel 24 Nov | US-000 cek kategori, US-002 grid | US-001 repo, kerangka peta dengan GeoJSON dummy | Sepakati PRD v3; kerangka proposal; kabari teman tim Loconomics (§14) | Email izin listing; formulir cek sampel |
| Rab 25 | US-003 lokasi usaha, US-004 fitur | Legenda, tata letak kartu US-011 | Draf Problem + Users | Cek sampel 30 data; angka BI PPKom |
| Kam 26 | US-005 model + baseline; US-006a script simulasi | US-013 About + Coming soon | Draf Solution + Technical Design | Rekrut 3 penguji |
| Jum 27 | US-006 label, US-007 SHAP, US-008 ekspor | Muat GeoJSON asli; US-012 daftar pendek | Draf Dev Plan + Validation; naskah video | Uji kegunaan singkat (3 orang) |
| Sab 28 | Laporan model; bekukan data v1 | US-014 deploy + cadangan lokal; rekam layar | Rekam narasi; review proposal lengkap | Tulis hasil uji; cek sumber |
| Min 29 | Bantu tim | Edit video, subtitle, 1080p | Tanda tangan deklarasi, biaya, PDF final | Cek konsistensi: abstrak vs proposal vs video |
| Sen 30 | | Unggah video ke Instagram | **Kirim sebelum 18.00 WIB** | Simpan cadangan dan bukti kirim |

Bila pipeline terlambat, video menampilkan hasil model asli untuk kecamatan yang sudah siap dan menyebut dengan jelas apa yang belum; produk jadi belum diwajibkan di tahap ini [5].

## 13b. Rencana setelah semifinal

| Waktu | Pekerjaan |
|---|---|
| 1 sampai 6 Des | US-015 API, US-016 eatery, US-022 kalkulator, US-017 chat (versi pertama) |
| 7 Des | Pengumuman Top 10 |
| 7 sampai 15 Des | Aksi peta US-017 dan evaluasi chat, US-023, US-018 studi validasi, US-019 cek lapangan, US-024 bila sempat; draf deck; catat fitur yang selesai dan belum |
| 16 Des | Final Day: catat commit awal; bangun US-020 perbandingan (dengan pengecekan sewa vs ruang pasar) dan US-021 layer sewa; fitur foto hanya bila keduanya selesai; catat commit akhir dan ringkasan di README; kirim paket produk dan deck; pitching |

---

## 14. Konsep yang dibawa dari Loconomics (dan yang tidak)

Loconomics adalah alat WebGIS untuk memilih lokasi usaha di kawasan transit Jabodetabek, diikutkan di MAPID WebGIS Competition 2026 oleh tim lima orang yang salah satunya anggota Ascend [14]. Handbook STACK menyebut: "Existing projects, including previous competition entries, may not be resubmitted, renamed, or repackaged," dan panitia bisa meminta riwayat pengembangan untuk memverifikasi orisinalitas [5]. Karena itu, yang dibawa hanya ide umum, dan semuanya dibangun ulang untuk pengguna, data, dan metode Ascend.

| # | Konsep Loconomics | Keputusan | Bentuk di Ascend | Alasan |
|---|---|---|---|---|
| 1 | Konsultan AI yang menjawab dan menggerakkan peta | **Disesuaikan** | Aksi peta US-017 dengan fungsi milik Ascend | Pola umum (function calling); kuat untuk demo |
| 2 | Label keyakinan dari kepadatan data | **Sudah ada di Ascend** | Penanda keyakinan rendah US-006 (kepadatan POI) | Praktik umum |
| 3 | Setiap skor bisa ditelusuri ke inputnya | **Sudah ada di Ascend** | Faktor SHAP US-007 dari model fold | Ascend menjelaskan model, bukan bobot buatan tangan |
| 4 | Jangkauan jalan kaki menurut jaringan jalan asli | **Disesuaikan (stretch)** | US-024 | Memperbaiki hitungan pesaing di dekat rel, sungai, dan jalan tol |
| 5 | Rekomendasi jenis usaha per area | **Disesuaikan** | US-023, dari dua label | Tidak butuh model tambahan |
| 6 | Pengecekan biaya vs potensi | **Disesuaikan, disederhanakan** | Pengecekan sewa vs ruang pasar US-020 dengan harga sewa pengguna sendiri | Tidak ada data sewa tingkat kota, jadi tidak ada kuadran tingkat kota |
| 7 | Ekstraksi angka dari foto | **Disesuaikan (stretch)** | Fitur foto US-021 untuk harga sewa milik pengguna | Hanya alat bantu input; tidak ada yang disimpan |
| 8 | Halaman metodologi dan transparansi kerja lapangan | **Disesuaikan** | Panel About/Method dengan metrik, validasi, dan cek lapangan (US-013, US-018, US-019) | Mendukung Validation and Impact |
| 9 | Jawaban gratis, kedalaman berbayar (keberlanjutan) | **Disesuaikan di proposal** | Paragraf keberlanjutan: peta gratis; calon mitra seperti inkubator kampus dan dinas UMKM kota | Proposal wajib membahas keberlanjutan [5]; business plan terpisah tidak diwajibkan |
| 10 | Foto struk → rata-rata belanja | **Tidak dibawa** | Tidak dipakai | Butuh struk lapangan dari aplikasi survei lomba lain; datanya tidak ada |
| 11 | Survei harga menu | **Tidak dibawa** | Tidak dipakai | Alasan yang sama |
| 12 | Indeks churn (toko disewakan ÷ toko aktif) | **Tidak dibawa** | Tidak dipakai | Butuh jumlah listing; syarat Rumah123 melarang membangun basis data properti [3] |
| 13 | Grafik pola komuter per jam | **Tidak dibawa** | Tidak dipakai | Tidak ada data penumpang atau keramaian per jam untuk Bandung |
| 14 | Opportunity Score berbobot manual (0,35 / 0,35 / −0,20 / −0,10) | **Tidak dibawa** | Tidak dipakai | Bobot buatan tangan sulit dipertahankan; Ascend memakai model plus uji statistik (§10) |
| 15 | Imputasi variabel survei yang kosong | **Tidak dibawa** | Tidak dipakai | Ascend tidak punya variabel survei untuk diisi |
| 16 | Filter zonasi yang mengeluarkan area | **Tidak dibawa sebagai filter** | Catatan kaki kartu: "Check zoning and permits with official sources before signing a lease." | Jawaban hukum yang salah lebih buruk daripada tidak ada jawaban; data zonasi digital Bandung belum diverifikasi |
| 17 | Nama fitur dan konsep (PriceLens, RiskRadar, GemFinder, ZoneGuard, Commuter Clock, Hidden Gem Score, "Jebakan Gengsi") | **Tidak dipakai** | Tidak dipakai | Merek khas tim Loconomics |

**Pengaman orisinalitas (aturan tim)**

1. Semua kode, teks, gambar, prompt, dan antarmuka Ascend ditulis baru di repositori Ascend. Tidak ada yang disalin dari repositori, proposal, deck, atau video Loconomics.
2. Ascend berbeda dalam pengguna (pemilik usaha makanan pemula), wilayah (Bandung dan kawasan Telkom University), data (hanya data terbuka, tanpa survei), metode (model permintaan + uji Poisson, bukan indeks berbobot), dan fitur (kalkulator, harga sewa dari pengguna, perbandingan).
3. Kepemilikan proyek tetap pada pembuatnya [5]. Loconomics dibuat bersama lima orang, jadi anggota Ascend yang ikut mengerjakannya **wajib** memberi tahu teman-teman timnya bahwa beberapa ide umum menginspirasi bagian Ascend, terutama item 1, 6, dan 7. **Batas: sebelum keempat anggota menandatangani Declaration of Originality (29 Nov).** Simpan bukti pesan pemberitahuan tersebut. Bila ada anggota Loconomics yang keberatan, item yang dipersoalkan dikeluarkan dari Ascend.
4. Kalimat jujur yang disarankan untuk bagian References and Declaration di proposal: "One team member previously worked on a different location-analysis project for transit areas in Jabodetabek (MAPID WebGIS Competition 2026). No code, data, text, design or feature names from it are reused in Ascend." Tim yang memutuskan mencantumkannya atau tidak; bila juri bertanya, jawab dengan isi yang sama.

---

## 15. Peta rubrik: dari mana setiap kriteria mendapat nilai

**Semifinal (proposal + video) [5]**

| Kriteria | Bobot | Yang dicari juri | Di mana Ascend menunjukkannya |
|---|---|---|---|
| Problem Understanding | 25% | Bukti, kebutuhan pengguna, analisis alternatif | Proposal bagian 2: rangkaian bukti dari abstrak, profil pengguna, tabel alternatif (Google Maps, LapakIn, riset K-Means); kutipan dari uji kegunaan singkat |
| Solution Design | 25% | Alur inti, nilai, orisinalitas, kesesuaian case | Peta → kartu → daftar pendek sebagai alur inti; uji permintaan vs pasokan beserta alasannya (§10); kalkulator dan perbandingan sebagai nilai yang direncanakan; kaitan Case 2 (G-7) |
| Technical Feasibility | 20% | Arsitektur, teknologi, data, cakupan yang realistis | Diagram dan trade-off §7.1 dan §7.2; data terbuka dengan lisensi; tabel simulasi (setelah US-006a); pembagian Must/Should |
| Execution and Validation | 20% | Milestone, peran, pengujian, risiko, rencana Final Day | Peran §12, rencana §13, metrik model vs baseline, uji 3 orang, risiko §7.4, tugas Final Day (US-020, US-021) |
| Communication | 10% | Proposal dan video yang jelas, konsisten, dan menggambarkan progres secara akurat | Judul sama di semua dokumen; video menampilkan peta asli dan menyebut apa yang selesai dan belum. Sub-rubrik video: alur pengguna 30%, kejujuran progres 20% |

**Final (produk, deck, pitching) [5]**

| Kriteria | Bobot | Di mana Ascend menunjukkannya |
|---|---|---|
| Functionality and Reliability | 30% | Satu alur yang tidak pernah rusak: peta → kartu → daftar pendek → perbandingan (dengan kalkulator); build cadangan lokal |
| Problem Fit and Usefulness | 20% | Hasil studi validasi (US-018), cek lapangan (US-019) |
| Technical Quality | 15% | Pipeline yang bisa diulang, pengujian (pytest, Vitest), penanganan data yang rapi, tanpa secret di repo |
| Usability and Accessibility | 10% | Daftar pendek dalam kurang dari 2 menit, bahasa sederhana, aturan keyboard dan kontras (§6) |
| Validation and Impact | 10% | Metrik dan keterbatasan yang jujur, termasuk yang meleset |
| Final Day Execution | 10% | 2 sampai 3 tugas yang dideklarasikan (US-020, US-021, fitur foto opsional), commit awal dan akhir, ringkasan di README |
| Pitch and Technical Understanding | 5% | Setiap anggota menjelaskan bagiannya; data simulasi atau sintetis disebut jelas di layar |

Format Final Day: deck maksimal 15 slide (PDF), pitching 10 menit presentasi dan demo langsung + 10 menit tanya jawab; juri boleh bertanya ke anggota mana pun; mockup dan perilaku simulasi wajib disebutkan [5].

---

## Lampiran A: query cek kategori (US-000)

```sql
-- DuckDB. Ganti RELEASE dengan nama rilis terbaru dari https://docs.overturemaps.org/release-calendar/
-- Angka bbox di bawah hanya perkiraan untuk cek cepat. Untuk pipeline, pakai bbox
-- yang dihitung dari poligon wilayah + buffer 1 km (US-002, pipeline/config/area.yaml).
INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs;
SET s3_region='us-west-2';
SELECT taxonomy.primary            AS primary_label,
       array_to_string(taxonomy.hierarchy, ' > ') AS hierarchy,
       basic_category,
       operating_status,
       count(*)                    AS n
FROM read_parquet('s3://overturemaps-us-west-2/release/RELEASE/theme=places/type=place/*', hive_partitioning=1)
WHERE bbox.xmin BETWEEN 107.52 AND 107.77
  AND bbox.ymin BETWEEN -7.06 AND -6.81
  AND list_contains(taxonomy.hierarchy, 'food_and_drink')
GROUP BY ALL
ORDER BY n DESC;
```

---

## Sumber

1. Overture Maps, panduan Places dan taxonomy (`categories` dihapus sejak rilis September 2026). https://docs.overturemaps.org/guides/places
2. Blog Overture Maps, perubahan besar: `categories` dihapus; pakai `taxonomy` atau `basic_category`. https://docs.overturemaps.org/blog
3. Rumah123 Terms of Use (larangan akses otomatis dan membangun basis data properti). https://www.rumah123.com/en/terms-of-use/
4. Gemini API Additional Terms of Service (pemakaian data di layanan gratis; batasan usia dan audiens). https://ai.google.dev/gemini-api/terms
5. Handbook STACK 2026, GDGoC ITB (timeline, ketentuan semifinal, ketentuan Final Day, rubrik).
6. Luas Kota Bandung 167,31 km². https://en.wikipedia.org/wiki/Bandung
7. Kecamatan di Kabupaten Bandung: Dayeuhkolot 11,03 km², Bojongsoang 27,81 km². https://en.wikipedia.org/wiki/Bandung_Regency
8. Bank Indonesia, Perkembangan Properti Komersial (PPKom), kota yang dicakup termasuk Bandung; indeks sewa ritel. https://www.bi.go.id/id/publikasi/laporan/Documents/PPKom_Triwulan_III_2026.pdf
9. WorldPop Global2 2015 sampai 2030, R2025A v1, 100 m. https://hub.worldpop.org/doi/10.5258/SOTON/WP00839
10. Atribusi dan lisensi Overture Maps. https://docs.overturemaps.org/attribution/
11. OpenFreeMap (gratis, tanpa API key, boleh komersial, wajib atribusi). https://openfreemap.org
12. Lokasi Telkom University (Sukapura, Dayeuhkolot; 6,9733°LS 107,6303°BT). https://en.wikipedia.org/wiki/Telkom_University
13. Contoh taxonomy Overture untuk coffee shop. https://www.overturemapsapi.com/blog/2026/10/07/overture-removed-categories-your-code-still-works
14. Proposal Loconomics, MAPID WebGIS Competition 2026 (dokumen internal tim, dibaca hanya untuk §14).
15. U.S. Small Business Administration, rumus titik impas (break-even point). https://legacy.sba.gov/es/node/56191
16. Industry.co.id, Cara menghitung BEP usaha (contoh coffee shop: harga Rp18.000, biaya variabel Rp8.000, biaya tetap Rp6.000.000). https://www.industry.co.id/read/159262/cara-menghitung-bep-usaha-rumus-titik-impas-dan-contohnya
