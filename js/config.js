/**
 * Configuration file for map settings
 * Contains all map configurations including base maps, zoom levels, and center coordinates
 */

const MapConfig = {
    // Map center coordinates [latitude, longitude]
    center: [-6.90767, 106.92025],
    
    // Zoom settings
    zoom: 15,
    minZoom: 10,
    maxZoom: 18,
    
    // Base map configurations
    baseMaps: {
        osm: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
            errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE0cHgiIGZpbGw9IiM5OTkiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='
        },
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '© <a href="https://www.esri.com/">Esri</a>',
            maxZoom: 19
        }
    },
    
    // GeoJSON data sources
    dataSources: {
        mapGeojson: 'map.geojson',
        schoolGeojson: 'sd-smp-sma.geojson',
        healthGeojson: 'RS_Puskesmas_Klinik.geojson'
    },
    
    // Layer names for UI
    layerNames: {
        batasKecamatan: 'Batas Kecamatan',
        sdn: 'SDN/SD/SDIT',
        smp: 'SMP/SMPN/SMPIT',
        sma: 'SMA/SMAN/SMK',
        universitas: 'Universitas',
        lainnya: 'Lainnya (Madrasah, dll)',
        rumahSakit: 'Rumah Sakit',
        puskesmas: 'Puskesmas',
        klinik: 'Klinik',
        posyandu: 'Posyandu'
    },
    
    // Control positions
    controls: {
        zoom: 'topright',
        layers: 'topleft',
        scale: 'bottomleft'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapConfig;
}