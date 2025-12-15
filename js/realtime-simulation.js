/**
 * Realtime Simulation Module (Standalone + Routing API)
 * Fitur: Simulasi ambulans mengikuti jalan raya menggunakan RoutingService.
 * UI: Panel terpisah (Standalone) di pojok kanan bawah.
 */

const AmbulanceSimulation = {
    state: {
        active: false,
        mode: 'idle', // idle, picking-start, picking-end, simulating
        startPoint: null,
        endPoint: null,
        markerStart: null,
        markerEnd: null,
        ambulanceMarker: null,
        routePolyline: null,
        pathCoords: [],
        currentIndex: 0,
        intervalId: null
    },

    init(map) {
        this.map = map;
        if (!this.map) return;
        
        // Buat panel kontrol yang berdiri sendiri
        this.createControlPanel();
    },

    createControlPanel() {
        if (document.querySelector('.simulation-panel')) return;

        const panel = document.createElement('div');
        panel.className = 'simulation-panel'; 
        
        // Style Panel Fixed Pojok Kanan Bawah (Standalone)
        Object.assign(panel.style, {
            position: 'fixed',
            bottom: '30px',
            right: '10px',
            zIndex: '1000', // Di atas peta
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            minWidth: '250px',
            fontFamily: "'Poppins', sans-serif",
            borderLeft: '5px solid #ef4444'
        });

        panel.innerHTML = `
            <div class="sim-header" style="border-bottom: 2px solid #fee2e2; margin-bottom: 10px; padding-bottom: 5px; display:flex; justify-content:space-between; align-items:center;">
                <div><span style="font-size:1.2em;">🚑</span> <strong>Ambulans API</strong></div>
                <button id="btn-reset-sim" style="border:none; background:none; cursor:pointer; color:#999; font-size:1.2em;" title="Reset">&times;</button>
            </div>
            
            <div class="sim-stats">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="color:#666; font-size:0.9em;">Kecepatan</span>
                    <span style="font-weight:bold; color:#ef4444;"><span id="sim-speed">0</span> km/h</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="color:#666; font-size:0.9em;">Estimasi</span>
                    <span style="font-weight:bold; color:#333;" id="sim-eta">-- menit</span>
                </div>
                <div style="font-size:0.8em; color:#666; margin-top:8px; background:#f8f9fa; padding:5px; border-radius:4px; text-align:center;">
                    Status: <span id="sim-status" style="font-weight:600;">Siap</span>
                </div>
            </div>

            <div class="sim-controls" style="margin-top: 15px;">
                <button id="btn-sim-start" style="width:100%; padding:8px; background:#ef4444; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:600;">
                    Pilih Rute & Jalan
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);

        // Event Listeners
        document.getElementById('btn-sim-start').onclick = () => this.startSelectionMode();
        document.getElementById('btn-reset-sim').onclick = () => this.resetSimulation();
    },

    startSelectionMode() {
        this.resetSimulation(); // Bersihkan peta dulu
        this.state.mode = 'picking-start';
        
        // Ubah UI untuk instruksi
        document.getElementById('sim-status').innerText = "Klik Peta: Titik Awal";
        document.getElementById('sim-status').style.color = "#ef4444";
        document.getElementById('btn-sim-start').style.display = 'none';
        
        // Ubah kursor peta
        document.getElementById('map').style.cursor = 'crosshair';
        
        // Aktifkan listener klik peta
        this.map.on('click', this.handleMapClick.bind(this));
    },

    handleMapClick(e) {
        if (this.state.mode === 'picking-start') {
            // --- 1. User Klik Titik Awal ---
            this.state.startPoint = e.latlng;
            
            this.state.markerStart = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: '', 
                    html: '<div style="font-size:24px;">🚩</div>', 
                    iconSize: [30,30], 
                    iconAnchor: [15,15]
                })
            }).addTo(this.map).bindPopup("Titik Awal").openPopup();

            this.state.mode = 'picking-end';
            document.getElementById('sim-status').innerText = "Klik Peta: Titik Tujuan";

        } else if (this.state.mode === 'picking-end') {
            // --- 2. User Klik Titik Tujuan ---
            this.state.endPoint = e.latlng;
            
            this.state.markerEnd = L.marker(e.latlng, {
                icon: L.divIcon({
                    className: '', 
                    html: '<div style="font-size:24px;">🚩</div>', 
                    iconSize: [30,30], 
                    iconAnchor: [5,25]
                })
            }).addTo(this.map).bindPopup("Tujuan");

            // Matikan mode klik
            this.map.off('click');
            document.getElementById('map').style.cursor = '';
            
            // --- 3. Panggil API Routing ---
            this.calculateRoute();
        }
    },

    async calculateRoute() {
        document.getElementById('sim-status').innerText = "Menghitung Rute API...";
        
        try {
            // Cek apakah RoutingService tersedia
            if (typeof RoutingService === 'undefined') {
                throw new Error("RoutingService belum dimuat!");
            }

            // PERBAIKAN 1: Konversi LatLng (Leaflet) ke Array [Lng, Lat] (RoutingService)
            // RoutingService membutuhkan format: [longitude, latitude]
            const startCoords = [this.state.startPoint.lng, this.state.startPoint.lat];
            const endCoords = [this.state.endPoint.lng, this.state.endPoint.lat];

            // PERBAIKAN 2: Gunakan method 'getRoute' sesuai file routing-service.js Anda
            // (Sebelumnya calculateRoute, yang salah)
            const geojsonData = await RoutingService.getRoute(startCoords, endCoords, "driving-car"); 

            // PERBAIKAN 3: Parsing GeoJSON Response yang benar
            if (!geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
                throw new Error("Rute tidak ditemukan.");
            }

            const feature = geojsonData.features[0];
            const coordinates = feature.geometry.coordinates; // Ini masih [Lng, Lat]
            const summary = feature.properties.summary;

            // Sukses dapat rute
            this.startAnimation(coordinates, summary);

        } catch (error) {
            console.error("Simulation Error:", error);
            document.getElementById('sim-status').innerText = "Gagal Mengambil Rute";
            document.getElementById('sim-status').style.color = "red";
            alert("Gagal mengambil rute dari API. Coba jarak yang lebih dekat.");
            this.resetSimulation();
        }
    },

    startAnimation(coordinates, summary) {
        this.state.mode = 'simulating';
        
        const pathForLeaflet = coordinates.map(coord => [coord[1], coord[0]]);
        
        this.state.pathCoords = pathForLeaflet;

        // Gambar Garis Rute Biru
        if (this.state.routePolyline) this.map.removeLayer(this.state.routePolyline);
        this.state.routePolyline = L.polyline(this.state.pathCoords, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.7,
            lineCap: 'round'
        }).addTo(this.map);

        this.map.fitBounds(this.state.routePolyline.getBounds(), {padding: [30, 30]});

        // Marker Ambulans
        const ambulanceIcon = L.divIcon({
            className: 'ambulance-sim-icon',
            html: `<div style="font-size:28px; filter:drop-shadow(2px 2px 4px rgba(0,0,0,0.3)); transform: scaleX(-1);">🚑</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        if (this.state.ambulanceMarker) this.map.removeLayer(this.state.ambulanceMarker);
        this.state.ambulanceMarker = L.marker(this.state.pathCoords[0], {
            icon: ambulanceIcon,
            zIndexOffset: 2000 // Agar selalu di atas marker lain
        }).addTo(this.map);

        // Update Info Panel
        document.getElementById('sim-status').innerText = "Menuju Lokasi...";
        document.getElementById('sim-status').style.color = "#333";
        
        if (summary) {
            const slowFactor = 1.5; 
            const timeMin = Math.ceil((summary.duration * slowFactor) / 60);
            document.getElementById('sim-eta').innerText = `${timeMin} menit`;
        }

        // Mulai Loop Animasi
        this.state.currentIndex = 0;
        this.animateStep();
    },

    animateStep() {
        if (this.state.mode !== 'simulating') return;

        // Cek jika sudah sampai
        if (this.state.currentIndex >= this.state.pathCoords.length - 1) {
            this.state.ambulanceMarker.bindPopup("<strong>Sampai di Tujuan!</strong>").openPopup();
            document.getElementById('sim-status').innerText = "TIBA DI LOKASI";
            document.getElementById('sim-status').style.color = "#10b981";
            document.getElementById('sim-speed').innerText = "0";
            return;
        }

        // Pindah ke koordinat berikutnya
        this.state.currentIndex++;
        const nextCoord = this.state.pathCoords[this.state.currentIndex];
        this.state.ambulanceMarker.setLatLng(nextCoord);
        
        // Kamera mengikuti marker (setiap 10 frame biar tidak pusing)
        if (this.state.currentIndex % 15 === 0) {
            this.map.panTo(nextCoord);
        }

        // Simulasi Speedometer
        const speed = Math.floor(Math.random() * (70 - 30) + 30);
        document.getElementById('sim-speed').innerText = speed;

        // Lanjut ke frame berikutnya (Kecepatan animasi)
        this.state.intervalId = setTimeout(() => this.animateStep(), 80); 
    },

    resetSimulation() {
        this.state.mode = 'idle';
        if (this.state.intervalId) clearTimeout(this.state.intervalId);

        // Hapus semua layer simulasi
        if (this.state.markerStart) this.map.removeLayer(this.state.markerStart);
        if (this.state.markerEnd) this.map.removeLayer(this.state.markerEnd);
        if (this.state.ambulanceMarker) this.map.removeLayer(this.state.ambulanceMarker);
        if (this.state.routePolyline) this.map.removeLayer(this.state.routePolyline);

        // Reset UI
        document.getElementById('btn-sim-start').style.display = 'block';
        document.getElementById('sim-status').innerText = "Siap";
        document.getElementById('sim-status').style.color = "#333";
        document.getElementById('sim-speed').innerText = "0";
        document.getElementById('sim-eta').innerText = "-- menit";

        // Reset Peta
        document.getElementById('map').style.cursor = '';
        this.map.off('click');
    }
};