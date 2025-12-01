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
     * @param {string} mode - Analysis mode (nearest, distance, buffer, topN, isochrone, gap, compare)
     */
    setMode(mode) {
        this.state.currentMode = mode;
        this.state.lastClickPoint = null;
        const infoDiv = document.getElementById('analysis-info');
        
        const instructions = {
            nearest: '🎯 Klik pada peta untuk mencari fasilitas terdekat dari titik tersebut.',
            distance: '📏 Klik dua titik pada peta untuk mengukur jarak antara keduanya.',
            buffer: '⭕ Klik pada peta untuk menampilkan area layanan 1km dari titik tersebut.',
            topN: '🏆 Klik pada peta untuk mencari 5 fasilitas terdekat dari lokasi Anda.',
            isochrone: '🕐 Klik pada peta untuk analisis zona waktu tempuh (isochrone).',
            gap: '⚠️ Klik pada peta untuk analisis kesenjangan aksesibilitas (gap analysis).',
            compare: '⚖️ Klik dua lokasi untuk membandingkan tingkat aksesibilitas.'
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
                case 'topN':
                    this.findTopNearestFacilities(point, e.latlng, 5);
                    break;
                case 'isochrone':
                    this.isochroneAnalysis(point, e.latlng);
                    break;
                case 'gap':
                    this.gapAnalysis(point, e.latlng);
                    break;
                case 'compare':
                    this.compareAccessibility(point, e.latlng);
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
    },

    /**
     * Find top N nearest facilities from a point
     * @param {Array} point - [lng, lat]
     * @param {L.LatLng} latlng - Leaflet LatLng object
     * @param {number} topN - Number of facilities to find (default: 5)
     */
    findTopNearestFacilities(point, latlng, topN = 5) {
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
        
        clickMarker.bindPopup('📍 Lokasi Anda').openPopup();

        if (this.state.allFacilities.length === 0) {
            this.showResults('Tidak ada data fasilitas yang dimuat.', 'error');
            return;
        }

        // Create point feature
        const from = turf.point(point);
        const facilitiesWithDistance = [];

        // Calculate distances for all facilities
        this.state.allFacilities.forEach(facility => {
            if (facility.geometry && facility.geometry.type === 'Point') {
                const to = turf.point(facility.geometry.coordinates);
                const distance = turf.distance(from, to, { units: 'kilometers' });
                facilitiesWithDistance.push({
                    facility,
                    distance
                });
            }
        });

        // Sort by distance and get top N
        const topFacilities = facilitiesWithDistance
            .sort((a, b) => a.distance - b.distance)
            .slice(0, topN);

        if (topFacilities.length === 0) {
            this.showResults('Tidak ditemukan fasilitas.', 'error');
            return;
        }

        // Visualize top facilities
        const bounds = [latlng];
        const colors = ['#28a745', '#0066cc', '#ffc107', '#dc3545', '#6f42c1'];
        
        let resultsHTML = '<div class="multi-facility-results">';
        
        topFacilities.forEach((item, index) => {
            const facility = item.facility;
            const facilityCoords = facility.geometry.coordinates;
            const facilityLatLng = L.latLng(facilityCoords[1], facilityCoords[0]);
            const color = colors[index % colors.length];

            // Draw line
            L.polyline([latlng, facilityLatLng], {
                color: color,
                weight: 2,
                opacity: 0.6,
                dashArray: index === 0 ? null : '5, 5'
            }).addTo(this.state.analysisLayer);

            // Add numbered marker
            const facilityMarker = L.marker(facilityLatLng, {
                icon: L.divIcon({
                    className: 'numbered-marker',
                    html: `<div style="background: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                    iconSize: [28, 28]
                })
            }).addTo(this.state.analysisLayer);

            const props = facility.properties;
            const facilityName = props.nama || props.KETERANGAN || 'Fasilitas';
            const facilityType = this.getFacilityType(props);

            facilityMarker.bindPopup(`
                <strong>#${index + 1} - ${facilityName}</strong><br>
                Jenis: ${facilityType}<br>
                Jarak: <strong>${item.distance.toFixed(2)} km</strong><br>
                ≈ ${this.calculateWalkingTime(item.distance)} menit berjalan
            `);

            bounds.push(facilityLatLng);

            // Add to results
            resultsHTML += `
                <div class="result-item" style="border-left: 4px solid ${color};">
                    <div class="result-rank">#${index + 1}</div>
                    <div class="result-details">
                        <div class="result-name">${facilityName}</div>
                        <div class="result-type">${facilityType}</div>
                        <div class="result-distance">${item.distance.toFixed(2)} km • ${this.calculateWalkingTime(item.distance)} menit</div>
                    </div>
                </div>
            `;
        });

        resultsHTML += '</div>';
        this.showResults(resultsHTML);

        // Fit bounds to show all facilities
        this.map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
    },

    /**
     * Advanced isochrone analysis - multiple distance rings
     * @param {Array} point - [lng, lat]
     * @param {L.LatLng} latlng - Leaflet LatLng object
     */
    isochroneAnalysis(point, latlng) {
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
        
        clickMarker.bindPopup('📍 Pusat Analisis Isochrone').openPopup();

        // Define isochrone zones (in km)
        const zones = [
            { distance: 0.5, color: '#28a745', label: '5 menit', minutes: 5 },
            { distance: 1.0, color: '#17a2b8', label: '10 menit', minutes: 10 },
            { distance: 1.5, color: '#ffc107', label: '15 menit', minutes: 15 },
            { distance: 2.0, color: '#fd7e14', label: '20 menit', minutes: 20 },
            { distance: 2.5, color: '#dc3545', label: '25+ menit', minutes: 25 }
        ];

        const center = turf.point(point);
        const zoneStats = {};

        // Create isochrone zones
        zones.reverse().forEach((zone, index) => {
            const buffered = turf.buffer(center, zone.distance, { units: 'kilometers' });
            const coords = buffered.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            
            const polygon = L.polygon(coords, {
                color: zone.color,
                weight: 2,
                opacity: 0.7,
                fillColor: zone.color,
                fillOpacity: 0.15
            }).addTo(this.state.analysisLayer);
            
            polygon.bindPopup(`
                <strong>Zona ${zone.label}</strong><br>
                Radius: ${zone.distance} km<br>
                Waktu tempuh berjalan kaki
            `);

            // Count facilities in this zone
            const facilitiesInZone = this.state.allFacilities.filter(facility => {
                if (facility.geometry && facility.geometry.type === 'Point') {
                    const facilityPoint = turf.point(facility.geometry.coordinates);
                    const distance = turf.distance(center, facilityPoint, { units: 'kilometers' });
                    return distance <= zone.distance;
                }
                return false;
            });

            zoneStats[zone.label] = {
                count: facilitiesInZone.length,
                color: zone.color,
                distance: zone.distance,
                minutes: zone.minutes
            };
        });

        zones.reverse(); // Restore order

        // Generate results
        let resultsHTML = `
            <div class="isochrone-results">
                <h4>Analisis Aksesibilitas Waktu Tempuh</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">Berdasarkan kecepatan berjalan kaki rata-rata (5 km/jam)</p>
        `;

        zones.forEach(zone => {
            const stats = zoneStats[zone.label];
            resultsHTML += `
                <div class="zone-stat" style="border-left: 4px solid ${zone.color}; padding-left: 10px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: ${zone.color};">${zone.label} (${zone.distance} km)</div>
                    <div style="font-size: 0.9em;">${stats.count} fasilitas tersedia</div>
                </div>
            `;
        });

        // Accessibility assessment
        const nearestZone = zoneStats['5 menit'].count;
        const walkableZone = zoneStats['15 menit'].count;
        
        resultsHTML += `
            <div class="accessibility-assessment" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <h5 style="margin: 0 0 10px 0;">Penilaian Aksesibilitas</h5>
        `;

        if (nearestZone > 0) {
            resultsHTML += `<div style="color: #28a745; margin-bottom: 5px;">✓ ${nearestZone} fasilitas dalam jarak sangat dekat (≤5 menit)</div>`;
        } else {
            resultsHTML += `<div style="color: #dc3545; margin-bottom: 5px;">✗ Tidak ada fasilitas dalam radius 500m</div>`;
        }

        if (walkableZone >= 3) {
            resultsHTML += `<div style="color: #28a745;">✓ Aksesibilitas baik: ${walkableZone} fasilitas dalam 15 menit berjalan</div>`;
        } else if (walkableZone > 0) {
            resultsHTML += `<div style="color: #ffc107;">⚠ Aksesibilitas sedang: ${walkableZone} fasilitas dalam 15 menit</div>`;
        } else {
            resultsHTML += `<div style="color: #dc3545;">⚠ GAP AKSESIBILITAS: Tidak ada fasilitas dalam 15 menit berjalan kaki!</div>`;
        }

        resultsHTML += `</div></div>`;
        
        this.showResults(resultsHTML);

        // Fit bounds to show largest zone
        const buffered = turf.buffer(center, 2.5, { units: 'kilometers' });
        const coords = buffered.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        this.map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] });
    },

    /**
     * Gap Analysis - Identify underserved areas
     * @param {Array} point - [lng, lat]
     * @param {L.LatLng} latlng - Leaflet LatLng object
     */
    gapAnalysis(point, latlng) {
        this.clearAnalysis();

        const clickMarker = L.circleMarker(latlng, {
            radius: 10,
            fillColor: '#dc3545',
            color: '#fff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(this.state.analysisLayer);
        
        clickMarker.bindPopup('📍 Lokasi Gap Analysis').openPopup();

        const center = turf.point(point);
        const standardDistance = 1.0; // 1 km standard WHO
        const criticalDistance = 0.5; // 500m critical distance

        // Check facilities within standard distance
        const facilitiesNearby = this.state.allFacilities.filter(facility => {
            if (facility.geometry && facility.geometry.type === 'Point') {
                const facilityPoint = turf.point(facility.geometry.coordinates);
                const distance = turf.distance(center, facilityPoint, { units: 'kilometers' });
                return distance <= standardDistance;
            }
            return false;
        });

        const facilitiesCritical = this.state.allFacilities.filter(facility => {
            if (facility.geometry && facility.geometry.type === 'Point') {
                const facilityPoint = turf.point(facility.geometry.coordinates);
                const distance = turf.distance(center, facilityPoint, { units: 'kilometers' });
                return distance <= criticalDistance;
            }
            return false;
        });

        // Visualize standard and critical zones
        const criticalZone = turf.buffer(center, criticalDistance, { units: 'kilometers' });
        const criticalCoords = criticalZone.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        L.polygon(criticalCoords, {
            color: '#28a745',
            weight: 2,
            opacity: 0.7,
            fillColor: '#28a745',
            fillOpacity: 0.1
        }).addTo(this.state.analysisLayer)
          .bindPopup('<strong>Zona Ideal</strong><br>≤500m (Walking Distance)');

        const standardZone = turf.buffer(center, standardDistance, { units: 'kilometers' });
        const standardCoords = standardZone.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
        L.polygon(standardCoords, {
            color: '#ffc107',
            weight: 2,
            opacity: 0.7,
            fillColor: '#ffc107',
            fillOpacity: 0.1
        }).addTo(this.state.analysisLayer)
          .bindPopup('<strong>Zona Standar</strong><br>≤1 km (WHO Standard)');

        // Categorize facilities by type
        const facilityTypes = {};
        facilitiesNearby.forEach(f => {
            const type = this.getFacilityType(f.properties);
            facilityTypes[type] = (facilityTypes[type] || 0) + 1;
        });

        // Determine gap status
        let gapStatus = '';
        let gapColor = '';
        let gapLevel = '';

        if (facilitiesCritical.length === 0 && facilitiesNearby.length === 0) {
            gapStatus = 'CRITICAL GAP';
            gapColor = '#dc3545';
            gapLevel = 'Akses Sangat Buruk';
        } else if (facilitiesCritical.length === 0) {
            gapStatus = 'MODERATE GAP';
            gapColor = '#ffc107';
            gapLevel = 'Akses Sedang';
        } else if (facilitiesCritical.length < 2) {
            gapStatus = 'MINOR GAP';
            gapColor = '#17a2b8';
            gapLevel = 'Akses Cukup';
        } else {
            gapStatus = 'WELL SERVED';
            gapColor = '#28a745';
            gapLevel = 'Akses Baik';
        }

        let resultsHTML = `
            <div class="gap-analysis-results">
                <div class="gap-status" style="background: ${gapColor}; color: white; padding: 12px; border-radius: 6px; margin-bottom: 15px; text-align: center;">
                    <div style="font-weight: bold; font-size: 1.1em;">${gapStatus}</div>
                    <div style="font-size: 0.9em; opacity: 0.9;">${gapLevel}</div>
                </div>
                
                <div class="gap-metrics">
                    <div class="metric-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <span>Zona Ideal (≤500m):</span>
                        <strong style="color: ${facilitiesCritical.length > 0 ? '#28a745' : '#dc3545'};">${facilitiesCritical.length} fasilitas</strong>
                    </div>
                    <div class="metric-row" style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px;">
                        <span>Zona Standar (≤1km):</span>
                        <strong style="color: ${facilitiesNearby.length > 0 ? '#28a745' : '#dc3545'};">${facilitiesNearby.length} fasilitas</strong>
                    </div>
                </div>

                <h5 style="margin-top: 15px; margin-bottom: 10px;">Distribusi Tipe Fasilitas:</h5>
                <div class="facility-breakdown">
        `;

        if (Object.keys(facilityTypes).length > 0) {
            for (const [type, count] of Object.entries(facilityTypes)) {
                resultsHTML += `
                    <div class="type-row" style="display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee;">
                        <span>${type}</span>
                        <strong>${count}</strong>
                    </div>
                `;
            }
        } else {
            resultsHTML += '<div style="color: #999; font-style: italic;">Tidak ada fasilitas dalam radius 1 km</div>';
        }

        resultsHTML += `
                </div>

                <div class="recommendations" style="margin-top: 15px; padding: 10px; background: #e7f3ff; border-left: 4px solid #0066cc; border-radius: 4px;">
                    <h5 style="margin: 0 0 8px 0; color: #0066cc;">💡 Rekomendasi:</h5>
        `;

        if (facilitiesCritical.length === 0) {
            resultsHTML += '<div style="font-size: 0.9em;">• Pertimbangkan pembangunan fasilitas baru dalam radius 500m</div>';
        }
        if (facilitiesNearby.length < 3) {
            resultsHTML += '<div style="font-size: 0.9em;">• Tingkatkan jumlah fasilitas untuk memenuhi standar minimum</div>';
        }
        if (Object.keys(facilityTypes).length < 2) {
            resultsHTML += '<div style="font-size: 0.9em;">• Diversifikasi jenis fasilitas untuk layanan yang lebih komprehensif</div>';
        }
        if (facilitiesNearby.length >= 3 && facilitiesCritical.length >= 2) {
            resultsHTML += '<div style="font-size: 0.9em; color: #28a745;">✓ Area ini sudah terlayani dengan baik</div>';
        }

        resultsHTML += `
                </div>
            </div>
        `;

        this.showResults(resultsHTML);

        // Fit bounds
        this.map.fitBounds(L.latLngBounds(standardCoords), { padding: [50, 50] });
    },

    /**
     * Compare accessibility from multiple points
     * @param {Array} point - [lng, lat]
     * @param {L.LatLng} latlng - Leaflet LatLng object
     */
    compareAccessibility(point, latlng) {
        if (!this.state.lastClickPoint) {
            // First click
            this.clearAnalysis();
            this.state.lastClickPoint = { point, latlng };
            
            const marker = L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#0066cc',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.state.analysisLayer);
            
            marker.bindPopup('📍 Lokasi A').openPopup();
            
            this.showResults(`
                <div class="result-info">
                    <p>Klik lokasi kedua (Lokasi B) untuk membandingkan aksesibilitas.</p>
                </div>
            `);
        } else {
            // Second click - compare
            const pointA = turf.point(this.state.lastClickPoint.point);
            const pointB = turf.point(point);

            const marker2 = L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#dc3545',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.state.analysisLayer);
            
            marker2.bindPopup('📍 Lokasi B').openPopup();

            // Calculate accessibility for both points
            const radius = 1.0; // 1 km
            
            const facilitiesA = this.state.allFacilities.filter(facility => {
                if (facility.geometry && facility.geometry.type === 'Point') {
                    const facilityPoint = turf.point(facility.geometry.coordinates);
                    return turf.distance(pointA, facilityPoint, { units: 'kilometers' }) <= radius;
                }
                return false;
            });

            const facilitiesB = this.state.allFacilities.filter(facility => {
                if (facility.geometry && facility.geometry.type === 'Point') {
                    const facilityPoint = turf.point(facility.geometry.coordinates);
                    return turf.distance(pointB, facilityPoint, { units: 'kilometers' }) <= radius;
                }
                return false;
            });

            // Draw comparison circles
            const circleA = turf.buffer(pointA, radius, { units: 'kilometers' });
            const coordsA = circleA.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            L.polygon(coordsA, {
                color: '#0066cc',
                weight: 2,
                opacity: 0.6,
                fillColor: '#0066cc',
                fillOpacity: 0.1
            }).addTo(this.state.analysisLayer);

            const circleB = turf.buffer(pointB, radius, { units: 'kilometers' });
            const coordsB = circleB.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
            L.polygon(coordsB, {
                color: '#dc3545',
                weight: 2,
                opacity: 0.6,
                fillColor: '#dc3545',
                fillOpacity: 0.1
            }).addTo(this.state.analysisLayer);

            // Find nearest for each
            let nearestA = null, nearestB = null;
            let minDistA = Infinity, minDistB = Infinity;

            this.state.allFacilities.forEach(facility => {
                if (facility.geometry && facility.geometry.type === 'Point') {
                    const facilityPoint = turf.point(facility.geometry.coordinates);
                    const distA = turf.distance(pointA, facilityPoint, { units: 'kilometers' });
                    const distB = turf.distance(pointB, facilityPoint, { units: 'kilometers' });
                    
                    if (distA < minDistA) {
                        minDistA = distA;
                        nearestA = facility;
                    }
                    if (distB < minDistB) {
                        minDistB = distB;
                        nearestB = facility;
                    }
                }
            });

            let resultsHTML = `
                <div class="comparison-results">
                    <h4>Perbandingan Aksesibilitas</h4>
                    <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">Radius analisis: ${radius} km</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                        <div style="padding: 10px; background: linear-gradient(135deg, #0066cc22, transparent); border: 2px solid #0066cc; border-radius: 6px;">
                            <div style="font-weight: bold; color: #0066cc; margin-bottom: 5px;">📍 Lokasi A</div>
                            <div style="font-size: 1.2em; font-weight: bold;">${facilitiesA.length}</div>
                            <div style="font-size: 0.85em; color: #666;">fasilitas</div>
                        </div>
                        <div style="padding: 10px; background: linear-gradient(135deg, #dc354522, transparent); border: 2px solid #dc3545; border-radius: 6px;">
                            <div style="font-weight: bold; color: #dc3545; margin-bottom: 5px;">📍 Lokasi B</div>
                            <div style="font-size: 1.2em; font-weight: bold;">${facilitiesB.length}</div>
                            <div style="font-size: 0.85em; color: #666;">fasilitas</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <h5 style="margin-bottom: 8px;">Fasilitas Terdekat:</h5>
                        <div style="background: #f8f9fa; padding: 8px; border-radius: 4px; margin-bottom: 5px;">
                            <div style="color: #0066cc; font-weight: bold;">Lokasi A:</div>
                            <div style="font-size: 0.9em;">${nearestA ? (nearestA.properties.nama || nearestA.properties.KETERANGAN) : 'N/A'} - ${minDistA.toFixed(2)} km</div>
                        </div>
                        <div style="background: #f8f9fa; padding: 8px; border-radius: 4px;">
                            <div style="color: #dc3545; font-weight: bold;">Lokasi B:</div>
                            <div style="font-size: 0.9em;">${nearestB ? (nearestB.properties.nama || nearestB.properties.KETERANGAN) : 'N/A'} - ${minDistB.toFixed(2)} km</div>
                        </div>
                    </div>

                    <div style="padding: 10px; background: #e7f3ff; border-left: 4px solid #0066cc; border-radius: 4px;">
                        <strong>Kesimpulan:</strong><br>
            `;

            const diff = facilitiesA.length - facilitiesB.length;
            if (diff > 0) {
                resultsHTML += `<div style="margin-top: 5px;">Lokasi A memiliki aksesibilitas <strong style="color: #28a745;">${diff} fasilitas lebih baik</strong> dibanding Lokasi B.</div>`;
            } else if (diff < 0) {
                resultsHTML += `<div style="margin-top: 5px;">Lokasi B memiliki aksesibilitas <strong style="color: #28a745;">${Math.abs(diff)} fasilitas lebih baik</strong> dibanding Lokasi A.</div>`;
            } else {
                resultsHTML += `<div style="margin-top: 5px;">Kedua lokasi memiliki <strong>aksesibilitas yang setara</strong>.</div>`;
            }

            resultsHTML += `
                    </div>
                </div>
            `;

            this.showResults(resultsHTML);

            // Fit bounds to show both points
            this.map.fitBounds(L.latLngBounds([this.state.lastClickPoint.latlng, latlng]), { padding: [100, 100] });

            this.state.lastClickPoint = null;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnalysisUtils;
}
