/**
 * GeoJSON Data Loader
 * Handles loading and processing of GeoJSON data
 */

const GeoJSONLoader = {
    /**
     * Load and process GeoJSON data from multiple sources
     * @param {L.Map} map - Leaflet map instance
     * @param {Object} layers - Layer groups object
     */
    loadData(map, layers) {
        UIUtils.showLoading();

        Promise.all([
            this.fetchGeoJSON(MapConfig.dataSources.mapGeojson),
            this.fetchGeoJSON(MapConfig.dataSources.schoolGeojson)
        ])
        .then(([mapData, schoolData]) => {
            this.processGeoJSONData(mapData, layers, 'map');
            this.processGeoJSONData(schoolData, layers, 'school');
            UIUtils.hideLoading();
        })
        .catch(error => {
            console.error('Error loading GeoJSON:', error);
            UIUtils.showError('Gagal memuat data peta. Silakan refresh halaman.');
            UIUtils.hideLoading();
        });
    },

    /**
     * Fetch GeoJSON file
     * @param {string} url - URL of GeoJSON file
     * @returns {Promise} Promise that resolves to GeoJSON data
     */
    fetchGeoJSON(url) {
        return fetch(url).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error loading ${url}! status: ${response.status}`);
            }
            return response.json();
        });
    },

    /**
     * Process GeoJSON data and add to map
     * @param {Object} data - GeoJSON data
     * @param {Object} layers - Layer groups object
     * @param {string} dataSource - Source identifier ('map' or 'school')
     */
    processGeoJSONData(data, layers, dataSource) {
        L.geoJSON(data, {
            style: this.getFeatureStyle,
            pointToLayer: (feature, latlng) => {
                return MarkerUtils.createMarker(feature, latlng, dataSource);
            },
            onEachFeature: (feature, layer) => {
                this.bindFeaturePopup(feature, layer, layers, dataSource);
            }
        });
    },

    /**
     * Get style for line/polygon features
     * @param {Object} feature - GeoJSON feature
     * @returns {Object} Leaflet style object
     */
    getFeatureStyle(feature) {
        const styles = {
            BatasKecamatan: {
                color: '#ff7800',
                weight: 4,
                opacity: 0.8,
                fillOpacity: 0.1
            },
            SDN: {
                color: '#0066cc',
                weight: 3,
                opacity: 0.9,
                fillOpacity: 0.2
            }
        };

        if (feature.properties.BatasKecamatan) {
            return styles.BatasKecamatan;
        }
        if (feature.properties.SDN) {
            return styles.SDN;
        }

        return {
            color: '#666',
            weight: 2,
            opacity: 0.7
        };
    },

    /**
     * Bind popup to feature and add to appropriate layer
     * @param {Object} feature - GeoJSON feature
     * @param {L.Layer} layer - Leaflet layer
     * @param {Object} layers - Layer groups object
     * @param {string} dataSource - Source identifier
     */
    bindFeaturePopup(feature, layer, layers, dataSource) {
        const { popupContent, category } = PopupUtils.generatePopupContent(
            feature.properties,
            dataSource
        );

        if (popupContent && category && layers[category]) {
            layer.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
            });
            layers[category].addLayer(layer);

            // Update statistics
            if (category === 'sdn') {
                UIUtils.incrementStat('sd');
            } else if (category === 'smp') {
                UIUtils.incrementStat('smp');
            } else if (category === 'sma') {
                UIUtils.incrementStat('sma');
            } else if (category === 'universitas') {
                UIUtils.incrementStat('universitas');
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeoJSONLoader;
}
