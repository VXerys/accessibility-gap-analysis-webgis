/**
 * Marker Utilities
 * Handles creation and styling of map markers
 */

const MarkerUtils = {
    /**
     * Icon configuration based on school type
     */
    iconConfig: {
        sdn: { color: '#0066cc', symbol: '🏫' },
        smp: { color: '#28a745', symbol: '🏫' },
        sma: { color: '#dc3545', symbol: '🏫' },
        universitas: { color: '#6f42c1', symbol: '🎓' },
        lainnya: { color: '#0066cc', symbol: '🏫' },
        default: { color: '#3388ff', symbol: '●' }
    },

    /**
     * Determine icon configuration based on feature properties
     * @param {Object} props - Feature properties
     * @returns {Object} Icon configuration with color and symbol
     */
    getIconConfig(props) {
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
     * @param {string} dataSource - Source of data ('map' or 'school')
     * @returns {L.Marker} Leaflet marker instance
     */
    createMarker(feature, latlng, dataSource) {
        const props = feature.properties;
        const config = this.getIconConfig(props);
        
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
        
        return L.marker(latlng, { icon: markerIcon });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarkerUtils;
}
