/**
 * Map Initializer
 * Main module for initializing and setting up the Leaflet map
 */

const MapInitializer = {
    /**
     * Initialize the map with all layers and controls
     * @returns {L.Map} Leaflet map instance
     */
    init() {
        try {
            // Create map instance
            const map = L.map('map', {
                center: MapConfig.center,
                zoom: MapConfig.zoom,
                minZoom: MapConfig.minZoom,
                maxZoom: MapConfig.maxZoom,
                zoomControl: false
            });

            // Add zoom control
            L.control.zoom({
                position: MapConfig.controls.zoom
            }).addTo(map);

            // Create base layers
            const baseLayers = this.createBaseLayers(map);

            // Create overlay layers
            const overlayLayers = this.createOverlayLayers(map);

            // Add layer control
            this.addLayerControl(map, baseLayers.maps, overlayLayers.maps);

            // Add scale control
            L.control.scale({
                position: MapConfig.controls.scale,
                metric: true,
                imperial: false
            }).addTo(map);

            // Load GeoJSON data
            GeoJSONLoader.loadData(map, overlayLayers.groups);

            return map;
        } catch (error) {
            console.error('Map initialization failed:', error);
            UIUtils.showError('Gagal menginisialisasi peta.');
            throw error;
        }
    },

    /**
     * Create base map layers
     * @param {L.Map} map - Leaflet map instance
     * @returns {Object} Object containing base layers and layer group
     */
    createBaseLayers(map) {
        const osmLayer = L.tileLayer(MapConfig.baseMaps.osm.url, {
            attribution: MapConfig.baseMaps.osm.attribution,
            errorTileUrl: MapConfig.baseMaps.osm.errorTileUrl
        }).addTo(map);

        const satelliteLayer = L.tileLayer(MapConfig.baseMaps.satellite.url, {
            attribution: MapConfig.baseMaps.satellite.attribution,
            maxZoom: MapConfig.baseMaps.satellite.maxZoom
        });

        return {
            osm: osmLayer,
            satellite: satelliteLayer,
            maps: {
                'OpenStreetMap': osmLayer,
                'Satelit': satelliteLayer
            }
        };
    },

    /**
     * Create overlay layer groups
     * @param {L.Map} map - Leaflet map instance
     * @returns {Object} Object containing layer groups
     */
    createOverlayLayers(map) {
        const groups = {
            batasKecamatan: L.layerGroup().addTo(map),
            sdn: L.layerGroup().addTo(map),
            smp: L.layerGroup().addTo(map),
            sma: L.layerGroup().addTo(map),
            universitas: L.layerGroup().addTo(map),
            lainnya: L.layerGroup().addTo(map),
            rumahSakit: L.layerGroup().addTo(map),
            puskesmas: L.layerGroup().addTo(map),
            klinik: L.layerGroup().addTo(map),
            posyandu: L.layerGroup().addTo(map)
        };

        const maps = {};
        Object.keys(groups).forEach(key => {
            maps[MapConfig.layerNames[key]] = groups[key];
        });

        return { groups, maps };
    },

    /**
     * Add layer control to map
     * @param {L.Map} map - Leaflet map instance
     * @param {Object} baseMaps - Base map layers
     * @param {Object} overlayMaps - Overlay layers
     */
    addLayerControl(map, baseMaps, overlayMaps) {
        L.control.layers(baseMaps, overlayMaps, {
            position: MapConfig.controls.layers,
            collapsed: false
        }).addTo(map);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapInitializer;
}