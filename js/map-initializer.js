const MapInitializer = {
  init() {
    try {
      const map = L.map("map", {
        center: MapConfig.center,
        zoom: MapConfig.zoom,
        minZoom: MapConfig.minZoom,
        maxZoom: MapConfig.maxZoom,
        zoomControl: false,
      });

      L.control
        .zoom({
          position: MapConfig.controls.zoom,
        })
        .addTo(map);

      const baseLayers = this.createBaseLayers(map);
      const overlayLayers = this.createOverlayLayers(map);

      this.addLayerControl(map, baseLayers.maps, overlayLayers.maps);

      L.control
        .scale({
          position: MapConfig.controls.scale,
          metric: true,
          imperial: false,
        })
        .addTo(map);

      GeoJSONLoader.loadData(map, overlayLayers.groups);

      return map;
    } catch (error) {
      console.error("Map initialization failed:", error);
      UIUtils.showError("Gagal menginisialisasi peta.");
      throw error;
    }
  },

  createBaseLayers(map) {
    const osmLayer = L.tileLayer(MapConfig.baseMaps.osm.url, {
      attribution: MapConfig.baseMaps.osm.attribution,
      errorTileUrl: MapConfig.baseMaps.osm.errorTileUrl,
    }).addTo(map);

    const satelliteLayer = L.tileLayer(MapConfig.baseMaps.satellite.url, {
      attribution: MapConfig.baseMaps.satellite.attribution,
      maxZoom: MapConfig.baseMaps.satellite.maxZoom,
    });

    return {
      osm: osmLayer,
      satellite: satelliteLayer,
      maps: {
        OpenStreetMap: osmLayer,
        Satelit: satelliteLayer,
      },
    };
  },

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
      posyandu: L.layerGroup().addTo(map),
    };

    const maps = {};
    Object.keys(groups).forEach((key) => {
      maps[MapConfig.layerNames[key]] = groups[key];
    });

    return { groups, maps };
  },

  addLayerControl(map, baseMaps, overlayMaps) {
    L.control
      .layers(baseMaps, overlayMaps, {
        position: MapConfig.controls.layers,
        collapsed: false,
      })
      .addTo(map);
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = MapInitializer;
}
