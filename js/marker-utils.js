/**
 * Marker Utilities
 * Handles creation and styling of map markers
 */

const MarkerUtils = {
    /**
     * Icon configuration based on school type and health facilities
     */
    iconConfig: {
        sdn: { color: '#0066cc', symbol: '🏫' },
        smp: { color: '#28a745', symbol: '🏫' },
        sma: { color: '#dc3545', symbol: '🏫' },
        universitas: { color: '#6f42c1', symbol: '🎓' },
        lainnya: { color: '#0066cc', symbol: '🏫' },
        rumahSakit: { color: '#e74c3c', symbol: '🏥' },
        puskesmas: { color: '#3498db', symbol: '⚕️' },
        klinik: { color: '#2ecc71', symbol: '🩺' },
        posyandu: { color: '#f39c12', symbol: '👶' },
        default: { color: '#3388ff', symbol: '●' }
    },

    /**
     * Determine icon configuration based on feature properties
     * @param {Object} props - Feature properties
     * @param {string} dataSource - Source of data ('map', 'school', or 'health')
     * @returns {Object} Icon configuration with color and symbol
     */
    getIconConfig(props, dataSource) {
        // Health facilities detection
        if (dataSource === 'health') {
            // Check for Rumah Sakit
            for (let key in props) {
                const value = props[key];
                if (key.toLowerCase().includes('rs ') || 
                    key.toLowerCase().includes('rumah sakit') ||
                    (typeof value === 'string' && value.toLowerCase().includes('rs '))) {
                    return this.iconConfig.rumahSakit;
                }
            }
            
            // Check for Puskesmas
            for (let key in props) {
                const value = props[key];
                if (key.toLowerCase().includes('puskesmas') ||
                    (typeof value === 'string' && value.toLowerCase().includes('puskesmas'))) {
                    return this.iconConfig.puskesmas;
                }
            }
            
            // Check for Posyandu
            for (let key in props) {
                const value = props[key];
                if (key.toLowerCase().includes('posyandu') ||
                    (typeof value === 'string' && value.toLowerCase().includes('posyandu'))) {
                    return this.iconConfig.posyandu;
                }
            }
            
            // Check for Klinik (default for health if not matched)
            for (let key in props) {
                const value = props[key];
                if (key.toLowerCase().includes('klinik') ||
                    (typeof value === 'string' && value.toLowerCase().includes('klinik'))) {
                    return this.iconConfig.klinik;
                }
            }
            
            // Default to klinik for health data
            return this.iconConfig.klinik;
        }
        
        // School facilities detection (existing logic)
        if (props.SDN || (props['SDN '] && props['SDN '].trim() !== '')) {
            return this.iconConfig.sdn;
        }
        if (props.SDIT || props.Madrasah) {
            return this.iconConfig.lainnya;
        }
        if (props.SMPN || props.SMP || (props['SMP '] && props['SMP '].trim() !== '')) {
            return this.iconConfig.smp;
        }
        if (props.SMAN || props.SMK || (props['SMAN '] && props['SMAN '].trim() !== '')) {
            return this.iconConfig.sma;
        }
        if (props.Universitas || (props['Universitas '] && props['Universitas '].trim() !== '')) {
            return this.iconConfig.universitas;
        }
        return this.iconConfig.default;
    },

    /**
     * Create custom marker for map points
     * @param {Object} feature - GeoJSON feature
     * @param {L.LatLng} latlng - Marker coordinates
     * @param {string} dataSource - Source of data ('map', 'school', or 'health')
     * @returns {L.Marker} Leaflet marker instance
     */
    createMarker(feature, latlng, dataSource) {
        const props = feature.properties;
        const config = this.getIconConfig(props, dataSource);
        
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${config.color};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: white;
                font-weight: bold;
            ">${config.symbol}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -14]
        });
        
        const marker = L.marker(latlng, { icon: markerIcon });

        // === Tambahan gambar popup START ===
        // Generate popup content
        const { popupContent, category } = PopupUtils.generatePopupContent(props, dataSource);

        // Cek apakah ada gambar (dari properti Foto atau ImageURL)
        let fullPopupContent = popupContent;
        if (props.Foto || props.ImageURL || props.image) {
            const imgUrl = props.Foto || props.ImageURL || props.image;
            fullPopupContent += `
                <div style="margin-top: 6px; text-align: center;">
                    <img src="${imgUrl}" alt="Foto Sekolah" 
                         style="width:200px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.3);" />
                </div>
            `;
        }

        // Pasang popup ke marker
        marker.bindPopup(fullPopupContent);
        // === Tambahan gambar popup END ===

        return marker;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkerUtils;
}