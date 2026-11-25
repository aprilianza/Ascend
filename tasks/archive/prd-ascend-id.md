> **DIGANTIKAN (24 Nov 2026).** File ini arsip PRD v2 dan tidak berlaku lagi. Acuan yang berlaku: `tasks/prd-ascend-v3-id.md`.

# PRD: Ascend — Peta Permintaan vs. Persaingan untuk Usaha Kuliner Baru di Bandung

**Tim:** Rosun Gank · **Kompetisi:** STACK 2026 (GDGoC ITB) · **Case:** Case 2 — Stronger Communities and Everyday Services
**Status:** Draft v2 (open question sudah dijawab, perbaikan hasil review sudah diterapkan) · **Terakhir diperbarui:** 22 Nov 2026

> Dokumen ini adalah versi bahasa Indonesia dari `tasks/prd-ascend.md`. Isinya sama. Istilah teknis, nama file, isi JSON/config, dan teks UI tetap dalam bahasa Inggris (UI memakai bahasa Inggris karena itu bahasa resmi kompetisi). Kalau ada perubahan, perbarui kedua file.

---

## 1. Pendahuluan / Gambaran Umum

Orang yang membuka usaha makanan atau minuman kecil di Bandung biasanya memilih lokasi berdasarkan intuisi: jalan yang ramai, saran teman, atau tempat apa saja yang kosong. Mereka tidak bisa melihat apakah suatu area sudah punya lebih banyak outlet sejenis daripada yang bisa didukung oleh permintaan setempat, dan baru tahu setelah membayar sewa.

**Ascend** adalah web map gratis yang menunjukkan di mana coffee shop baru masih punya ruang. Peta membagi area studi menjadi hexagon kecil (masing-masing ~0.1 km²). Untuk setiap hexagon, Ascend:

1. Menghitung berapa coffee shop yang **sudah beroperasi** di sana (dari data peta terbuka).
2. Memperkirakan berapa coffee shop yang biasanya bisa didukung oleh **permintaan** di area itu (dari populasi, kampus, kantor, dan akses transportasi), menggunakan model machine learning.
3. Membandingkan kedua angka tersebut dan memberi label **"opportunity"**, **"fair"**, atau **"crowded"** pada hexagon, beserta tiga alasan terkuat di balik perkiraannya.

User memilih jenis usaha, menjelajahi peta berlabel, membuka kartu area yang menjelaskan labelnya, lalu menyimpan shortlist area kandidat.

PRD ini mencakup seluruh produk, tetapi pekerjaannya dibagi menjadi tiga fase yang mengikuti timeline kompetisi:

| Fase | Deadline | Yang dirilis |
|---|---|---|
| **P1 — Semifinal** | 30 Nov 2026 | Data pipeline, model coffee shop, web map statis dengan kartu area dan shortlist |
| **P2 — Pre-Final** | 16 Des 2026 (sebelum Final Day) | Backend FastAPI, model eatery, AI chat assistant, studi validasi user, field check |
| **P3 — Final Day** | 16 Des 2026 (build session) | Tampilan perbandingan area, layer harga sewa dari pemilik yang memberi izin |

> **Pengingat aturan kompetisi:** Fitur yang masih direncanakan tidak boleh ditampilkan seolah sudah selesai. Semua yang belum dibangun harus ditandai jelas di UI ("Coming soon"), di README, dan di video.

### Glosarium (untuk developer junior)

| Istilah | Arti |
|---|---|
| **H3** | Sistem grid hexagon buatan Uber. Setiap hexagon punya ID berupa string (contoh `8965b1a3a2bffff`). Kita memakai **resolution 9** (luas rata-rata ≈ 0.105 km²). |
| **k-ring** | Sebuah hexagon beserta tetangganya sampai *k* langkah. `k=1` = hexagon itu + 6 tetangganya. |
| **Actual count** | Jumlah coffee shop yang saat ini tercatat di dalam sebuah hexagon. |
| **Expected count** | Jumlah coffee shop yang diprediksi model untuk sebuah hexagon, hanya berdasarkan demand feature. |
| **Gap** | `expected − actual`. Positif = masih ada ruang untuk outlet baru; negatif = outlet lebih banyak daripada yang biasanya didukung permintaan. |
| **OOF (out-of-fold) prediction** | Prediksi untuk sebuah hexagon yang dibuat oleh model yang **tidak melihat hexagon itu saat training**. Mencegah model sekadar menghafal actual count. |
| **SHAP** | Metode yang menjelaskan seberapa besar setiap fitur mendorong satu prediksi naik atau turun. |
| **Demand feature** | Fitur yang menggambarkan calon pelanggan (penduduk, mahasiswa, pekerja, komuter) — tidak pernah berupa jumlah outlet makanan lain. |

---

## 2. Tujuan

- **G-1:** Menampilkan setiap hexagon di area studi (Kota Bandung + area Telkom University) dengan label "opportunity / fair / crowded" untuk coffee shop paling lambat saat semifinal (30 Nov 2026).
- **G-2:** Menjelaskan setiap label dengan 3 faktor penyumbang teratas dalam bahasa yang mudah dipahami, supaya pemilik usaha pemula yang awam teknologi mengerti *alasannya*.
- **G-3:** User bisa sampai dari membuka situs ke shortlist berisi 3 area yang tersimpan dalam **kurang dari 2 menit**.
- **G-4:** Menghasilkan demand model yang **mengalahkan baseline berbasis populasi saja** pada error hasil spatial cross-validation (lihat §8), dengan metrik yang didokumentasikan untuk proposal.
- **G-5:** Menandai area dengan confidence rendah secara jujur, supaya user tahu di mana data terbuka kemungkinan tidak lengkap (misalnya warung/kios informal).
- **G-6:** Menjaga seluruh pipeline bisa direproduksi dari data terbuka mentah dengan satu perintah per tahap, supaya juri bisa memverifikasi orisinalitas dan tim bisa membangun ulang dengan cepat saat Final Day.

---

## 3. User Story

User utama: **pemilik usaha makanan atau minuman kecil yang baru pertama kali membuka usaha di Bandung** (misalnya mahasiswa yang membuka kios kopi) dan tidak mampu membayar analisis lokasi profesional.
"User" sekunder: **developer** yang membangun dan memelihara data pipeline.

Story dikelompokkan per fase. Setiap story harus cukup kecil untuk dikerjakan dalam satu sesi kerja yang fokus.

---

### Fase 1 — Semifinal (deadline 30 Nov 2026)

Pekerjaan Fase 1 lebih banyak daripada yang nyaman dikerjakan dalam 9 hari, jadi setiap story diberi prioritas. Story **Must** wajib ada untuk video semifinal. Story **Should** dikerjakan kalau story Must sudah selesai. Story **Could** boleh ditampilkan sebagai mockup Figma yang diberi label.

| Prioritas | Story | Pemegang |
|---|---|---|
| **Must** | US-001 – US-009, US-011, US-014 | US-001 – US-008: Aprilianza · US-009, US-011, US-014: TBD |
| **Should** | US-010, US-013 | TBD |
| **Could** | US-012 (shortlist), kolom `kecamatan` di US-002 | US-012: TBD · `kecamatan`: Aprilianza |

#### US-001: Setup repository dan struktur proyek
**Deskripsi:** Sebagai developer, saya butuh repository yang rapi dengan struktur folder yang jelas supaya tim bisa bekerja paralel dan panitia bisa meninjau riwayat development.

**Acceptance Criteria:**
- [ ] Git repository diinisialisasi dengan folder `pipeline/`, `web/`, `api/` (placeholder kosong untuk P2), `docs/`
- [ ] `.gitignore` mengecualikan file data mentah, `.env`, virtual environment, `node_modules/`, dan hasil build
- [ ] Ada `.env.example` yang mendaftar semua variabel yang dibutuhkan (tanpa nilai asli)
- [ ] `README.md` di root berisi ringkasan proyek, langkah setup untuk `pipeline/` dan `web/`, sumber data beserta lisensinya, dan bagian "AI assistance"
- [ ] `pipeline/` punya file dependency yang di-pin (misalnya `requirements.txt` atau `pyproject.toml`) untuk Python 3.11
- [ ] Lint lolos (`ruff check pipeline/`)

#### US-002: Menentukan area studi dan grid H3
**Deskripsi:** Sebagai developer, saya butuh kumpulan hexagon H3 yang tetap, yang mencakup Kota Bandung dan area Telkom University, supaya semua langkah berikutnya memakai grid yang sama.

**Acceptance Criteria:**
- [ ] Batas Kota Bandung diambil dari OpenStreetMap (batas administratif, disimpan ke `pipeline/data/boundaries/`)
- [ ] Area Telkom University berupa **lingkaran radius 3 km** (diputuskan 22 Nov 2026) di sekitar titik kampus utama (diatur di `pipeline/config/area.yaml`, default `-6.9733, 107.6303`; cek titiknya di peta sebelum dipakai)
- [ ] Gabungan kedua bentuk diisi dengan cell H3 resolution 9; hasilnya disimpan sebagai `pipeline/data/processed/grid.parquet` dengan kolom `h3`, `area_name` (`kota_bandung` atau `telkom_area`), `kecamatan`
- [ ] *(Could)* `kecamatan` (nama kecamatan) diisi dari batas kecamatan OSM; cell di luar kecamatan yang dikenal diisi `null`. Kalau dilewati, kolomnya tetap ada dan isinya semua `null`
- [ ] Script mencetak jumlah cell (perkiraan sekitar 1.500–2.500) dan menyimpan peta PNG sekilas ke `docs/figures/grid.png`
- [ ] Lint lolos

#### US-003: Mengunduh dan membersihkan lokasi coffee shop (data target)
**Deskripsi:** Sebagai developer, saya butuh daftar coffee shop yang bersih dan bebas duplikat supaya "actual count" per hexagon seakurat yang dimungkinkan data terbuka.

**Acceptance Criteria:**
- [ ] Overture Maps Places (rilis terbaru; nama rilis dicatat di `pipeline/data/SOURCES.md`) di-query untuk bounding box area studi menggunakan DuckDB
- [ ] Point/polygon OSM dengan `amenity=cafe` diunduh untuk bounding box yang sama
- [ ] File config `pipeline/config/categories.yaml` memetakan setiap jenis usaha ke kategori sumbernya. **Definisi coffee shop (diputuskan 22 Nov 2026):** tempat yang utamanya menjual kopi atau minuman, termasuk kios/stand kopi kecil. Masukkan Overture `coffee_shop`, `cafe`, dan kategori kios/stand kopi apa pun yang ada di rilis tersebut; OSM `amenity=cafe`. **Keluarkan** roastery murni (misalnya Overture `coffee_roastery`), kategori dessert/es krim/bakery, dan OSM `shop=coffee` (toko biji kopi)
- [ ] Nama kategori dicek terhadap rilis Overture yang benar-benar dipakai sebelum digunakan (daftar kategori unik di area studi disimpan ke `pipeline/data/overture_categories.csv`)
- [ ] Record Overture dengan `confidence` di bawah threshold yang bisa diatur (default `0.5`) dibuang
- [ ] Duplikat antar-sumber digabung: dua record yang berjarak **≤ 30 m** dihitung sebagai satu jika `rapidfuzz.fuzz.token_set_ratio(name_a, name_b) ≥ 80` setelah nama dinormalisasi (huruf kecil, tanda baca dihapus, kata umum seperti "kopi", "coffee", "cafe", "kedai" dihapus). Record tanpa nama hanya digabung jika berjarak ≤ 10 m
- [ ] Output `pipeline/data/processed/coffee_shops.parquet` dengan kolom `id`, `name`, `lat`, `lon`, `source`, `h3`
- [ ] Script mencetak jumlah record sebelum dan sesudah deduplikasi per sumber
- [ ] Lint lolos

#### US-004: Membangun demand feature per hexagon
**Deskripsi:** Sebagai developer, saya butuh demand feature untuk setiap hexagon supaya model bisa memperkirakan berapa outlet yang biasanya bisa didukung suatu area.

**Acceptance Criteria:**
- [ ] Populasi: raster populasi WorldPop 100 m untuk Indonesia dijumlahkan ke setiap hexagon → `pop`. **Pakai tahun terbaru yang tersedia apa adanya, tanpa penskalaan ulang** (diputuskan 22 Nov 2026); tahunnya dicatat di `SOURCES.md` dan ditampilkan di panel About
- [ ] Dari OSM, hal-hal berikut dihitung per hexagon: universitas/perguruan tinggi (`amenity=university|college`), sekolah (`amenity=school`), kantor (`office=*` atau `building=office`), halte bus/angkot (`highway=bus_stop`, `public_transport=platform`), stasiun kereta (`railway=station`)
- [ ] Untuk setiap fitur mentah, ditambahkan jumlah k-ring untuk `k=1` dan `k=2` (misalnya `pop_k1`, `pop_k2`, `campus_k2`)
- [ ] Fitur jarak ditambahkan: `dist_campus_m` dan `dist_station_m` (jarak dalam meter dari titik tengah hexagon ke fitur terdekat)
- [ ] **Jumlah outlet makanan atau minuman tidak boleh dipakai sebagai fitur** (dijaga oleh pengecekan yang membuat script gagal jika ada nama kolom fitur yang mengandung `cafe`, `coffee`, `restaurant`, `food`, atau `eatery`)
- [ ] Output `pipeline/data/processed/features.parquet`, satu baris per `h3`, tanpa nilai kosong (jumlah yang kosong diisi 0)
- [ ] Lint lolos

#### US-005: Melatih demand model coffee shop dengan spatial cross-validation
**Deskripsi:** Sebagai developer, saya butuh model yang memprediksi expected count coffee shop dari demand feature, dievaluasi dengan cara yang tidak membocorkan informasi antar-hexagon yang berdekatan.

**Acceptance Criteria:**
- [ ] Model: LightGBM regressor dengan `objective="poisson"` (target = actual count coffee shop per hexagon)
- [ ] Spatial cross-validation: hexagon dikelompokkan berdasarkan **parent H3 resolution 7**, dan dipakai 5-fold `GroupKFold` supaya hexagon yang bertetangga tetap berada di fold yang sama
- [ ] Sebuah **baseline model** (Poisson GLM yang hanya memakai `pop_k1`) dievaluasi dengan fold yang sama
- [ ] Metrik yang dilaporkan untuk kedua model: mean Poisson deviance, MAE, dan korelasi Spearman antara expected dan actual
- [ ] **Expected count setiap hexagon adalah OOF prediction-nya** (dari fold tempat hexagon itu tidak ikut training), bukan prediksi in-sample
- [ ] Kelima model fold disimpan ke `pipeline/models/coffee_shop_fold{0-4}.lgb`, bersama mapping `h3 → fold` (dibutuhkan supaya setiap hexagon dijelaskan oleh model yang sama dengan yang menghasilkan expected count-nya, lihat US-007)
- [ ] Metrik ditulis ke `docs/model_report.md` (tabel + interpretasi singkat) dan `pipeline/models/metrics.json`
- [ ] Random seed dikunci supaya hasilnya bisa direproduksi
- [ ] Lint lolos

#### US-006: Menghitung gap, label, dan confidence
**Deskripsi:** Sebagai user, saya ingin setiap area diberi label yang sederhana supaya saya bisa cepat melihat di mana persaingan rendah atau tinggi.

**Acceptance Criteria:**
- [ ] `gap = expected − actual` dan `ratio = (actual + 1) / (expected + 1)` dihitung per hexagon
- [ ] Label mengikuti aturan tetap berikut (threshold disimpan di `pipeline/config/labels.yaml`; diputuskan 22 Nov 2026):
  - `opportunity` jika `gap ≥ 1` **dan** `ratio ≤ 0.67`
  - `crowded` jika `gap ≤ −1` **dan** `ratio ≥ 1.5`
  - `fair` untuk selain itu
- [ ] Hexagon dengan permintaan sangat rendah (`pop_k1` di bawah persentil ke-10 **dan** expected < 0.3) diberi label `not_enough_demand` dan ditampilkan abu-abu, bukan "opportunity"
- [ ] `confidence` bernilai `low` jika k-ring 1 hexagon tersebut berisi kurang dari sejumlah mapped POI yang bisa diatur (default 3), selain itu `normal`. "Mapped POI" adalah semua place Overture (semua kategori, setelah filter confidence) ditambah semua node/way OSM yang punya tag `amenity`, `shop`, atau `office`, dideduplikasi seperti di US-003. Alasannya: pemetaan yang jarang biasanya berarti ada outlet (terutama warung/kios informal) yang tidak tercatat
- [ ] Script mencetak jumlah dan persentase tiap label. Jika satu label mencakup **lebih dari 60%** hexagon, script mencetak peringatan; threshold lalu di-tune di `labels.yaml`, dan nilai akhir beserta alasannya dicatat di `docs/model_report.md`
- [ ] Output disimpan ke `pipeline/data/processed/scores.parquet`
- [ ] Contoh: hexagon dengan actual = 0 dan expected = 2.4 → gap 2.4, ratio 0.29 → `opportunity`
- [ ] Lint lolos

#### US-007: Membuat penjelasan yang mudah dipahami dengan SHAP
**Deskripsi:** Sebagai user, saya ingin melihat tiga alasan utama di balik perkiraan suatu area supaya saya bisa memercayai (atau mempertanyakan) labelnya.

**Acceptance Criteria:**
- [ ] SHAP `TreeExplainer` dijalankan untuk setiap hexagon menggunakan **model fold tempat hexagon itu tidak ikut training** (dari US-005), supaya faktor-faktornya menjelaskan expected count yang sama dengan yang tampil di kartu area
- [ ] Pengecekan: untuk setiap hexagon, SHAP base value ditambah jumlah semua nilai SHAP sama dengan prediksi mentah model (skala log) dengan selisih maksimal 0.01
- [ ] Untuk setiap hexagon, 3 fitur dengan nilai SHAP absolut terbesar disimpan beserta tandanya (positif/negatif)
- [ ] Setiap fitur punya template teks yang mudah dibaca di `pipeline/config/feature_labels.yaml`, misalnya `pop_k1` → "Many residents nearby" (positif) / "Few residents nearby" (negatif)
- [ ] Setiap faktor disimpan sebagai `{ "feature": "pop_k1", "text": "Many residents nearby", "effect": +0.8 }`, dengan `effect` berupa nilai SHAP yang dibulatkan ke 1 desimal. Catatan: nilai SHAP dari LightGBM Poisson berada di skala log, jadi `effect` hanya dipakai untuk urutan dan arah (↑/↓), tidak pernah ditampilkan ke user sebagai "+0.8 outlet"
- [ ] Spot check: untuk 5 hexagon acak, teks penjelasan sesuai dengan arah nilai fitur mentahnya (didokumentasikan di `docs/model_report.md`)
- [ ] Lint lolos

#### US-008: Ekspor data peta untuk web app
**Deskripsi:** Sebagai developer, saya butuh satu file statis per jenis usaha yang bisa dimuat web app tanpa backend.

**Acceptance Criteria:**
- [ ] Ekspor `web/public/data/coffee_shop.geojson` (polygon dari cell H3) dengan properties: `h3`, `kecamatan`, `area_name`, `actual`, `expected` (1 desimal), `gap` (1 desimal), `label`, `confidence`, `factors` (array berisi 3)
- [ ] Ekspor `web/public/data/meta.json` berisi: nama rilis/tahun data, ringkasan metrik model, threshold label, timestamp pembuatan
- [ ] Ukuran file GeoJSON di bawah 3 MB (koordinat dibulatkan ke 5 desimal)
- [ ] Satu perintah menjalankan seluruh pipeline dari awal sampai akhir (misalnya `make all` atau `python -m pipeline.run`), didokumentasikan di README
- [ ] Lint lolos

#### US-009: Menampilkan peta berlabel
**Deskripsi:** Sebagai pemilik usaha pemula, saya ingin melihat peta Bandung yang diwarnai berdasarkan peluang supaya saya bisa melihat area yang menjanjikan dalam sekali lihat.

**Acceptance Criteria:**
- [ ] Aplikasi Nuxt 3 dengan MapLibre GL JS menampilkan basemap **OpenFreeMap** (tanpa API key; diputuskan 22 Nov 2026) dengan titik tengah di Bandung
- [ ] Hexagon dari `coffee_shop.geojson` digambar dengan warna isi: opportunity = hijau, fair = kuning, crowded = merah, not_enough_demand = abu-abu
- [ ] Hexagon dengan confidence rendah digambar dengan opacity lebih rendah dan garis tepi putus-putus
- [ ] Legenda menjelaskan keempat warna dan gaya untuk confidence rendah
- [ ] Atribusi peta menampilkan OpenStreetMap, Overture Maps, dan WorldPop
- [ ] Peta bisa dipakai di lebar 375 px (mobile) dan desktop
- [ ] Typecheck/lint lolos (`nuxi typecheck`, ESLint)
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-010: Memilih jenis usaha
**Deskripsi:** Sebagai user, saya ingin memilih jenis usaha saya supaya peta menampilkan persaingan untuk jenis outlet yang tepat.

**Acceptance Criteria:**
- [ ] Selector di bagian atas halaman menampilkan "Coffee shop" (aktif, terpilih secara default) dan "Eatery" (nonaktif, dengan badge "Coming soon")
- [ ] Memilih sebuah jenis memuat `/data/<type>.geojson`; indikator loading ditampilkan selama data diambil
- [ ] Jika file gagal dimuat, ditampilkan pesan error dengan tombol "Retry"
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-011: Membuka kartu area
**Deskripsi:** Sebagai user, saya ingin mengklik sebuah area dan melihat kenapa area itu mendapat labelnya supaya saya bisa menilai apakah area itu cocok untuk saya.

**Acceptance Criteria:**
- [ ] Mengklik hexagon akan menyorotnya dan membuka kartu area (side panel di desktop, bottom sheet di mobile)
- [ ] Kartu menampilkan: nama kecamatan (atau "Unnamed area"), badge label, "Coffee shops here: X", "Demand typically supports: about Y", dan 3 faktor dengan panah ↑ / ↓
- [ ] Jika `confidence = low`, kartu menampilkan: "Low confidence — open data may miss some outlets here, such as informal stalls."
- [ ] Kartu punya catatan kaki singkat: "Estimate based on open data. Not financial advice." dengan link ke bagian "About the method"
- [ ] Mengklik di luar kartu atau menekan Esc akan menutup kartu
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-012: Menyimpan shortlist area
**Deskripsi:** Sebagai user, saya ingin menyimpan area yang menarik ke shortlist supaya bisa saya bandingkan dan kunjungi nanti.

**Acceptance Criteria:**
- [ ] Kartu area punya tombol "Save to shortlist"; tombolnya berubah menjadi "Saved ✓" jika area tersebut sudah tersimpan
- [ ] Panel shortlist menampilkan daftar area tersimpan dengan nama kecamatan, badge label, dan actual vs expected
- [ ] Mengklik item shortlist akan menggeser peta ke hexagon tersebut dan membuka kartunya
- [ ] Setiap item punya tombol "Remove"
- [ ] Maksimal 10 item; mencoba menambah item ke-11 akan memunculkan pesan
- [ ] Shortlist disimpan di `localStorage` dan tetap ada setelah halaman di-reload; jika `localStorage` tidak tersedia, aplikasi tetap berjalan (shortlist hanya tidak tersimpan)
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-013: "About the method" dan penanda kejujuran
**Deskripsi:** Sebagai user (dan sebagai juri), saya ingin memahami bagaimana perkiraan dibuat dan apa yang belum dibangun, supaya saya bisa memercayai produk ini.

**Acceptance Criteria:**
- [ ] Panel "About" menjelaskan dalam ≤ 200 kata: sumber data, arti "expected", aturan label, keterbatasan yang diketahui (warung/kios informal yang tidak tercatat, tahun data)
- [ ] Panel menampilkan metrik model dan versi data dari `meta.json`
- [ ] Setiap fitur yang belum dibangun tetapi terlihat di UI (Eatery, AI assistant) diberi badge "Coming soon" dan tidak bisa dipakai
- [ ] README punya tabel "Status" yang mendaftar setiap fitur sebagai Done / In progress / Planned
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-014: Deploy prototipe
**Deskripsi:** Sebagai tim, kami butuh link publik ke prototipe untuk video semifinal dan proposal.

**Acceptance Criteria:**
- [ ] `nuxt generate` membangun situs statis yang sudah menyertakan file data
- [ ] Situs di-deploy ke static host gratis (Vercel atau Netlify) dan bisa diakses lewat HTTPS
- [ ] Render peta pertama yang bermakna kurang dari 3 detik pada simulasi koneksi "Fast 4G"
- [ ] Tidak ada API key atau secret di file hasil build maupun di repository
- [ ] URL deployment ditambahkan ke README
- [ ] Verifikasi di browser menggunakan skill dev-browser

---

### Fase 2 — Pre-Final (7–16 Des 2026)

#### US-015: Menyajikan data lewat backend FastAPI
**Deskripsi:** Sebagai developer, saya butuh API supaya chat assistant dan fitur berikutnya bisa mengambil data area dari satu tempat.

**Acceptance Criteria:**
- [ ] Aplikasi FastAPI di `api/` dengan endpoint:
  - `GET /areas?business_type=coffee_shop` → GeoJSON (skema sama dengan US-008)
  - `GET /areas/{h3}?business_type=coffee_shop` → properties satu area, 404 jika tidak dikenal
  - `GET /meta` → isi `meta.json`
- [ ] Data dimuat sekali saat startup dari file output pipeline
- [ ] Validasi input: `business_type` yang tidak dikenal mengembalikan 422 dengan pesan yang jelas
- [ ] Automated test untuk setiap endpoint (`pytest`) lolos
- [ ] Web app beralih dari file statis ke API lewat environment variable, dengan file statis sebagai fallback
- [ ] Lint lolos

#### US-016: Menambahkan jenis usaha eatery
**Deskripsi:** Sebagai pemilik yang membuka usaha makan kecil, saya ingin peta yang sama untuk eatery.

**Acceptance Criteria:**
- [ ] `categories.yaml` mendefinisikan kategori eatery. **Definisi eatery (diputuskan 22 Nov 2026):** warung makan, rumah makan, dan restoran kasual. **Keluarkan** fast-food chain dan fine dining, karena target user-nya pemilik usaha kecil independen. Kategori Overture/OSM yang persis (misalnya OSM `amenity=restaurant` tanpa tag `brand` dari chain yang dikenal; `amenity=fast_food` dikeluarkan) didaftar dan didokumentasikan di `categories.yaml`
- [ ] Pipeline berjalan untuk `eatery` tanpa perubahan kode selain config, menghasilkan `eatery.geojson` dan metriknya sendiri di `docs/model_report.md`
- [ ] Opsi Eatery di selector diaktifkan dan badge "Coming soon" dihapus
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-017: AI chat assistant yang berpijak pada data peta
**Deskripsi:** Sebagai user, saya ingin menjelaskan budget, target pelanggan, dan kecamatan pilihan saya lewat chat supaya assistant menyarankan area dari peta yang cocok untuk saya.

**Acceptance Criteria:**
- [ ] Panel chat di web app; request dikirim ke `POST /chat` di backend (Gemini API key hanya ada di server)
- [ ] Assistant memakai function calling untuk mengambil data area (misalnya `search_areas(business_type, kecamatan, label, limit)`, `get_area(h3)`); assistant tidak boleh menjawab dengan angka area yang tidak berasal dari function tersebut
- [ ] Setiap area yang disarankan dalam balasan ditampilkan sebagai chip yang bisa diklik untuk membuka kartu areanya di peta
- [ ] Jika user menanyakan hal yang tidak bisa dijawab oleh data (misalnya harga sewa pasti, jaminan untung), assistant mengatakannya alih-alih menebak
- [ ] Rate limit: maksimal 20 pesan per sesi; error ditampilkan sebagai pesan yang ramah
- [ ] Sebuah test set berisi 10 prompt dijalankan; setiap angka di balasan cocok dengan data (hasil dicatat di `docs/chat_eval.md`)
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-018: Menjalankan studi validasi user
**Deskripsi:** Sebagai tim, kami butuh bukti bahwa Ascend membantu calon pemilik usaha sungguhan, untuk pitching di Final Day.

**Acceptance Criteria:**
- [ ] Minimal 10 calon pemilik usaha berpartisipasi (persetujuan dicatat, tidak ada data pribadi yang disimpan selain nama depan/inisial)
- [ ] Setiap peserta menyusun shortlist 3 area untuk kios kopi sebanyak dua kali: sekali hanya dengan Google Maps, sekali dengan Ascend (urutannya diselang-seling antar-peserta)
- [ ] **Shortlist dinilai terhadap ground truth, bukan terhadap label Ascend sendiri** (memakai label Ascend akan sirkular). Ground truth = outlet yang benar-benar terlihat saat field check (US-019). Supaya ini bisa dilakukan, tugas studi dibatasi ke sekumpulan area kandidat yang tetap dan semuanya sudah di-field-check
- [ ] Metrik utama per tugas: rata-rata jumlah outlet kopi hasil field check per area yang masuk shortlist (lebih rendah = lebih baik). Metrik sekunder: waktu menyusun shortlist, rating keyakinan (1–5)
- [ ] Hasil dirangkum dengan jujur di `docs/validation.md`, termasuk temuan negatif
- [ ] Hasil mentah yang sudah dianonimkan disimpan di `docs/validation_raw.csv`

#### US-019: Field check area opportunity teratas
**Deskripsi:** Sebagai tim, kami perlu mengecek apakah area "opportunity" benar-benar lebih sepi, termasuk outlet yang tidak tercatat di data terbuka.

**Acceptance Criteria:**
- [ ] Dipilih 10 hexagon `opportunity` dengan gap tertinggi, ditambah area kandidat tambahan yang dipakai di studi validasi (US-018)
- [ ] Setiap area dicek lewat kunjungan langsung atau citra street-level; yang dicatat: outlet yang benar-benar terlihat (termasuk warung/kios informal), catatan, tanggal
- [ ] Hasil dan persentase area yang terkonfirmasi "tidak crowded" ditulis ke `docs/field_check.md`

---

### Fase 3 — Final Day (16 Des 2026)

#### US-020: Membandingkan area di shortlist secara berdampingan
**Deskripsi:** Sebagai user, saya ingin membandingkan 2–3 area di shortlist secara berdampingan supaya bisa membuat pilihan akhir.

**Acceptance Criteria:**
- [ ] Dari panel shortlist, user memilih 2 atau 3 area lalu mengklik "Compare"
- [ ] Tampilan perbandingan menampilkan satu kolom per area: label, actual vs expected, gap, confidence, 3 faktor teratas
- [ ] Jika area yang dipilih kurang dari 2, tombol "Compare" dinonaktifkan dan ditampilkan petunjuk
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

#### US-021: Layer harga sewa dari pemilik yang memberi izin
**Deskripsi:** Sebagai user, saya ingin melihat contoh harga sewa supaya saya bisa mencoret area yang di luar kemampuan saya.

**Acceptance Criteria:**
- [ ] Form sederhana memungkinkan pemilik properti mengirim: sewa bulanan (IDR), luas tempat (m²), pin lokasi, dan checkbox persetujuan yang eksplisit; pengiriman diblokir tanpa persetujuan
- [ ] Hanya ID hexagon, harga sewa, dan luas yang disimpan dan ditampilkan — tidak pernah pin persis, nama, atau kontak
- [ ] Toggle peta "Show rent samples" menampilkan median sewa per hexagon untuk hexagon dengan ≥ 1 sampel, beserta jumlah sampelnya
- [ ] Sampel apa pun bisa dihapus oleh tim atas permintaan (prosesnya didokumentasikan di README)
- [ ] **Sumber data (diputuskan 22 Nov 2026):** kumpulkan sampel asli dari pemilik yang memberi izin di sekitar Telkom University terlebih dulu; jika sampai Final Day sampel asli kurang dari 15, kekurangannya diisi sampel sintetis
- [ ] Setiap sampel punya field `source` (`real_consented` atau `synthetic`); peta dan demo menunjukkan dengan jelas mana yang mana, dan sampel sintetis tidak pernah dicampur ke median yang sama dengan sampel asli tanpa diberi keterangan
- [ ] Typecheck/lint lolos
- [ ] Verifikasi di browser menggunakan skill dev-browser

---

## 4. Functional Requirements

**Data pipeline**
- FR-1: Pipeline hanya boleh memakai data terbuka: Overture Maps Places, OpenStreetMap, dan WorldPop.
- FR-2: Pipeline harus membangun grid H3 resolution 9 yang mencakup Kota Bandung ditambah lingkaran dengan radius yang bisa diatur di sekitar Telkom University.
- FR-3: Pipeline harus menggabungkan record coffee shop dari Overture dan OSM serta menghapus duplikat (berjarak ≤ 30 m dengan nama yang mirip).
- FR-4: Pipeline harus menghitung demand feature per hexagon (populasi, kampus, sekolah, kantor, halte, stasiun; jumlah k-ring; jarak) dan harus gagal jika ada jumlah outlet makanan yang dipakai sebagai fitur.
- FR-5: Pipeline harus bisa diatur per jenis usaha lewat `categories.yaml`, tanpa perubahan kode.
- FR-6: Setiap tahap harus bisa dijalankan sendiri, dan seluruh pipeline harus bisa dijalankan dengan satu perintah yang terdokumentasi.

**Model**
- FR-7: Sistem harus melatih model LightGBM Poisson untuk memprediksi jumlah outlet dari demand feature.
- FR-8: Sistem harus mengevaluasi model dan baseline berbasis populasi saja dengan 5-fold spatial cross-validation yang dikelompokkan berdasarkan parent cell H3 resolution 7.
- FR-9: Expected count yang ditampilkan ke user harus berupa OOF prediction untuk hexagon tersebut.
- FR-10: Sistem harus memberi label `opportunity`, `fair`, `crowded`, atau `not_enough_demand` pada setiap hexagon menggunakan threshold di `labels.yaml`.
- FR-11: Sistem harus menandai hexagon dengan data POI sekitar yang jarang sebagai `confidence = low`.
- FR-12: Sistem harus menghasilkan 3 faktor SHAP teratas per hexagon dengan teks yang mudah dipahami, menggunakan model fold yang sama dengan yang menghasilkan expected count hexagon tersebut.

**Web app**
- FR-13: Web app harus menampilkan peta hexagon berlabel dengan legenda dan atribusi data.
- FR-14: Web app harus memungkinkan user memilih jenis usaha; jenis yang belum tersedia harus terlihat jelas nonaktif.
- FR-15: Saat user mengklik hexagon, web app harus membuka kartu area berisi label, actual count, expected count, faktor, dan peringatan confidence bila relevan.
- FR-16: Web app harus memungkinkan user menyimpan hingga 10 area ke shortlist yang disimpan di browser.
- FR-17: Web app harus menampilkan panel "About the method" berisi versi data, metrik, dan keterbatasan.
- FR-18: Web app harus berjalan di browser mobile (lebar ≥ 375 px) dan desktop.

**Backend dan AI (Fase 2)**
- FR-19: Backend harus menyediakan endpoint area dan metadata seperti yang didefinisikan di US-015.
- FR-20: Chat assistant hanya boleh mendapat fakta area lewat function backend, dan harus menolak pertanyaan yang tidak bisa dijawab oleh data.
- FR-21: API key hanya boleh ada di server, dimuat dari environment variable.

**Final Day (Fase 3)**
- FR-22: Web app harus memungkinkan perbandingan 2–3 area dari shortlist secara berdampingan.
- FR-23: Sampel harga sewa hanya boleh diterima dengan persetujuan eksplisit dan hanya boleh ditampilkan dalam bentuk agregat per hexagon.

**Kejujuran dan kepatuhan**
- FR-24: Setiap fitur yang belum selesai harus ditandai "Coming soon" di UI dan dicantumkan sebagai Planned di README.
- FR-25: README harus mengungkapkan bantuan AI yang signifikan (alat dan perannya) serta semua data/library pihak ketiga beserta lisensinya.

---

## 5. Non-Goals (Di Luar Scope)

- Tidak memprediksi omzet, keuntungan, atau peluang usaha bertahan — Ascend hanya membandingkan pasokan dengan permintaan yang umum.
- Tidak ada jaminan atau rekomendasi bahwa sebuah usaha akan berhasil; Ascend bukan nasihat keuangan.
- Tidak mencakup kota selain Kota Bandung dan area Telkom University.
- Tidak mencakup jenis usaha selain coffee shop (P1) dan eatery (P2).
- Tidak ada akun user, login, atau shortlist yang disinkronkan ke cloud.
- Tidak ada data real-time atau data keramaian pengunjung langsung.
- Tidak melakukan scraping Google Maps atau sumber lain yang melarangnya di syarat penggunaannya.
- Tidak ada aplikasi mobile native (web app-nya harus mobile-friendly sebagai gantinya).
- Tidak ada pembayaran, marketplace listing, atau pencocokan penyewa–pemilik (itu yang dilakukan LapakIn).
- Tidak ada backend di Fase 1 — prototipe semifinal sepenuhnya statis.

---

## 6. Pertimbangan Desain

- **Audiens:** pemilik usaha pemula yang awam teknologi. Hindari kata seperti "residual", "SHAP", atau "H3" di UI; pakai "areas", "coffee shops here", "demand typically supports".
- **Bahasa:** UI dalam bahasa Inggris (bahasa kompetisi). Terjemahan bahasa Indonesia bisa ditambahkan nanti.
- **Layout:** peta layar penuh; selector jenis usaha dan tombol "About" di atas; legenda di kiri bawah; kartu area sebagai side panel kanan (desktop) atau bottom sheet (mobile); shortlist sebagai panel yang bisa diciutkan.
- **Warna:** hijau / kuning / merah / abu-abu juga harus berbeda tingkat terangnya supaya user buta warna bisa membedakannya; teks label selalu ditampilkan di samping warna pada kartu.
- **Aksesibilitas:** semua tombol bisa dijangkau dengan keyboard; kartu area bisa ditutup dengan Esc; rasio kontras teks ≥ 4.5:1.
- **Mockup:** mockup Figma untuk layar P2/P3 (chat, perbandingan, layer sewa) boleh ditampilkan di video semifinal, dengan label "Mockup" yang jelas.

---

## 7. Pertimbangan Teknis

**Usulan struktur repository**
```
ascend/
├── pipeline/            # Python 3.11
│   ├── config/          # categories.yaml, labels.yaml, feature_labels.yaml, area.yaml
│   ├── data/            # raw/ (git-ignored), processed/, SOURCES.md
│   ├── models/          # model fold + metrics.json
│   └── src/             # 01_grid, 02_places, 03_features, 04_train, 05_score, 06_explain, 07_export
├── web/                 # Nuxt 3 + MapLibre GL JS; public/data/*.geojson
├── api/                 # FastAPI (Fase 2)
└── docs/                # model_report.md, validation.md, field_check.md, figures/
```

**Library (saran):** Pipeline: `duckdb` (query Overture), `osmnx` atau Overpass API (OSM), `rasterio` + `exactextract`/`rasterstats` (WorldPop), `h3` v4, `geopandas`, `lightgbm`, `shap`, `scikit-learn` (GroupKFold, baseline), `rapidfuzz` (pencocokan nama), `ruff`. Web: `nuxt` 3, `maplibre-gl`. Basemap: **OpenFreeMap** (gratis, tanpa API key, berbasis OSM; atribusinya harus tetap terlihat).

**Risiko dan batasan yang diketahui**
- **Model yang sirkular:** model dilatih dari jumlah outlet saat ini, jadi yang dipelajari adalah di mana outlet *biasanya* berada untuk tingkat permintaan tertentu, bukan permintaan yang sebenarnya. Ini diterima dan dijelaskan: gap menunjukkan area yang berbeda dari pola umum di seluruh kota. Memakai demand feature saja dan OOF prediction membatasi efek ini. Hal ini wajib disebutkan di proposal dan panel About.
- **Warung/kios informal yang tidak tercatat:** data terbuka menghitung warung dan kios kecil lebih sedikit dari kenyataan → ditangani lewat flag confidence rendah dan field check (US-019).
- **Tahun data yang berbeda:** tahun WorldPop bisa berbeda dari tahun Overture/OSM → catat tahunnya di `meta.json` dan panel About.
- **Akurasi kategori:** kategori Overture bisa salah (misalnya restoran yang ditandai sebagai cafe) → spot check manual 30 record acak, tingkat errornya dicatat di `model_report.md`.
- **Lisensi:** data OSM wajib diberi atribusi "© OpenStreetMap contributors" (ODbL); WorldPop berlisensi CC BY 4.0; lisensi Overture berbeda-beda per sumber — cek lisensi tema Places untuk rilis yang dipakai.
- **Performa:** ~2.000 hexagon bisa dirender dengan lancar sebagai satu layer GeoJSON di MapLibre; tidak perlu tiling.
- **Privasi:** Fase 1 tidak menyimpan data pribadi apa pun. Data dari orang di Fase 2/3 (studi validasi, sampel sewa) diminimalkan, disetujui pemiliknya, dan dianonimkan.
- **Secret:** Gemini API key hanya ada di environment variable server; tidak pernah ada di repo atau bundle web.

---

## 8. Metrik Keberhasilan

**Model (saat semifinal)**
- Mean Poisson deviance LightGBM pada spatial CV **minimal 10% lebih rendah** daripada baseline berbasis populasi saja.
- Korelasi Spearman antara expected dan actual count pada fold yang ditahan ≥ 0.5.
- Tingkat error spot check kategori dilaporkan (target ≤ 15%).

**Produk (saat semifinal)**
- User baru bisa sampai ke shortlist tersimpan berisi 3 area dalam kurang dari 2 menit (diuji dengan 3 orang di luar tim).
- Situs termuat dan merender peta dalam kurang dari 3 detik pada Fast 4G.
- Tidak ada satu pun fitur yang ditampilkan sebagai selesai padahal belum.

**Dampak (saat Final Day)**
- Dalam studi validasi (≥ 10 orang), area yang masuk shortlist dengan Ascend punya **rata-rata outlet kopi hasil field check yang lebih sedikit** dibanding area yang masuk shortlist dengan Google Maps saja (dinilai terhadap ground truth hasil field check, bukan label Ascend).
- Sekunder: waktu menyusun shortlist dengan Ascend tidak lebih lama dibanding tanpa Ascend, dan rata-rata rating keyakinannya lebih tinggi.
- Minimal 7 dari 10 area `opportunity` yang di-field-check terkonfirmasi tidak crowded.

> Ini adalah target. Kalau hasilnya tidak tercapai, hasil harus dilaporkan apa adanya (aturan kompetisi tentang pelaporan yang akurat).

---

## 9. Keputusan dan Open Question

### Keputusan (diputuskan 22 Nov 2026)

| # | Pertanyaan | Keputusan | Diterapkan di |
|---|---|---|---|
| 1 | Batas area Telkom | Lingkaran radius 3 km di sekitar kampus utama | US-002 |
| 2 | Threshold label | Aturan tetap (`gap ≥ 1 & ratio ≤ 0.67` / `gap ≤ −1 & ratio ≥ 1.5`), di-tune hanya jika satu label mencakup > 60% hexagon | US-006 |
| 3 | Definisi coffee shop | Coffee shop, cafe, dan kios/stand kopi; tanpa roastery, tempat dessert, atau toko biji kopi | US-003 |
| 4 | Definisi eatery (P2) | Warung makan, rumah makan, restoran kasual; tanpa fast-food chain atau fine dining | US-016 |
| 5 | Tahun WorldPop | Tahun terbaru yang tersedia apa adanya, tahunnya ditampilkan ke user | US-004, US-013 |
| 6 | Basemap | OpenFreeMap | US-009, §7 |
| 7 | Pembagian tugas | Aprilianza memegang data pipeline dan model (US-001 – US-008) | Tabel prioritas Fase 1 |
| 8 | Sampel sewa (P3) | Sampel asli yang disetujui pemilik dulu, ditambah fallback sintetis berlabel jika kurang dari 15 | US-021 |

### Masih terbuka

1. **Pembagian tugas anggota lain:** siapa yang memegang web map (US-009 – US-014), proposal, video, dan studi validasi? Dibutuhkan untuk bagian "member contributions" di proposal.
2. **Nilai akhir threshold label:** baru dipastikan setelah pipeline dijalankan pertama kali (US-006).
3. **Nama kategori Overture yang persis:** dipastikan setelah kategori di rilis tersebut didaftar (US-003).
4. **Area kandidat untuk studi validasi:** kumpulan area tetap yang menjadi pilihan peserta, supaya semuanya bisa di-field-check (US-018, US-019).
