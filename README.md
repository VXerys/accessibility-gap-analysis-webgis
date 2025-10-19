# 🗺️ WebGIS Kecamatan Gunung Puyuh - Sistem Informasi Geografis

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()
[![Version](https://img.shields.io/badge/version-2.0.0-brightgreen.svg)]()

> **Sistem Informasi Geografis berbasis web untuk analisis aksesibilitas fasilitas pendidikan dan kesehatan di Kecamatan Gunung Puyuh, Sukabumi, Jawa Barat.**

---

## 📋 Daftar Isi

- [Tentang Proyek](#-tentang-proyek)
- [Tim Pengembang](#-tim-pengembang)
- [Case Problem](#-case-problem)
- [Fitur Utama](#-fitur-utama)
- [Teknologi](#-teknologi)
- [Struktur Project](#-struktur-project)
- [Instalasi & Cara Menjalankan](#-instalasi--cara-menjalankan)
- [Penggunaan](#-penggunaan)
- [Arsitektur](#-arsitektur)
- [Best Practices](#-best-practices)
- [Kontribusi](#-kontribusi)
- [Lisensi](#-lisensi)

---

## 🎯 Tentang Proyek

**WebGIS Kecamatan Gunung Puyuh** adalah aplikasi peta interaktif berbasis web yang dirancang untuk memvisualisasikan dan menganalisis distribusi fasilitas pendidikan dan kesehatan di Kecamatan Gunung Puyuh, Kota Sukabumi.

### Latar Belakang

Kecamatan Gunung Puyuh mengalami **transformasi urban yang sangat cepat** dalam 5 tahun terakhir akibat:

1. **Pembangunan perumahan masif** yang menggantikan lahan pertanian
2. **Lokasi strategis sebagai jalur lintas Jakarta** yang ramai
3. **Pertumbuhan penduduk tinggi** dari urbanisasi dan migrasi

Dampak yang terjadi menciptakan **kesenjangan aksesibilitas** terhadap fasilitas pendidikan dan kesehatan, terutama di kelurahan-kelurahan pinggiran yang baru berkembang.

### 👥 Tim Pengembang

| Nama | NIM | Role | GitHub |
|------|-----|------|--------|
| **M. Sechan Alfarisi** | 20230040094 | 🔧 Lead Developer & Repository Owner | [@VXerys](https://github.com/VXerys) |
| M. Akbar Rizky Saputra | 20230040236 | 👨‍💻 Developer | - |
| M. Fathir Bagas | 20230040126 | 👨‍💻 Developer | - |
| M. Sinar Agusta | 20230040188 | 👨‍💻 Developer | - |
| M. Ghibran Muslih | 20230040105 | 👨‍💻 Developer | - |

> **Repository**: [github.com/VXerys/accessibility-gap-analysis-webgis](https://github.com/VXerys/accessibility-gap-analysis-webgis)

---

## 🔴 Case Problem

### Judul Penelitian
**"Analisis Kesenjangan Aksesibilitas Fasilitas Pendidikan dan Kesehatan di Kecamatan Gunung Puyuh: Dampak Urbanisasi Cepat terhadap Pemerataan Layanan Publik"**

### Problem Statement

Kecamatan Gunung Puyuh mengalami **ketimpangan distribusi fasilitas layanan publik** dengan dampak sebagai berikut:

#### 🚨 Masalah Utama:

1. **Distribusi Tidak Merata**
   - Fasilitas pendidikan dan kesehatan terkonsentrasi di pusat kecamatan
   - Kelurahan dengan pemukiman baru mengalami kekurangan akses
   - Kesenjangan antara supply dan demand fasilitas

2. **Kesenjangan Aksesibilitas**
   - Masyarakat di kelurahan pinggiran harus menempuh waktu >15 menit ke fasilitas terdekat
   - Meningkatkan risiko keterlambatan penanganan kesehatan darurat
   - Beban biaya transportasi keluarga meningkat

3. **Overcapacity vs Under-served**
   - Fasilitas di pusat kecamatan mengalami overcrowding (antrian panjang, kelas penuh)
   - Area baru tidak memiliki fasilitas memadai
   - Ketimpangan kualitas layanan antar kelurahan

4. **Kesenjangan Sosial**
   - Masyarakat miskin di area under-served mengalami kesulitan akses lebih besar
   - Menciptakan kesenjangan kesehatan dan pendidikan antar kelurahan
   - Mempengaruhi kualitas SDM generasi mendatang

### Pertanyaan Penelitian

1. Bagaimana pola **distribusi spasial** fasilitas pendidikan dan kesehatan di Kecamatan Gunung Puyuh?
2. Seberapa merata **aksesibilitas** masyarakat terhadap fasilitas berdasarkan waktu tempuh (5, 10, 15 menit)?
3. **Kelurahan mana** yang mengalami kesenjangan akses paling parah (under-served areas)?
4. Apakah **rasio ketersediaan** fasilitas per penduduk sudah memenuhi standar WHO dan Kemenkes/Kemdikbud?
5. Di mana **lokasi optimal** untuk pembangunan fasilitas baru guna mengurangi kesenjangan?

### Tujuan Proyek

#### Tujuan Utama:
Mengidentifikasi dan menganalisis kesenjangan aksesibilitas fasilitas pendidikan dan kesehatan menggunakan **analisis spasial berbasis SIG** untuk memberikan rekomendasi perencanaan pembangunan infrastruktur yang merata.

#### Tujuan Khusus:
1. ✅ Memetakan distribusi spasial fasilitas pendidikan dan kesehatan di seluruh kelurahan
2. ✅ Menganalisis zona jangkauan layanan (isochrone 5-10-15 menit) dari setiap fasilitas
3. ✅ Mengidentifikasi kelurahan yang under-served berdasarkan gap analysis
4. ✅ Menghitung rasio ketersediaan fasilitas dan membandingkan dengan standar nasional/internasional
5. ✅ Memberikan rekomendasi lokasi optimal untuk fasilitas baru berbasis data spasial
6. ✅ Mengembangkan **WebGIS interaktif** untuk memudahkan akses informasi fasilitas

### Manfaat Penelitian

#### Untuk Pemerintah:
- 📊 Data objektif untuk perencanaan infrastruktur
- 📍 Identifikasi lokasi optimal fasilitas baru
- 💰 Justifikasi alokasi anggaran berbasis data

#### Untuk Masyarakat:
- 🔍 Mudah mencari fasilitas terdekat via WebGIS
- 📱 Transparansi informasi layanan publik
- 🗣️ Advokasi untuk perbaikan infrastruktur di area mereka

#### Untuk Developer Perumahan:
- 🏘️ Panduan lokasi fasilitas yang harus dibangun dalam kawasan perumahan baru
- 📋 Compliance dengan standar perencanaan kota

---

## ✨ Fitur Utama

## ✨ Fitur Utama

### 🗺️ Peta Interaktif

#### Base Maps (Peta Dasar)
Aplikasi menyediakan 2 pilihan base map yang dapat di-toggle:
1. **OpenStreetMap** - Peta standar dengan detail jalan dan bangunan
2. **Satelit** (Esri World Imagery) - Citra satelit resolusi tinggi

#### Data Layers (Overlay)
Semua layer dapat diaktifkan/dinonaktifkan sesuai kebutuhan:

| Layer | Deskripsi | Sumber Data | Icon | Warna |
|-------|-----------|-------------|------|-------|
| **Batas Kecamatan** | Batas wilayah administratif Kecamatan Gunung Puyuh | map.geojson | 📍 | Oranye |
| **SDN/SD/SDIT** | Sekolah Dasar Negeri, SD, dan SDIT | map.geojson + sd-smp-sma.geojson | 🏫 | Biru |
| **SMP/SMPN/SMPIT** | Sekolah Menengah Pertama | sd-smp-sma.geojson | 🏫 | Hijau |
| **SMA/SMAN/SMK** | Sekolah Menengah Atas dan SMK | sd-smp-sma.geojson | 🏫 | Merah |
| **Universitas** | Perguruan Tinggi | sd-smp-sma.geojson | 🎓 | Ungu |
| **Lainnya** | Madrasah dan institusi pendidikan lainnya | sd-smp-sma.geojson | 🏫 | Oranye |

### 📊 Dashboard & Statistik

- **Real-time Counter**: Menampilkan jumlah total institusi pendidikan
- **Breakdown per Kategori**: Statistik SD, SMP, SMA, dan Universitas
- **Animated Numbers**: Counter dengan animasi smooth counting
- **Info Panel**: Panel informasi yang dapat di-toggle dengan panduan penggunaan

### 🎨 UI/UX Modern

- ✅ **Responsive Design**: Optimal di desktop, tablet, dan mobile
- ✅ **Modern Gradient**: Header dengan gradient purple dan pattern overlay
- ✅ **Glass Morphism**: Backdrop blur pada card elements
- ✅ **Smooth Animations**: Fade-in, slide, dan floating animations
- ✅ **Interactive Elements**: Hover effects dan transitions
- ✅ **Custom Markers**: Icon emoji dengan warna kategori
- ✅ **Styled Popups**: Popup informatif dengan design modern

### 🎯 Kontrol Peta

#### Layer Control (Kiri Atas)
- Toggle base maps (radio button)
- Toggle overlay layers (checkbox)
- Scrollable untuk banyak layer

#### Zoom Control (Kanan Atas)
- Zoom in (+) / Zoom out (-)
- Custom styling dengan hover effect

#### Scale Control (Kiri Bawah)
- Skala dalam meter/kilometer
- Auto-adjust berdasarkan zoom level

#### Info Panel (Kanan Atas)
- Toggle button dengan icon ℹ️
- Statistik per kategori
- Panduan penggunaan
- Smooth slide animation

---

## 🛠️ Teknologi

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling dengan CSS Variables
- **JavaScript (ES6+)** - Modular architecture
- **Leaflet.js v1.9.4** - Interactive map library

### Data
- **GeoJSON** - Format data geografis standar
- **OpenStreetMap** - Base map tiles
- **Esri World Imagery** - Satellite imagery

### Fonts & Icons
- **Google Fonts (Poppins)** - Modern, clean typography
- **Emoji Icons** - Native emoji untuk markers

### Tools & Services
- **Python HTTP Server** - Local development server
- **Git** - Version control
- **VS Code** - Development environment

---

## 📁 Struktur Project

## 📁 Struktur Project

```
kecamatan-gunungpuyuh-gis/
│
├── 📄 index.html                 # File HTML utama
├── 🎨 style.css                  # Styling modern dengan CSS Variables
│
├── 📊 Data Files
│   ├── map.geojson              # Data SDN dan batas kecamatan
│   └── sd-smp-sma.geojson       # Data sekolah (SD, SMP, SMA, Universitas)
│
├── 📂 js/                        # Modular JavaScript Architecture
│   ├── config.js                # ⚙️ Konfigurasi aplikasi (center, zoom, layers)
│   ├── ui-utils.js              # 🎭 UI utilities (loading, error, statistics)
│   ├── marker-utils.js          # 📍 Custom marker creation & styling
│   ├── popup-utils.js           # 💬 Popup content generation
│   ├── geojson-loader.js        # 📥 GeoJSON data loader & processor
│   ├── map-initializer.js       # 🗺️ Map initialization & setup
│   ├── app.js                   # 🚀 Application entry point
│   └── README.md                # 📖 Dokumentasi struktur JavaScript
│
├── 📚 Documentation
│   ├── README.md                # Dokumentasi utama (file ini)
│   ├── ARCHITECTURE.md          # Diagram arsitektur & data flow
│   └── UI-IMPROVEMENTS.md       # Dokumentasi UI/UX improvements
│
└── 🔙 Backup
    └── map.js.backup            # Backup file monolithic lama
```

### Penjelasan Struktur

#### Root Files
- **index.html**: Entry point aplikasi dengan semantic HTML5
- **style.css**: Modern CSS dengan variables, animations, dan responsive design

#### Data Files
- **map.geojson**: Data utama (batas kecamatan + lokasi SDN)
- **sd-smp-sma.geojson**: Data tambahan (SMP, SMA, SMK, Universitas, Madrasah)

#### JavaScript Modules (`js/`)
Aplikasi menggunakan **modular architecture** dengan 7 module terpisah:

1. **config.js** (60 lines)
   - Konfigurasi global (center coordinates, zoom, base maps)
   - Data source paths
   - Layer names & control positions

2. **ui-utils.js** (145 lines)
   - Loading indicator (show/hide)
   - Error notifications
   - **Statistics system** (counter, animations)
   - Info panel toggle

3. **marker-utils.js** (90 lines)
   - Icon configuration per kategori
   - Custom marker creation
   - Color & symbol mapping

4. **popup-utils.js** (75 lines)
   - Popup content generation
   - HTML formatting
   - Category-based styling

5. **geojson-loader.js** (115 lines)
   - Fetch multiple GeoJSON files
   - Process & add to map
   - Feature styling
   - Statistics tracking

6. **map-initializer.js** (120 lines)
   - Create Leaflet map instance
   - Setup base layers & overlays
   - Add controls (zoom, layers, scale)
   - Orchestrate initialization

7. **app.js** (30 lines)
   - Application entry point
   - DOM ready handler
   - Initialize info panel & map
   - Error handling

#### Documentation
- **README.md**: Dokumentasi lengkap proyek (file ini)
- **ARCHITECTURE.md**: Diagram dependency, data flow, execution timeline
- **UI-IMPROVEMENTS.md**: Dokumentasi design system & UI enhancements

---

## 🚀 Instalasi & Cara Menjalankan

### Prerequisites
- **Browser modern** (Chrome, Firefox, Safari, Edge)
- **Python 3.x** (untuk HTTP server) ATAU
- **VS Code** dengan Live Server extension

### Method 1: Python HTTP Server (Recommended)

```bash
# Clone atau download project
cd kecamatan-gunungpuyuh-gis

# Jalankan HTTP server
python -m http.server 8000

# Buka browser
# http://localhost:8000
```

### Method 2: VS Code Live Server

```bash
# 1. Install "Live Server" extension di VS Code
# 2. Buka folder project di VS Code
# 3. Klik kanan pada index.html
# 4. Pilih "Open with Live Server"
```

### Method 3: Direct Open (CORS Warning)

```bash
# Double-click index.html
# Note: Mungkin ada CORS issue untuk loading GeoJSON files
```

---

## 📖 Penggunaan

### Navigasi Dasar

#### 🖱️ Mouse/Trackpad
- **Drag**: Geser peta
- **Scroll**: Zoom in/out
- **Click marker**: Tampilkan info detail
- **Click layer control**: Toggle layers

#### 📱 Touch (Mobile/Tablet)
- **Drag**: Geser peta
- **Pinch**: Zoom in/out
- **Tap marker**: Tampilkan info detail
- **Tap ℹ️**: Toggle info panel

### Fitur-Fitur

#### 1. Toggle Base Map
```
Lokasi: Kiri atas (Layer Control)
Pilihan: 
  ○ OpenStreetMap (default)
  ○ Satelit
```

#### 2. Toggle Overlay Layers
```
Lokasi: Kiri atas (Layer Control)
Pilihan:
  ☑ Batas Kecamatan
  ☑ SDN/SD/SDIT
  ☑ SMP/SMPN/SMPIT
  ☑ SMA/SMAN/SMK
  ☑ Universitas
  ☑ Lainnya (Madrasah, dll)
```

#### 3. Info Panel
```
Lokasi: Kanan atas
Aksi: Click button ℹ️
Konten:
  - Statistik per kategori
  - Panduan navigasi
  - Panduan layer control
```

#### 4. Marker Information
```
Aksi: Click pada marker
Konten:
  - Nama institusi
  - Jenis institusi
  - Icon kategori
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `+` / `=` | Zoom in |
| `-` / `_` | Zoom out |
| `←` `→` `↑` `↓` | Pan map |
| `Shift` + Drag | Zoom to box |

---

## 🏗️ Arsitektur

### System Architecture

## 🏗️ Arsitektur

### System Architecture

```
User (Browser)
      ↓
┌─────────────────┐
│   index.html    │ → Load HTML structure
└────────┬────────┘
         ↓
┌─────────────────┐
│    style.css    │ → Modern styling & animations
└─────────────────┘
         ↓
┌─────────────────────────────────────┐
│       JavaScript Modules            │
│  (Loaded in dependency order)       │
│                                     │
│  1. config.js                       │
│  2. ui-utils.js                     │
│  3. marker-utils.js                 │
│  4. popup-utils.js                  │
│  5. geojson-loader.js               │
│  6. map-initializer.js              │
│  7. app.js                          │
└──────────┬──────────────────────────┘
           ↓
     [Initialize Map]
           ↓
  ┌────────┴────────┐
  ↓                 ↓
[Base Layers]   [Overlays]
  ↓                 ↓
[Leaflet.js Map Instance]
           ↓
  ┌────────┴────────┐
  ↓                 ↓
[GeoJSON Data]  [Controls]
```

### Data Flow

1. **User opens** `index.html`
2. **Browser loads** CSS and JavaScript modules
3. **app.js** waits for DOM ready
4. **MapInitializer** creates Leaflet map instance
5. **GeoJSONLoader** fetches data files (map.geojson + sd-smp-sma.geojson)
6. **MarkerUtils** creates custom markers
7. **PopupUtils** generates popup content
8. **UIUtils** updates statistics counter
9. **Map ready** for user interaction

### Module Dependencies

```
config.js (Independent)
    ↓
ui-utils.js
    ↓
marker-utils.js
    ↓
popup-utils.js
    ↓
geojson-loader.js (Uses all above)
    ↓
map-initializer.js (Orchestrator)
    ↓
app.js (Entry point)
```

📚 **Detail**: Lihat `ARCHITECTURE.md` untuk diagram lengkap

---

## 🎯 Best Practices

Proyek ini mengimplementasikan best practices modern web development:

### Code Quality

#### ✅ Modular Architecture
- **Separation of Concerns**: Setiap module punya tanggung jawab spesifik
- **Single Responsibility Principle**: Satu fungsi = satu tugas
- **DRY (Don't Repeat Yourself)**: Reusable components
- **Small Files**: Setiap module < 150 lines

#### ✅ Clean Code
- **Meaningful Names**: Variable dan function names yang descriptive
- **JSDoc Comments**: Dokumentasi inline untuk setiap function
- **Consistent Formatting**: Indentation dan spacing konsisten
- **Error Handling**: Try-catch blocks dan user feedback

#### ✅ Performance
- **Lazy Loading**: Data loaded on demand
- **Hardware Acceleration**: CSS transforms untuk animations
- **Efficient DOM Manipulation**: Minimal reflows
- **RequestAnimationFrame**: Smooth 60fps animations

### CSS Best Practices

#### ✅ Modern CSS
- **CSS Variables**: Centralized theming
- **Mobile-First**: Responsive breakpoints
- **Flexbox & Grid Ready**: Modern layout
- **BEM-like Naming**: Organized class names

#### ✅ Animations
- **Smooth Transitions**: cubic-bezier easing
- **60fps Performance**: Hardware-accelerated
- **Meaningful Animations**: Enhance UX, not distract

### HTML Best Practices

#### ✅ Semantic HTML5
- **Proper Tags**: `<header>`, `<main>`, `<footer>`, `<nav>`
- **ARIA Labels**: Accessibility support
- **Meta Tags**: SEO optimized
- **Structured Data**: Clear hierarchy

### Accessibility (a11y)

#### ✅ WCAG Compliance
- **Keyboard Navigation**: Tab order, focus states
- **Screen Reader Support**: ARIA labels
- **Color Contrast**: WCAG AA compliant
- **Scalable Text**: Responsive font sizes

### Security

#### ✅ Best Practices
- **No Inline Scripts**: External JS files
- **CSP Ready**: Content Security Policy compatible
- **Safe Data Handling**: Input validation
- **HTTPS Ready**: Secure protocol support

---

## 🔬 Metodologi Penelitian

### Pendekatan

Penelitian ini menggunakan **metode kuantitatif** dengan pendekatan **analisis spasial**:

1. **Survey Lapangan**
   - Pengambilan koordinat GPS fasilitas
   - Wawancara dengan pengelola fasilitas
   - Dokumentasi foto

2. **Analisis Spasial**
   - Distribution mapping
   - Service area analysis (isochrone)
   - Gap analysis
   - Ratio compliance check

3. **WebGIS Development**
   - Data processing (GeoJSON format)
   - Interactive map development
   - Statistics dashboard
   - User testing

### Teknik Analisis

#### 1. Distribusi Spasial
```
Metode: Point Pattern Analysis
Output: Peta sebaran fasilitas
Tools: Leaflet.js, GeoJSON
```

#### 2. Analisis Aksesibilitas
```
Metode: Isochrone (5, 10, 15 menit)
Output: Zona jangkauan layanan
Tools: OpenRouteService API / Mapbox
```

#### 3. Gap Analysis
```
Metode: Overlay Analysis
Output: Area under-served identification
Tools: Turf.js / QGIS
```

#### 4. Ratio Analysis
```
Metode: Comparison dengan standar WHO/Kemenkes
Output: Compliance report
Tools: Statistical analysis
```

### Expected Outcomes

1. **Peta Distribusi Spasial**: Visualisasi sebaran fasilitas
2. **Peta Aksesibilitas**: Zona jangkauan berdasarkan waktu tempuh
3. **Identifikasi Gap**: Kelurahan yang under-served
4. **Rekomendasi Lokasi**: Titik optimal untuk fasilitas baru
5. **WebGIS Aplikasi**: Platform informasi untuk publik

---

## 📊 Data Sources

### Primary Data
- **Koordinat GPS**: Survey lapangan dengan smartphone/GPS receiver
- **Wawancara**: Informasi dari pengelola fasilitas
- **Observasi**: Kondisi fisik fasilitas

### Secondary Data
- **Peta Administratif**: Batas kecamatan dari BPS
- **Data Populasi**: Sensus penduduk per kelurahan
- **Standar Pelayanan**: WHO, Kemenkes, Kemdikbud

### Data Format
- **GeoJSON**: Untuk data spasial (koordinat, geometri)
- **JSON**: Untuk data atribut (nama, kategori)
- **CSV**: Untuk data tabular (backup)

---

## 🌐 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Opera | 76+ | ✅ Fully Supported |
| IE 11 | - | ❌ Not Supported |

---

## 🚧 Roadmap & Future Development

### Phase 1: Current (✅ Completed)
- ✅ Basic map with layers
- ✅ Custom markers
- ✅ Statistics dashboard
- ✅ Info panel
- ✅ Responsive design
- ✅ Modern UI/UX

### Phase 2: Next Features (🔄 In Progress)
- 🔄 Isochrone analysis (service area)
- 🔄 Search functionality
- 🔄 Routing/directions
- 🔄 Gap analysis visualization
- 🔄 Data export (CSV/PDF)

### Phase 3: Advanced Features (📋 Planned)
- 📋 Dark mode toggle
- 📋 User accounts (save preferences)
- 📋 Marker clustering
- 📋 Heatmap visualization
- 📋 Compare scenarios
- 📋 Admin dashboard

### Phase 4: Integration (💡 Future)
- 💡 Real-time data update
- 💡 Mobile app (PWA)
- 💡 Backend API
- 💡 Database integration
- 💡 Advanced analytics

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Berikut cara berkontribusi:

### How to Contribute

1. **Fork** repository ini
2. **Create branch** untuk fitur baru (`git checkout -b feature/AmazingFeature`)
3. **Commit** perubahan (`git commit -m 'Add some AmazingFeature'`)
4. **Push** ke branch (`git push origin feature/AmazingFeature`)
5. **Open Pull Request**

### Contribution Guidelines

- ✅ Follow existing code style
- ✅ Write meaningful commit messages
- ✅ Add comments untuk code yang complex
- ✅ Test di multiple browsers
- ✅ Update documentation

### Bug Reports

Laporkan bug melalui **Issues** dengan informasi:
- Browser & version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (jika ada)

---

## 📝 Lisensi

**MIT License**

Copyright (c) 2025 Kecamatan Gunung Puyuh GIS Project

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 📞 Kontak & Support

### Project Maintainer
- **Project**: WebGIS Kecamatan Gunung Puyuh
- **Location**: Sukabumi, Jawa Barat, Indonesia

### Links
- � **Repository**: [github.com/VXerys/accessibility-gap-analysis-webgis](https://github.com/VXerys/accessibility-gap-analysis-webgis)
- 🌐 **Website**: [kecamatan-gunungpuyuh.go.id](https://kecamatangunungpuyuh.sukabumikota.go.id)
- 📚 **Documentation**: [GitHub Wiki](https://github.com/VXerys/accessibility-gap-analysis-webgis/wiki)
- 🐛 **Issues**: [GitHub Issues](https://github.com/VXerys/accessibility-gap-analysis-webgis/issues)

### Tim Pengembang

**Lead Developer:**
- M. Sechan Alfarisi ([@VXerys](https://github.com/VXerys)) - NIM: 20230040094

**Development Team:**
- M. Akbar Rizky Saputra - NIM: 20230040236
- M. Fathir Bagas - NIM: 20230040126
- M. Sinar Agusta - NIM: 20230040188
- M. Ghibran Muslih - NIM: 20230040105

### Acknowledgments

Terima kasih kepada:
- 🏛️ **Pemerintah Kecamatan Gunung Puyuh** - Data dan dukungan
- 🗺️ **OpenStreetMap Contributors** - Base map data
- 🛰️ **Esri** - Satellite imagery
- 📚 **Leaflet.js Team** - Amazing mapping library
- 👥 **Open Source Community** - Inspiration dan tools

---

## 📚 References & Resources

### Libraries & Frameworks
- [Leaflet.js Documentation](https://leafletjs.com/)
- [GeoJSON Specification](https://geojson.org/)
- [OpenStreetMap](https://www.openstreetmap.org/)

### Standards & Guidelines
- [WHO Health Facility Standards](https://www.who.int/)
- [Kemenkes Standards](https://www.kemkes.go.id/)
- [Kemdikbud Education Standards](https://www.kemdikbud.go.id/)

### Related Research
- Urban sprawl impact on public services
- GIS for urban planning
- Accessibility analysis methodology
- Service area analysis

---

<div align="center">

## 🌟 Star this project if you find it useful!

**Made with ❤️ for Kecamatan Gunung Puyuh, Sukabumi**

**Developed by:** M. Sechan Alfarisi & Team

[![GitHub stars](https://img.shields.io/github/stars/VXerys/accessibility-gap-analysis-webgis.svg?style=social&label=Star)](https://github.com/VXerys/accessibility-gap-analysis-webgis)
[![GitHub forks](https://img.shields.io/github/forks/VXerys/accessibility-gap-analysis-webgis.svg?style=social&label=Fork)](https://github.com/VXerys/accessibility-gap-analysis-webgis/fork)

---

**Last Updated**: October 19, 2025 | **Version**: 2.0.0

</div>
