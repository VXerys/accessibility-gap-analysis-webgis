/**
 * GeoJSON Data Loader
 * Handles loading and processing of GeoJSON data
 */

const GeoJSONLoader = {
  allFacilities: [],

  loadData(map, layers) {
    UIUtils.showLoading();

    Promise.all([
      this.fetchGeoJSON(MapConfig.dataSources.mapGeojson),
      this.fetchGeoJSON(MapConfig.dataSources.schoolGeojson),
      this.fetchGeoJSON(MapConfig.dataSources.healthGeojson),
    ])
      .then(([mapData, schoolData, healthData]) => {
        this.processGeoJSONData(mapData, layers, "map");
        this.processGeoJSONData(schoolData, layers, "school");
        this.processGeoJSONData(healthData, layers, "health");

        // Store facilities for analysis
        if (typeof AnalysisUtils !== "undefined") {
          AnalysisUtils.storeFacilities(this.allFacilities);
        }

        UIUtils.hideLoading();
      })
      .catch((error) => {
        console.error("Error loading GeoJSON:", error);
        UIUtils.showError("Gagal memuat data peta. Silakan refresh halaman.");
        UIUtils.hideLoading();
      });
  },

  fetchGeoJSON(url) {
    return fetch(url).then((response) => {
      if (!response.ok) {
        throw new Error(
          `HTTP error loading ${url}! status: ${response.status}`
        );
      }
      return response.json();
    });
  },

  processGeoJSONData(data, layers, dataSource) {
    L.geoJSON(data, {
      style: this.getFeatureStyle,
      pointToLayer: (feature, latlng) => {
        // Store point features for analysis
        if (feature.geometry.type === "Point" && dataSource !== "map") {
          this.allFacilities.push(feature);
        }
        return MarkerUtils.createMarker(feature, latlng, dataSource);
      },
      onEachFeature: (feature, layer) => {
        // 🔴 UPDATE PENTING: TANGKAP DATA BATAS KECAMATAN
        if (
          feature.properties.BatasKecamatan &&
          typeof AnalysisUtils !== "undefined"
        ) {
          console.log("📍 Batas Kecamatan Terdeteksi & Disimpan");
          AnalysisUtils.setDistrictBoundary(feature);
        }

        this.bindFeaturePopup(feature, layer, layers, dataSource);
      },
    });
  },

  getFeatureStyle(feature) {
    const styles = {
      BatasKecamatan: {
        color: "#ff7800",
        weight: 4,
        opacity: 0.8,
        fillOpacity: 0.1,
      },
      SDN: {
        color: "#0066cc",
        weight: 3,
        opacity: 0.9,
        fillOpacity: 0.2,
      },
    };

    if (feature.properties.BatasKecamatan) {
      return styles.BatasKecamatan;
    }
    if (feature.properties.SDN) {
      return styles.SDN;
    }

    return {
      color: "#666",
      weight: 2,
      opacity: 0.7,
    };
  },

  bindFeaturePopup(feature, layer, layers, dataSource) {
    const { popupContent, category } = PopupUtils.generatePopupContent(
      feature.properties,
      dataSource
    );

    if (popupContent && category && layers[category]) {
      layer.bindPopup(popupContent, {
        maxWidth: 300,
        className: "custom-popup",
      });
      layers[category].addLayer(layer);

      // Update stats logic...
      if (category === "sdn") UIUtils.incrementStat("sd");
      else if (category === "smp") UIUtils.incrementStat("smp");
      else if (category === "sma") UIUtils.incrementStat("sma");
      else if (category === "universitas") UIUtils.incrementStat("universitas");
      else if (category === "rumahSakit") UIUtils.incrementStat("rumahSakit");
      else if (category === "puskesmas") UIUtils.incrementStat("puskesmas");
      else if (category === "klinik") UIUtils.incrementStat("klinik");
      else if (category === "posyandu") UIUtils.incrementStat("posyandu");
    }
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = GeoJSONLoader;
}
