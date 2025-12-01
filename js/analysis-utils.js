/**
 * Analysis Utilities Module
 * Handles spatial analysis operations using Turf.js
 */

const AnalysisUtils = {
    // Analysis state
    state: {
        currentMode: null,
        analysisLayer: null,
        markers: [],
        lastClickPoint: null,
        allFacilities: []
    },

    /**
     * Initialize analysis functionality
     * @param {L.Map} map - Leaflet map instance
     */
    init(map) {
        this.map = map;
        this.state.analysisLayer = L.layerGroup().addTo(map);
        this.setupEventListeners();
        this.setupMapClickHandler();
    },

    /**
     * Setup event listeners for analysis controls
     */
    setupEventListeners() {
        // Toggle panel
        const toggleBtn = document.getElementById('analysis-toggle');
        const panel = document.getElementById('analysis-panel');
        const closeBtn = document.getElementById('analysis-close');

        toggleBtn?.addEventListener('click', () => {
            panel.classList.toggle('active');
        });

        closeBtn?.addEventListener('click', () => {
            panel.classList.remove('active');
        });

        // Mode buttons
        const modeButtons = document.querySelectorAll('.analysis-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.setMode(mode);
                modeButtons.forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Clear analysis button
        const clearBtn = document.getElementById('clear-analysis');
        clearBtn?.addEventListener('click', () => {
            this.clearAnalysis();
        });
    },

    /**
     * Set analysis mode
     * @param {string} mode - Analysis mode (nearest, distance, buffer)
     */
    setMode(mode) {
        this.state.currentMode = mode;
        this.state.lastClickPoint = null;
        const infoDiv = document.getElementById('analysis-info');
        
        const instructions = {
            nearest: '🎯 Klik pada peta untuk mencari fasilitas terdekat dari titik tersebut.',
            distance: '📏 Klik dua titik pada peta untuk mengukur jarak antara keduanya.',
            buffer: '⭕ Klik pada peta untuk menampilkan area layanan 1km dari titik tersebut.'
        };
        
        if (infoDiv) {
            infoDiv.innerHTML = `<p class="info-instruction">${instructions[mode] || 'Pilih mode analisis.'}</p>`;
        }
        
        this.clearAnalysis();
    },

    /**
     * Setup map click handler for analysis
     */
    setupMapClickHandler() {
        this.map.on('click', (e) => {
            if (!this.state.currentMode) return;

            const point = [e.latlng.lng, e.latlng.lat];
            
            switch (this.state.currentMode) {
                case 'nearest':
                    this.findNearestFacility(point, e.latlng);
                    break;
                case 'distance':
                    this.measureDistance(point, e.latlng);
                    break;
                case 'buffer':
                    this.createBufferAnalysis(point, e.latlng);
                    break;
            }
        });
    },

    /**
     * Store facility data for analysis
     * @param {Array} facilities - GeoJSON features
     */
    storeFacilities(facilities) {
        this.state.allFacilities = facilities;
    },

    /**
     * Find nearest facility from a point
     * @param {Array} point - [lng, lat]
     * @param {L.LatLng} latlng - Leaflet LatLng object
     */
    findNearestFacility(point, latlng) {
        this.clearAnalysis();

        // Add click marker
        const clickMarker = L.circleMarker(latlng, {
            radius: 8,
            fillColor: '#ff0000',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.state.analysisLayer);
        
        clickMarker.bindPopup('📍 Titik Analisis').openPopup();

        if (this.state.allFacilities.length === 0) {
            this.showResults('Tidak ada data fasilitas yang dimuat.', 'error');
            return;
        }

        // Create point feature
        const from = turf.point(point);
        let nearestFacility = null;
        let minDistance = Infinity;

        // Find nearest facility
        this.state.allFacilities.forEach(facility => {
            if (facility.geometry && facility.geometry.type === 'Point') {
                const to = turf.point(facility.geometry.coordinates);
                const distance = turf.distance(from, to, { units: 'kilometers' });
                
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestFacility = facility;
                }
            }
        });

        if (nearestFacility) {
            const facilityCoords = nearestFacility.geometry.coordinates;
            const facilityLatLng = L.latLng(facilityCoords[1], facilityCoords[0]);

            // Draw line to nearest facility
            const line = L.polyline([latlng, facilityLatLng], {
                color: '#0066cc',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 10'
            }).addTo(this.state.analysisLayer);

            // Add marker for nearest facility
            const facilityMarker = L.circleMarker(facilityLatLng, {
                radius: 10,
                fillColor: '#0066cc',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.state.analysisLayer);

            const props = nearestFacility.properties;
            const facilityName = props.nama || props.KETERANGAN || 'Fasilitas';
            const facilityType = this.getFacilityType(props);

            facilityMarker.bindPopup(`
                <strong>🎯 Fasilitas Terdekat</strong><br>
                <strong>${facilityName}</strong><br>
                Jenis: ${facilityType}<br>
                Jarak: <strong>${minDistance.toFixed(2)} km</strong>
            `).openPopup();

            // Show results
            this.showResults(`
                <div class="result-item">
                    <div class="result-icon">🎯</div>
                    <div class="result-details">
                        <div class="result-name">${facilityName}</div>
                        <div class="result-type">${facilityType}</div>
                        <div class="result-distance">Jarak: <strong>${minDistance.toFixed(2)} km</strong></div>
                        <div class="result-time">≈ ${this.calculateWalkingTime(minDistance)} menit berjalan kaki</div>
                    </div>
                </div>
            `);

            // Fit bounds to show both points
            this.map.fitBounds(L.latLngBounds([latlng, facilityLatLng]), { padding: [50, 50] });
        } else {
            this.showResults('Tidak ditemukan fasilitas terdekat.', 'error');
        }
    },

    /**
     * Measure distance between two points
     * @param {Array} point - [lng, lat]
     * @param {L.LatLng} latlng - Leaflet LatLng object
     */
    measureDistance(point, latlng) {
        if (!this.state.lastClickPoint) {
            // First click - store point
            this.clearAnalysis();
            this.state.lastClickPoint = { point, latlng };
            
            const marker = L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#28a745',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.state.analysisLayer);
            
            marker.bindPopup('📍 Titik Awal').openPopup();
            
            this.showResults(`
                <div class="result-info">
                    <p>Klik titik kedua pada peta untuk mengukur jarak.</p>
                </div>
            `);
        } else {
            // Second click - calculate distance
            const from = turf.point(this.state.lastClickPoint.point);
            const to = turf.point(point);
            const distance = turf.distance(from, to, { units: 'kilometers' });

            // Add second marker
            const marker2 = L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#dc3545',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.state.analysisLayer);
            
            marker2.bindPopup('📍 Titik Akhir').openPopup();

            // Draw line
            const line = L.polyline([this.state.lastClickPoint.latlng, latlng], {
                color: '#ffc107',
                weight: 4,
                opacity: 0.8
            }).addTo(this.state.analysisLayer);

            // Add distance label at midpoint
            const midpoint = [(this.state.lastClickPoint.latlng.lat + latlng.lat) / 2,
                            (this.state.lastClickPoint.latlng.lng + latlng.lng) / 2];
            
            const label = L.marker(midpoint, {
                icon: L.divIcon({
                    className: 'distance-label',
                    html: `<div style="background: #ffc107; color: #000; padding: 4px 8px; border-radius: 4px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${distance.toFixed(2)} km</div>`,
                    iconSize: [100, 30]
                })
            }).addTo(this.state.analysisLayer);

            // Show results
            this.showResults(`
                <div class="result-item">
                    <div class="result-icon">📏</div>
                    <div class="result-details">
                        <div class="result-name">Jarak Linear</div>
                        <div class="result-distance"><strong>${distance.toFixed(2)} km</strong></div>
                        <div class="result-distance">${(distance * 1000).toFixed(0)} meter</div>
                        <div class="result-time">≈ ${this.calculateWalkingTime(distance)} menit berjalan kaki</div>
                        <div class="result-time">≈ ${this.calculateBikingTime(distance)} menit bersepeda</div>
                    </div>
                </div>
            `);

            // Fit bounds
            this.map.fitBounds(L.latLngBounds([this.state.lastClickPoint.latlng, latlng]), { padding: [50, 50] });

            // Reset for next measurement
            this.state.lastClickPoint = null;
        }
    },

    /**
     * Create buffer analysis around a point
     * @param {Array} point - [lng, lat]
     * @param {L.LatLng} latlng - Leaflet LatLng object
     */
    createBufferAnalysis(point, latlng) {
        this.clearAnalysis();

        // Add click marker
        const clickMarker = L.circleMarker(latlng, {
            radius: 8,
            fillColor: '#6f42c1',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.state.analysisLayer);
        
        clickMarker.bindPopup('📍 Pusat Analisis').openPopup();

        // Create buffers at different distances
        const buffers = [
            { distance: 0.5, color: '#28a745', label: '500m (Walkable)' },
            { distance: 1.0, color: '#ffc107', label: '1 km (Recommended)' },
            { distance: 1.5, color: '#dc3545', label: '1.5 km (Extended)' }
        ];

        const center = turf.point(point);
        const facilitiesInRange = {
            '500m': [],
            '1km': [],
            '1.5km': []
        };

        buffers.forEach(buffer => {
            const buffered = turf.buffer(center, buffer.distance, { units: 'kilometers' });
            const coords = buffered.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            
            L.polygon(coords, {
                color: buffer.color,
                weight: 2,
                opacity: 0.6,
                fillColor: buffer.color,
                fillOpacity: 0.1
            }).addTo(this.state.analysisLayer)
              .bindPopup(`<strong>Service Area</strong><br>${buffer.label}`);
        });

        // Count facilities within each buffer
        this.state.allFacilities.forEach(facility => {
            if (facility.geometry && facility.geometry.type === 'Point') {
                const facilityPoint = turf.point(facility.geometry.coordinates);
                const distance = turf.distance(center, facilityPoint, { units: 'kilometers' });
                
                if (distance <= 0.5) facilitiesInRange['500m'].push(facility);
                if (distance <= 1.0) facilitiesInRange['1km'].push(facility);
                if (distance <= 1.5) facilitiesInRange['1.5km'].push(facility);
            }
        });

        // Show results
        this.showResults(`
            <div class="result-item">
                <div class="result-icon">⭕</div>
                <div class="result-details">
                    <div class="result-name">Analisis Service Area</div>
                    <div class="buffer-stats">
                        <div class="buffer-stat" style="border-left: 4px solid #28a745;">
                            <strong>500m:</strong> ${facilitiesInRange['500m'].length} fasilitas
                        </div>
                        <div class="buffer-stat" style="border-left: 4px solid #ffc107;">
                            <strong>1 km:</strong> ${facilitiesInRange['1km'].length} fasilitas
                        </div>
                        <div class="buffer-stat" style="border-left: 4px solid #dc3545;">
                            <strong>1.5 km:</strong> ${facilitiesInRange['1.5km'].length} fasilitas
                        </div>
                    </div>
                    <div class="result-info">
                        ${facilitiesInRange['1km'].length === 0 
                            ? '<div style="color: #dc3545; margin-top: 10px;">⚠️ Gap Aksesibilitas: Tidak ada fasilitas dalam radius 1 km!</div>'
                            : '<div style="color: #28a745; margin-top: 10px;">✓ Area terlayani dengan baik</div>'}
                    </div>
                </div>
            </div>
        `);

        // Zoom to buffer
        const buffered = turf.buffer(center, 1.5, { units: 'kilometers' });
        const coords = buffered.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        this.map.fitBounds(L.latLngBounds(coords), { padding: [50, 50] });
    },

    /**
     * Get facility type from properties
     * @param {Object} props - Feature properties
     * @returns {string} Facility type
     */
    getFacilityType(props) {
        if (props.jenjang) {
            return props.jenjang.toUpperCase();
        }
        if (props.KETERANGAN) {
            return props.KETERANGAN;
        }
        if (props.tipe_faskes) {
            return props.tipe_faskes;
        }
        return 'Fasilitas';
    },

    /**
     * Calculate walking time based on distance
     * @param {number} distance - Distance in kilometers
     * @returns {number} Time in minutes
     */
    calculateWalkingTime(distance) {
        // Average walking speed: 5 km/h
        return Math.round((distance / 5) * 60);
    },

    /**
     * Calculate biking time based on distance
     * @param {number} distance - Distance in kilometers
     * @returns {number} Time in minutes
     */
    calculateBikingTime(distance) {
        // Average biking speed: 15 km/h
        return Math.round((distance / 15) * 60);
    },

    /**
     * Show analysis results
     * @param {string} content - HTML content to display
     * @param {string} type - Result type (success, error, info)
     */
    showResults(content, type = 'success') {
        const resultsDiv = document.getElementById('analysis-results');
        const resultsContent = document.getElementById('results-content');
        const infoDiv = document.getElementById('analysis-info');
        
        if (resultsDiv && resultsContent) {
            resultsDiv.style.display = 'block';
            resultsContent.innerHTML = content;
            resultsContent.className = `results-content ${type}`;
        }
        
        if (infoDiv && type !== 'error') {
            infoDiv.style.display = 'none';
        }
    },

    /**
     * Clear all analysis layers and results
     */
    clearAnalysis() {
        if (this.state.analysisLayer) {
            this.state.analysisLayer.clearLayers();
        }
        this.state.lastClickPoint = null;
        
        const resultsDiv = document.getElementById('analysis-results');
        const infoDiv = document.getElementById('analysis-info');
        
        if (resultsDiv) {
            resultsDiv.style.display = 'none';
        }
        
        if (infoDiv) {
            infoDiv.style.display = 'block';
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisUtils;
}
