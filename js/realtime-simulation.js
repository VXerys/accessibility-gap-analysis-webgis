/**
 * Realtime Simulation Module
 * Mensimulasikan pergerakan GPS Ambulans
 */

const AmbulanceSimulation = {
    state: {
        active: false,
        intervalId: null,
        marker: null,
        pathLine: null,
        pathCoords: [], // Menyimpan history koordinat
        currentStep: 0,
        speed: 0
    },

    // Konfigurasi Rute Simulasi (Dari RS Bhayangkara ke arah utara/kota)
    // Koordinat ini adalah titik-titik "waypoints" agar terlihat mengikuti jalan
    routeWaypoints: [
        [-6.912519, 106.922187], // Start: RS Bhayangkara
        [-6.912310, 106.922042],
        [-6.911500, 106.921500],
        [-6.911000, 106.921200],
        [-6.910000, 106.921000],
        [-6.909000, 106.920500],
        [-6.908000, 106.920000],
        [-6.907000, 106.919500], // End: Sekitar pusat kecamatan
    ],

    init(map) {
        this.map = map;
        this.createControlPanel();
    },

    createControlPanel() {
        const panel = document.createElement('div');
        panel.className = 'simulation-panel leaflet-bar';
        panel.innerHTML = `
            <div class="sim-header">
                <span style="font-size:1.2em;">🚑</span> <strong>Ambulans Tracker</strong>
            </div>
            <div class="sim-stats">
                <div>Speed: <span id="sim-speed">0</span> km/h</div>
                <div style="font-size:0.8em; color:#666;" id="sim-time">--:--:--</div>
            </div>
            <div class="sim-controls">
                <button id="btn-sim-start" class="sim-btn start">Mulai Simulasi</button>
                <button id="btn-sim-stop" class="sim-btn stop" style="display:none;">Stop</button>
            </div>
        `;
        
        // Tambahkan ke pojok kanan bawah (di atas attribution)
        const container = document.querySelector('.leaflet-bottom.leaflet-right');
        if (container) {
            container.insertBefore(panel, container.firstChild);
        } else {
            document.body.appendChild(panel);
            panel.style.cssText = "position:fixed; bottom:30px; right:10px; z-index:9999;";
        }

        // Event Listeners
        document.getElementById('btn-sim-start').onclick = () => this.startSimulation();
        document.getElementById('btn-sim-stop').onclick = () => this.stopSimulation();
    },

    startSimulation() {
        if (this.state.active) return;
        
        this.state.active = true;
        this.state.currentStep = 0;
        this.state.pathCoords = [this.routeWaypoints[0]]; // Reset path
        
        // Update UI Buttons
        document.getElementById('btn-sim-start').style.display = 'none';
        document.getElementById('btn-sim-stop').style.display = 'block';

        // Buat Marker Ambulans Custom
        const ambulanceIcon = L.divIcon({
            className: 'custom-ambulance-marker',
            html: `<div style="font-size:24px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));">🚑</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        // Hapus layer lama jika ada
        if (this.state.marker) this.map.removeLayer(this.state.marker);
        if (this.state.pathLine) this.map.removeLayer(this.state.pathLine);

        // Tambah Marker Awal
        this.state.marker = L.marker(this.routeWaypoints[0], {icon: ambulanceIcon})
            .addTo(this.map)
            .bindPopup("<strong>Unit Ambulans 01</strong><br>Status: Menuju Lokasi");

        // Init Polyline (Jejak)
        this.state.pathLine = L.polyline(this.state.pathCoords, {
            color: 'red',
            weight: 4,
            dashArray: '5, 10',
            opacity: 0.7
        }).addTo(this.map);

        // Zoom ke lokasi awal
        this.map.setView(this.routeWaypoints[0], 16);

        // Jalankan Loop "Realtime" (Setiap 2 detik agar lebih mulus, tugas minta 5 detik bisa disesuaikan)
        this.state.intervalId = setInterval(() => {
            this.updatePosition();
        }, 2000); // Ubah jadi 5000 jika harus persis 5 detik
    },

    updatePosition() {
        const steps = this.routeWaypoints;
        
        // Cek jika sudah sampai tujuan
        if (this.state.currentStep >= steps.length - 1) {
            this.stopSimulation();
            alert("Ambulans telah tiba di lokasi!");
            return;
        }

        // Logic Pergerakan Sederhana (Interpolasi antar titik waypoint)
        // Di aplikasi nyata, ini data dari API GPS
        this.state.currentStep++;
        const nextCoord = steps[this.state.currentStep];
        
        // Update Marker
        this.state.marker.setLatLng(nextCoord);
        this.map.panTo(nextCoord); // Ikuti kamera

        // Update Jejak (Polyline)
        this.state.pathCoords.push(nextCoord);
        this.state.pathLine.setLatLngs(this.state.pathCoords);

        // Update Panel Info (Speed & Timestamp)
        const randomSpeed = Math.floor(Math.random() * (60 - 30) + 30); // Random 30-60 km/h
        const now = new Date().toLocaleTimeString();
        
        document.getElementById('sim-speed').innerText = randomSpeed;
        document.getElementById('sim-time').innerText = now;
    },

    stopSimulation() {
        this.state.active = false;
        clearInterval(this.state.intervalId);
        
        // Reset UI Buttons
        document.getElementById('btn-sim-start').style.display = 'block';
        document.getElementById('btn-sim-stop').style.display = 'none';
        
        document.getElementById('sim-speed').innerText = "0";
    }
};