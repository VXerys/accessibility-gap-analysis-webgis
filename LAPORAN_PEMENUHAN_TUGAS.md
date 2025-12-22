# Laporan Implementasi Fitur WebGIS
**Mata Kuliah: Sistem Informasi Geografis**

## Pendahuluan
Dalam proyek WebGIS Kecamatan Gunungpuyuh ini, saya telah mengimplementasikan fitur analisis spasial yang memenuhi kriteria tugas utama, yaitu pengambilan data dari API eksternal dan visualisasi layer interaktif. Fokus implementasi saya adalah pada aspek **Aksesibilitas dan Transportasi (Routing)**.

## 1. Implementasi API Eksternal
Untuk memenuhi kriteria pengambilan data dari API eksternal, saya menggunakan **OpenRouteService API**. API ini saya pilih karena relevansinya yang tinggi dengan kebutuhan analisis wilayah, khususnya untuk menghitung rute perjalanan nyata (bukan sekadar garis lurus) dan estimasi waktu tempuh.

Fitur ini saya bangun dalam modul `js/routing-service.js` yang bertugas menangani koneksi ke server OpenRouteService:

```javascript
// Cuplikan kode implementasi koneksi API (routing-service.js)
const RoutingService = {
  baseUrl: "https://api.openrouteservice.org/v2",

  async getRoute(start, end, profile = "driving-car") {
    const response = await fetch(
      `${this.baseUrl}/directions/${profile}/geojson`, 
      // ... konfigurasi header dan body
    );
    return await response.json();
  }
};
```

Penggunaan API ini diterapkan secara langsung pada fitur:
*   **Analisis Fasilitas Terdekat (Nearest Analysis):** Menghitung rute jalan raya dari lokasi pengguna ke fasilitas publik (Sekolah/RS) terdekat.
*   **Pengukuran Jarak (Measure Route):** Mengukur jarak tempuh real-time antar dua titik yang dipilih pengguna.

---
Visualisasi Layer Interaktif
## 2. Visualisasi Layer Interaktif
Hasil data yang diambil dari API ( berupa geometri jalan/path) tidak hanya ditampilkan sebagai teks, tetapi dirender sebagai **Layer GeoJSON Interaktif** di atas peta.

Sistem yang saya buat memungkinkan pengguna untuk:
1.  Mengklik sembarang lokasi pada peta sebagai titik awal.
2.  Secara otomatis sistem akan menghubungi API dan menggambar jalur rute jalan raya di atas peta.
3.  Layer ini bersifat dinamis; setiap kali pengguna melakukan analisis baru, layer lama akan dibersihkan dan diganti dengan layer hasil analisis terbaru.

Berikut adalah tampilan antarmuka fitur analisis yang telah saya buat:

![Tampilan Menu Analisis](img/menu_analisis_screenshot.png)
*(Catatan: Foto di atas adalah tampilan menu "Data Analisis" yang memuat fitur Terdekat dan Ukur Jarak)*

[MASUKKAN FOTO 2: CONTOH HASIL RUTE JALAN BERWARNA BIRU/MERAH DI PETA SETELAH KLIK FITUR "UKUR JARAK" ATAU "TERDEKAT"]
*Gambar 1. Visualisasi Interactive Layer berupa rute jalan raya yang diambil dari API.*

## Kesimpulan
Berdasarkan implementasi di atas, saya menyimpulkan bahwa proyek ini **telah memenuhi** kriteria tugas:
1.  **Mengambil Data API:** Terpenuhi melalui integrasi OpenRouteService untuk data navigasi/routing.
2.  **Layer Interaktif:** Terpenuhi melalui visualisasi jalur rute dinamis pada peta menggunakan Leaflet GeoJSON layer.
