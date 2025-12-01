# 📊 Panduan Analisis Spasial - WebGIS Kecamatan Gunung Puyuh

> **Dokumentasi lengkap fitur analisis spasial menggunakan Turf.js**

---

## 🎯 Daftar Isi

- [Fitur Analisis yang Tersedia](#-fitur-analisis-yang-tersedia)
- [Cara Penggunaan](#-cara-penggunaan)
- [Detail Setiap Analisis](#-detail-setiap-analisis)
- [Interpretasi Hasil](#-interpretasi-hasil)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Best Practices](#-best-practices)

---

## 🚀 Fitur Analisis yang Tersedia

WebGIS ini dilengkapi dengan **7 mode analisis spasial** yang komprehensif untuk menganalisis aksesibilitas fasilitas pendidikan dan kesehatan:

### 1. 🎯 Fasilitas Terdekat (Nearest Facility)
Mencari 1 fasilitas terdekat dari lokasi yang dipilih.

**Kegunaan:**
- Identifikasi fasilitas paling mudah dijangkau
- Rekomendasi fasilitas untuk lokasi tertentu
- Analisis aksesibilitas individual

### 2. 🏆 Top 5 Terdekat (Top N Analysis)
Mencari 5 fasilitas terdekat dengan visualisasi ranking.

**Kegunaan:**
- Melihat alternatif fasilitas dalam satu analisis
- Perbandingan jarak dan waktu tempuh multiple fasilitas
- Perencanaan rute alternatif

### 3. 📏 Ukur Jarak (Distance Measurement)
Mengukur jarak linear antara 2 titik di peta.

**Kegunaan:**
- Kalkulasi jarak antara lokasi
- Estimasi waktu tempuh (berjalan kaki dan bersepeda)
- Perencanaan rute

### 4. ⭕ Service Area (Buffer Analysis)
Analisis area layanan dengan 3 zona buffer (500m, 1km, 1.5km).

**Kegunaan:**
- Identifikasi coverage area fasilitas
- Hitung jumlah fasilitas dalam radius tertentu
- Gap analysis sederhana

### 5. 🕐 Isochrone Analysis
Analisis zona aksesibilitas berdasarkan waktu tempuh (5, 10, 15, 20, 25+ menit).

**Kegunaan:**
- Visualisasi zona aksesibilitas berbasis waktu
- Penilaian kualitas layanan berdasarkan standar WHO
- Identifikasi area dengan akses optimal vs buruk

### 6. ⚠️ Gap Analysis
Analisis mendalam kesenjangan aksesibilitas berdasarkan standar internasional.

**Kegunaan:**
- Identifikasi area under-served
- Penilaian tingkat gap (Critical, Moderate, Minor, Well Served)
- Rekomendasi pembangunan fasilitas baru
- Distribusi tipe fasilitas

### 7. ⚖️ Compare Locations
Perbandingan aksesibilitas antara 2 lokasi berbeda.

**Kegunaan:**
- Bandingkan kualitas aksesibilitas 2 area
- Identifikasi kesenjangan regional
- Validasi keputusan lokasi pembangunan

---

## 📖 Cara Penggunaan

### Langkah Umum:

1. **Buka Panel Analisis**
   - Klik tombol **"📊 Analisis"** di pojok kiri bawah peta

2. **Pilih Mode Analisis**
   - Klik salah satu dari 7 tombol mode analisis
   - Tombol yang aktif akan berubah warna menjadi ungu

3. **Klik pada Peta**
   - Untuk mode 1 klik: Klik 1 kali di lokasi yang ingin dianalisis
   - Untuk mode 2 klik: Klik 2 kali untuk menandai 2 lokasi

4. **Lihat Hasil**
   - Hasil analisis akan muncul di bagian bawah panel
   - Visualisasi akan muncul di peta

5. **Bersihkan Analisis**
   - Klik tombol **"Bersihkan"** untuk menghapus hasil
   - Pilih mode baru untuk analisis berbeda

---

## 🔍 Detail Setiap Analisis

### 🎯 1. Fasilitas Terdekat

**Input:** 1 klik pada peta

**Output:**
- Garis penghubung ke fasilitas terdekat
- Marker di fasilitas terdekat
- Info jarak (km)
- Estimasi waktu tempuh berjalan kaki

**Perhitungan:**
```javascript
// Menggunakan Turf.js distance function
distance = turf.distance(userPoint, facilityPoint, { units: 'kilometers' })
walkingTime = (distance / 5) * 60 // 5 km/jam rata-rata
```

**Use Case:**
- Masyarakat mencari sekolah/puskesmas terdekat
- Emergency planning
- Daily commute analysis

---

### 🏆 2. Top 5 Terdekat

**Input:** 1 klik pada peta

**Output:**
- 5 fasilitas terdekat dengan nomor ranking
- Garis penghubung berwarna berbeda
- List terurut dengan jarak dan waktu tempuh
- Marker bernomor di setiap fasilitas

**Fitur Unggulan:**
- Warna berbeda untuk setiap ranking (#1 hijau, #2 biru, dst)
- Sortir otomatis berdasarkan jarak
- Informasi komprehensif setiap fasilitas

**Use Case:**
- Membandingkan beberapa pilihan sekolah
- Mencari alternatif jika fasilitas pertama penuh
- Survey kebutuhan transportasi

---

### 📏 3. Ukur Jarak

**Input:** 2 klik pada peta (titik A dan B)

**Output:**
- Garis penghubung berwarna kuning
- Label jarak di tengah garis
- Jarak dalam km dan meter
- Waktu tempuh berjalan kaki dan bersepeda

**Perhitungan:**
```javascript
distance_km = turf.distance(pointA, pointB, { units: 'kilometers' })
walking_time = (distance / 5) * 60 // 5 km/jam
biking_time = (distance / 15) * 60 // 15 km/jam
```

**Use Case:**
- Mengukur jarak rumah ke sekolah
- Perencanaan jalur pedestrian
- Validasi radius layanan

---

### ⭕ 4. Service Area

**Input:** 1 klik pada peta

**Output:**
- 3 zona buffer konsentris:
  - **500m** (hijau) - Walkable zone
  - **1 km** (kuning) - Recommended zone
  - **1.5 km** (merah) - Extended zone
- Jumlah fasilitas di setiap zona
- Status aksesibilitas (Well served / Gap)

**Standar Referensi:**
- **500m** → Ideal walking distance (WHO)
- **1 km** → Standard service area
- **1.5 km** → Extended coverage

**Use Case:**
- Pemetaan coverage area
- Identifikasi gap area awal
- Perencanaan lokasi fasilitas baru

---

### 🕐 5. Isochrone Analysis

**Input:** 1 klik pada peta

**Output:**
- 5 zona waktu tempuh (5, 10, 15, 20, 25+ menit)
- Jumlah fasilitas di setiap zona waktu
- Penilaian aksesibilitas otomatis
- Rekomendasi berdasarkan standar WHO

**Zona Waktu:**
- **≤5 menit** (hijau) → Excellent accessibility
- **≤10 menit** (cyan) → Good accessibility  
- **≤15 menit** (kuning) → Acceptable (WHO standard)
- **≤20 menit** (orange) → Moderate
- **≤25+ menit** (merah) → Poor accessibility

**Asumsi Kecepatan:**
- Walking speed: **5 km/jam**
- Jarak = Waktu × (5/60)

**Penilaian Otomatis:**
```
✓ Akses Baik: ≥3 fasilitas dalam 15 menit
⚠ Akses Sedang: 1-2 fasilitas dalam 15 menit
✗ GAP AKSESIBILITAS: 0 fasilitas dalam 15 menit
```

**Use Case:**
- Analisis time-based accessibility
- Compliance check dengan standar WHO
- Prioritas area untuk pengembangan

---

### ⚠️ 6. Gap Analysis

**Input:** 1 klik pada peta

**Output:**
- **Status Gap:** Critical / Moderate / Minor / Well Served
- 2 zona analisis:
  - **Zona Ideal** (≤500m) - hijau
  - **Zona Standar** (≤1km) - kuning
- Jumlah fasilitas di setiap zona
- Distribusi tipe fasilitas
- Rekomendasi pembangunan

**Kriteria Penilaian:**

| Status | Zona Ideal | Zona Standar | Level |
|--------|-----------|--------------|-------|
| **CRITICAL GAP** | 0 | 0 | Akses Sangat Buruk |
| **MODERATE GAP** | 0 | >0 | Akses Sedang |
| **MINOR GAP** | 1 | >1 | Akses Cukup |
| **WELL SERVED** | ≥2 | ≥2 | Akses Baik |

**Rekomendasi Otomatis:**
- Jika zona ideal kosong → Pembangunan dalam 500m
- Jika <3 fasilitas zona standar → Tambah fasilitas
- Jika <2 tipe → Diversifikasi jenis fasilitas
- Jika well served → Area sudah terlayani baik

**Use Case:**
- **Urban planning** - Identifikasi lokasi pembangunan baru
- **Gap identification** - Temukan area under-served
- **Policy making** - Data driven decision
- **Resource allocation** - Prioritas pengembangan infrastruktur

---

### ⚖️ 7. Compare Locations

**Input:** 2 klik pada peta (Lokasi A dan B)

**Output:**
- 2 zona buffer 1km (biru untuk A, merah untuk B)
- Perbandingan jumlah fasilitas
- Fasilitas terdekat dari masing-masing lokasi
- Analisis komparatif

**Informasi Ditampilkan:**
- Total fasilitas dalam radius 1km untuk setiap lokasi
- Nama dan jarak fasilitas terdekat
- Selisih jumlah fasilitas
- Kesimpulan lokasi mana yang lebih baik

**Use Case:**
- Perbandingan 2 area perumahan
- Validasi lokasi pembangunan
- Site selection analysis
- Regional equity assessment

---

## 📊 Interpretasi Hasil

### Standar WHO untuk Aksesibilitas:
- **Pendidikan Dasar (SD):** ≤1 km atau 15 menit berjalan
- **Pendidikan Menengah (SMP/SMA):** ≤2 km atau 25 menit
- **Fasilitas Kesehatan Primer:** ≤1 km atau 15 menit

### Kategori Aksesibilitas:

| Jarak | Waktu | Kategori | Status |
|-------|-------|----------|--------|
| ≤500m | ≤5 menit | Excellent | ✅ Ideal |
| 500m-1km | 5-15 menit | Good | ✅ Baik |
| 1-1.5km | 15-20 menit | Acceptable | ⚠️ Cukup |
| 1.5-2km | 20-25 menit | Moderate | ⚠️ Sedang |
| >2km | >25 menit | Poor | ❌ Buruk |

### Rekomendasi Berdasarkan Hasil:

#### ✅ WELL SERVED Area:
- Maintain existing facilities
- Focus on quality improvement
- Monitor population growth

#### ⚠️ MODERATE GAP Area:
- Consider adding 1-2 new facilities
- Improve transportation access
- Temporary mobile services

#### ❌ CRITICAL GAP Area:
- **URGENT:** Build new facilities within 6-12 months
- Provide temporary shuttle services
- Community outreach programs
- Budget priority allocation

---

## 🛠️ Teknologi yang Digunakan

### Turf.js Functions:
1. **`turf.point(coordinates)`** - Membuat point geometry
2. **`turf.distance(from, to, options)`** - Hitung jarak antara 2 titik
3. **`turf.buffer(feature, radius, options)`** - Buat buffer zone
4. **`turf.booleanPointInPolygon(point, polygon)`** - Cek apakah point dalam polygon

### Leaflet Integration:
- **L.circleMarker()** - Marker untuk lokasi analisis
- **L.polyline()** - Garis penghubung
- **L.polygon()** - Buffer zones dan isochrone
- **L.divIcon()** - Custom marker (numbered, labeled)

### Algoritma:
```javascript
// 1. Nearest Facility
facilities.forEach(facility => {
    distance = turf.distance(userPoint, facilityPoint)
    if (distance < minDistance) {
        minDistance = distance
        nearestFacility = facility
    }
})

// 2. Top N
facilitiesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, N)

// 3. Buffer Count
buffer = turf.buffer(point, radius)
count = facilities.filter(f => 
    turf.booleanPointInPolygon(f.geometry, buffer)
).length
```

---

## 💡 Best Practices

### Untuk Pengguna:

1. **Gunakan mode yang tepat:**
   - Cari 1 fasilitas → Nearest
   - Bandingkan pilihan → Top 5
   - Analisis mendalam → Gap Analysis atau Isochrone

2. **Interpretasi konteks:**
   - Pertimbangkan topografi (tanjakan, sungai)
   - Waktu tempuh aktual bisa lebih lama
   - Cek kondisi jalan dan transportasi umum

3. **Validasi lapangan:**
   - Hasil analisis adalah estimasi
   - Survey langsung untuk keputusan penting
   - Pertimbangkan faktor non-spasial (kualitas, kapasitas)

### Untuk Developer:

1. **Performance:**
   ```javascript
   // Good: Filter dulu, hitung kemudian
   const nearbyFacilities = facilities.filter(f => 
       roughDistance(userPoint, f) < maxDistance * 2
   )
   nearbyFacilities.forEach(f => turf.distance(...))
   
   // Bad: Hitung semua
   facilities.forEach(f => turf.distance(...))
   ```

2. **Error Handling:**
   ```javascript
   if (this.state.allFacilities.length === 0) {
       this.showResults('Tidak ada data fasilitas.', 'error')
       return
   }
   ```

3. **User Feedback:**
   - Clear instructions untuk setiap mode
   - Loading indicators untuk operasi berat
   - Informative error messages

4. **Modularity:**
   - Pisahkan logic analisis dari UI
   - Reusable helper functions
   - Consistent naming conventions

---

## 📈 Use Cases Penelitian

### 1. Thesis/Skripsi:
- **Judul:** "Analisis Kesenjangan Aksesibilitas Fasilitas Pendidikan di Kecamatan Gunung Puyuh"
- **Data:** Gunakan Gap Analysis untuk identifikasi area kritis
- **Visualisasi:** Screenshot hasil Isochrone untuk peta aksesibilitas

### 2. Policy Brief:
- **Rekomendasi:** Gunakan Compare Analysis untuk justify lokasi pembangunan
- **Prioritas:** Rank area berdasarkan severity gap (Critical > Moderate > Minor)

### 3. Community Planning:
- **Public Consultation:** Gunakan Top 5 untuk show alternatif ke masyarakat
- **Service Evaluation:** Buffer Analysis untuk evaluasi coverage existing

---

## 🎓 Kesimpulan

Fitur analisis spasial ini menyediakan:
- ✅ **7 mode analisis** komprehensif
- ✅ **Berbasis standar internasional** (WHO)
- ✅ **Visualisasi interaktif** dan informatif
- ✅ **Rekomendasi otomatis** berbasis data
- ✅ **Technology stack modern** (Turf.js + Leaflet)
- ✅ **Mobile responsive** dan user-friendly

**Perfect untuk:**
- 🎓 Penelitian akademik
- 🏛️ Perencanaan kota
- 📊 Analisis kebijakan
- 🗺️ GIS professional work
- 👥 Community engagement

---

**Dikembangkan oleh:** Tim WebGIS Kecamatan Gunung Puyuh  
**Technology:** Turf.js 6.x + Leaflet 1.9.4  
**Last Updated:** December 2025  

---

## 📞 Support

Jika menemukan bug atau ada pertanyaan:
- 📧 Open issue di GitHub repository
- 📚 Baca dokumentasi Turf.js: https://turfjs.org/
- 🗺️ Leaflet docs: https://leafletjs.com/

---

**Happy Analyzing! 🚀📊🗺️**
