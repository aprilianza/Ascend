# Data Contract Ascend v1.0.0

**Berlaku sejak:** 24 Nov 2026 · **Pemilik:** Aprilianza (pipeline) dan Bill (web) · **Acuan:** PRD v3.1 (`tasks/prd-ascend-v3-id.md`), US-006, US-007, US-008, US-011

Dokumen ini adalah perjanjian bentuk data antara **pipeline** (yang menghasilkan file) dan **web app** (yang membacanya). Selama kedua pihak mengikuti kontrak ini, pipeline dan web bisa dikerjakan paralel, dan data contoh bisa diganti data asli tanpa mengubah kode UI.

Di Fase 2, isi file yang sama menjadi response body `GET /areas?business_type=<type>` dan `GET /meta` (US-015). Kontrak ini tidak perlu ditulis ulang, cukup ditambah bagian endpoint.

---

## 1. File dan lokasinya

| File | Isi | Sumber resmi bentuknya |
|---|---|---|
| `web/public/data/meta.json` | Jenis usaha yang tersedia, versi data, metrik model, parameter label, jumlah per label | `docs/schema/meta.schema.json` |
| `web/public/data/coffee_shop.geojson` | Satu heksagon per Feature, dengan label dan angka untuk kartu area | `docs/schema/areas.schema.json` |
| `web/public/data/eatery.geojson` (P2) | Sama persis bentuknya | `docs/schema/areas.schema.json` |
| `web/types/areas.ts` | Tipe TypeScript untuk web app | Cerminan kedua schema di atas |
| `pipeline/tools/contract.py` | Validator (schema + aturan isi) dan aturan label | Dipakai oleh generator contoh dan nanti oleh `07_export` |

**Urutan baca di web app:** muat `meta.json` dulu, lalu muat file dari `business_types[].file` untuk jenis usaha yang dipilih. Jangan menulis nama file secara manual di komponen.

---

## 2. Data contoh (yang ada sekarang)

File di `web/public/data/` saat ini adalah **data sintetis** hasil `pipeline/tools/make_sample_data.py` (seed 42):

- 57 heksagon di tiga kelompok: sekitar ITB (Coblong), sekitar Telkom University (Dayeuhkolot), dan Gedebage.
- Jumlah label: opportunity 8, fair 21, crowded 9, not_enough_demand 19.
- **Semua angkanya acak.** Label di file contoh tidak menggambarkan kondisi asli daerah-daerah itu.

Kasus tepi yang sengaja dimasukkan supaya semua state UI bisa didesain:

| Kasus | Ada di contoh | Yang harus dilakukan UI |
|---|---|---|
| Keempat label | Ya | Warna + badge + teks label |
| `confidence: "low"` | 21 heksagon (termasuk 2 di luar kelompok Gedebage) | Heksagon lebih transparan, garis putus-putus, catatan di kartu |
| `kecamatan: null` | 2 heksagon | Tampilkan "Unnamed area" |
| Nama kecamatan lebih panjang | "Cibeunying Kidul" | Layout tidak boleh pecah sampai 40 karakter |
| `actual: 0` / `actual_k1: 0` | Banyak | Tampilkan "0", bukan kosong |
| `p_value: null` | Semua `not_enough_demand` | Tidak memengaruhi UI (p_value tidak pernah ditampilkan) |
| Eatery belum tersedia | `available: false`, `file: null` | Opsi nonaktif dengan badge "Coming soon" |
| Metrik model belum ada | `model: null` | Panel About: "Metrics available after the first model run" |

**Aturan data contoh:** selama `is_sample` bernilai `true`, UI **wajib** menampilkan badge "Sample data" yang terlihat jelas. Data contoh tidak boleh dipakai untuk video, screenshot proposal, atau uji kegunaan. Aturan lomba melarang data simulasi yang tidak ditandai.

Membuat ulang data contoh:

```bash
pip install "h3>=4,<5" "jsonschema>=4"
```

```bash
python pipeline/tools/make_sample_data.py
```

---

## 3. Field `coffee_shop.geojson`

### Tingkat atas (FeatureCollection)

| Field | Tipe | Nilai | Catatan |
|---|---|---|---|
| `type` | string | `"FeatureCollection"` | |
| `contract_version` | string | `"1.x.y"` | Web app menolak file dengan versi mayor berbeda (`assertContract`) |
| `business_type` | string | `coffee_shop` \| `eatery` | |
| `is_sample` | boolean | | `true` = badge "Sample data" wajib tampil |
| `generated_at` | string | ISO 8601 UTC | Boleh ditampilkan di About sebagai "Data updated …" |
| `features` | array | ≥ 1 Feature | Hanya heksagon di dalam wilayah studi; sel buffer (US-002) tidak diekspor |

### Geometry

`Polygon` dengan satu ring berisi koordinat `[longitude, latitude]`, dibulatkan 5 desimal, ring tertutup (titik pertama = titik terakhir), arah berlawanan jarum jam (RFC 7946).

### `properties` per heksagon

| Field | Tipe | Nilai / format | Dipakai UI untuk | Contoh teks di UI |
|---|---|---|---|---|
| `h3` | string | ID H3 res 9 (`89…`, 15 karakter), unik | ID heksagon, `promoteId` MapLibre, key shortlist | (tidak ditampilkan) |
| `kecamatan` | string \| null | ≤ 40 karakter | Judul kartu, daftar shortlist | "Coblong" / "Unnamed area" |
| `area_name` | string | `kota_bandung` \| `telkom_area` | Subjudul atau filter (opsional) | "Bandung city" / "Telkom University area" |
| `actual` | integer | ≥ 0 | Tidak ditampilkan di P1 (cadangan untuk tooltip) | |
| `expected` | number | ≥ 0, 1 desimal | Tidak ditampilkan di P1 | |
| `actual_k1` | integer | ≥ 0 | Kartu area | "Coffee shops within about 500 m: **10**" |
| `expected_k1` | number | ≥ 0, 1 desimal | Kartu area | "Demand typically supports: about **8.9**" |
| `gap` | number | 1 desimal, bisa negatif | Tampilan perbandingan (P3), urutan | (P1 tidak wajib) |
| `p_value` | number \| null | 0 sampai 1, 4 desimal | **Tidak pernah ditampilkan** | |
| `label` | string | `opportunity` \| `fair` \| `crowded` \| `not_enough_demand` | Warna heksagon, badge kartu | "Opportunity" / "Fair" / "Crowded" / "Not enough demand" |
| `confidence` | string | `normal` \| `low` | Gaya heksagon, catatan di kartu | "Low confidence: open data may miss some outlets here, such as informal stalls." |
| `factors` | array of 3 | `{feature, text, effect}` | Daftar alasan di kartu | Judul: "What drives demand at this spot" |

### `factors[]`

| Field | Tipe | Dipakai UI |
|---|---|---|
| `feature` | string, `snake_case` | Tidak ditampilkan |
| `text` | string, ≤ 60 karakter | Ditampilkan apa adanya |
| `effect` | number | Hanya **tanda**-nya: ≥ 0 → ↑, < 0 → ↓ (`factorDirection`). **Angkanya tidak pernah ditampilkan** (skala log, US-007) |

Urutan `factors` sudah dari yang paling berpengaruh; UI tidak perlu mengurutkan ulang.

### Contoh satu Feature (dipotong)

```json
{
  "type": "Feature",
  "geometry": { "type": "Polygon", "coordinates": [[[107.60753, -6.89272], [107.60712, -6.89101], "…", [107.60753, -6.89272]]] },
  "properties": {
    "h3": "898c1479a5bffff",
    "kecamatan": "Coblong",
    "area_name": "kota_bandung",
    "actual": 1,
    "expected": 2.1,
    "actual_k1": 10,
    "expected_k1": 8.9,
    "gap": -1.1,
    "p_value": 0.3994,
    "label": "fair",
    "confidence": "normal",
    "factors": [
      { "feature": "pop_k1", "text": "Few residents nearby", "effect": -0.4 },
      { "feature": "office_k1", "text": "Few offices nearby", "effect": -0.3 },
      { "feature": "transit_k1", "text": "Good bus and angkot access", "effect": 0.3 }
    ]
  }
}
```

---

## 4. Field `meta.json`

| Field | Tipe | Dipakai UI untuk |
|---|---|---|
| `contract_version`, `generated_at`, `is_sample` | sama seperti di atas | Badge "Sample data", "Data updated …" |
| `business_types[]` | `{id, label, available, file}` | Isi pemilih jenis usaha; `available: false` → nonaktif + "Coming soon" |
| `data_sources[]` | `{name, version, license, attribution}` | Atribusi peta dan panel About |
| `model` | object \| null | Metrik di panel About; `null` → "Metrics available after the first model run" |
| `label_params` | `{method, alpha, min_gap, not_enough_demand_max_expected_k1, low_confidence_min_poi}` | Penjelasan aturan label di About (dalam bahasa sederhana, tanpa angka statistik) |
| `label_counts` | jumlah per label | Ringkasan opsional di About |

---

## 5. Aturan isi (dicek oleh `contract.py`, tidak bisa dicek oleh JSON Schema)

1. `h3` unik di dalam satu file.
2. `actual ≤ actual_k1`.
3. `gap = expected_k1 − actual_k1` (toleransi pembulatan 0,06).
4. `label = not_enough_demand` ⇔ `p_value = null`.
5. `opportunity` ⇒ `p_value < alpha` dan `gap ≥ min_gap`; `crowded` ⇒ `p_value < alpha` dan `gap ≤ −min_gap` (aturan PRD US-006).
6. `factors` terurut berdasarkan `|effect|` dari terbesar.
7. `label_counts` di `meta.json` sama dengan jumlah label sebenarnya di file.
8. `contract_version` dan `is_sample` sama di kedua file.
9. `business_type` file harus `available: true` di `meta.json`.
10. Ukuran GeoJSON maksimal 3 MB.

Menjalankan validator:

```bash
python pipeline/tools/contract.py web/public/data/coffee_shop.geojson web/public/data/meta.json
```

`07_export` wajib menjalankan validator ini sebelum menulis file. Kalau gagal, pipeline berhenti dan file lama tidak ditimpa.

---

## 6. Aturan UI yang terikat kontrak

- Ambil data hanya lewat satu fungsi, misalnya `getMeta()` dan `getAreas(type)`. Sekarang fungsi itu membaca `/data/…`; di Fase 2 cukup diganti ke URL API lewat environment variable (US-015).
- Panggil `assertContract(file.contract_version)` setelah memuat file.
- Jangan pernah menampilkan `p_value`, `effect`, `feature`, ID `h3`, atau kata "SHAP", "H3", "p-value" (PRD §6).
- Teks penjelasan angka (kartu, catatan keyakinan, About) disimpan di satu file teks UI. Bill yang merapikan bahasanya, Aprilianza yang mengecek akurasinya.
- MapLibre: tambahkan source dengan `promoteId: "h3"`, lalu warnai dengan expression `match` pada `label`. Contoh:

```js
map.addSource('areas', { type: 'geojson', data: areas, promoteId: 'h3' })
map.addLayer({
  id: 'areas-fill', type: 'fill', source: 'areas',
  paint: {
    'fill-color': ['match', ['get', 'label'],
      'opportunity', '#1a9850', 'fair', '#fee08b', 'crowded', '#d73027', /* not_enough_demand */ '#bdbdbd'],
    'fill-opacity': ['case', ['==', ['get', 'confidence'], 'low'], 0.35, 0.7]
  }
})
```

(Warna di atas hanya placeholder. Palet final ditentukan Bill, dengan syarat keempat label tetap bisa dibedakan oleh pengguna buta warna.)

---

## 7. Mengubah kontrak

| Jenis perubahan | Contoh | Versi | Prosedur |
|---|---|---|---|
| **Breaking** | Mengganti nama atau menghapus field, mengubah tipe, mengubah arti nilai | Mayor (2.0.0) | Diskusi dulu dengan Bill; ubah schema, `areas.ts`, `contract.py`, dan dokumen ini dalam satu commit; Bill memperbarui UI sebelum data baru dipakai |
| **Tambahan** | Field baru, nilai enum baru | Minor (1.1.0) | Kabari Bill; ubah keempat file dalam satu commit. Karena schema memakai `additionalProperties: false`, field baru **wajib** didaftarkan di schema dulu |
| **Perbaikan dokumen** | Salah ketik, contoh | Patch (1.0.1) | Langsung |

**Field dikunci mulai 25 Nov 2026.** Setelah tanggal itu, perubahan breaking hanya boleh kalau kedua pemilik setuju.

---

## 8. Jadwal pergantian ke data asli

| Tanggal | Kejadian |
|---|---|
| 24 Nov | Kontrak v1.0.0 + data contoh tersedia |
| 25 Nov | Kontrak dikunci; wireframe direview dengan acuan tabel §3 |
| 27 Nov | `07_export` menimpa `coffee_shop.geojson` dan `meta.json` dengan data asli (`is_sample: false`); uji bersama di browser |
| 28 Nov | Data v1 dibekukan; rekam layar untuk video |
