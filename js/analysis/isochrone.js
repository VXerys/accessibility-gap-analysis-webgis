Object.assign(AnalysisUtils, {
  async runIsochroneLogic(point, latlng, type) {
    this.clearAnalysisLayers();
    this.state.currentIsochroneLayer = null;
    UIUtils.showLoading();

    L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#6f42c1",
      color: "#fff",
      fillOpacity: 1,
    })
      .addTo(this.state.analysisLayer)
      .bindPopup("<b>Pusat Analisis</b>")
      .openPopup();

    try {
      let ranges, labels, title, subtitle;
      const processedFeatures = [];
      const facilityCounts = [0, 0, 0];

      if (type === "time") {
        title = "Analisis Aksesibilitas Waktu Tempuh";
        subtitle = "Berdasarkan kecepatan berjalan kaki rata-rata (5 km/jam)";
        ranges = [0.5, 1.0, 1.5];
        labels = ["5 menit (0.5 km)", "10 menit (1 km)", "15 menit (1.5 km)"];
      } else {
        title = "Analisis Service Area";
        subtitle = "Analisis jangkauan layanan berdasarkan radius.";
        ranges = [0.5, 1.0, 1.5];
        labels = ["500 m", "1 km", "1.5 km"];
      }

      const center = turf.point(point);
      const options = { steps: 64, units: "kilometers" };

      const circleSmall = turf.circle(center, ranges[0], options);
      const circleMedium = turf.circle(center, ranges[1], options);
      const circleLarge = turf.circle(center, ranges[2], options);

      const facilityPoints = turf.featureCollection(
        this.state.allFacilities.map((f) => turf.point(f.geometry.coordinates))
      );

      circleSmall.properties = { rangeType: "green", value: 1 };
      processedFeatures.push(circleSmall);
      facilityCounts[0] = turf.pointsWithinPolygon(
        facilityPoints,
        circleSmall
      ).features.length;

      const diffMedium = turf.difference(circleMedium, circleSmall);
      if (diffMedium) {
        diffMedium.properties = { rangeType: "yellow", value: 2 };
        processedFeatures.push(diffMedium);
      }
      facilityCounts[1] = turf.pointsWithinPolygon(
        facilityPoints,
        circleMedium
      ).features.length;

      const diffLarge = turf.difference(circleLarge, circleMedium);
      if (diffLarge) {
        diffLarge.properties = { rangeType: "red", value: 3 };
        processedFeatures.push(diffLarge);
      }
      facilityCounts[2] = turf.pointsWithinPolygon(
        facilityPoints,
        circleLarge
      ).features.length;

      this.state.isochroneData = {
        type: "FeatureCollection",
        features: processedFeatures,
      };
      this.state.isochroneRanges = ranges;
      this.state.activeIsochroneFilter = null;
      this.renderIsochroneLayer("all");

      const resultHTML = `
            <div class="result-item" style="padding: 20px; border: none; box-shadow: none;">
                <h4 style="margin:0 0 5px 0; color:#2c3e50; font-size:16px;">${title}</h4>
                <div style="font-size:0.8em; color:#666; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">${subtitle}</div>
                <div style="margin-bottom:10px; background:#f0fdf4; padding:12px; border-radius:6px; border-left:5px solid #28a745;">
                    <div style="font-weight:700; font-size:1em; color:#15803d;">${labels[0]}</div>
                    <div style="font-size:0.9em; color:#333; margin-top:2px;"><strong>${facilityCounts[0]}</strong> fasilitas tersedia</div>
                </div>
                <div style="margin-bottom:10px; background:#fefce8; padding:12px; border-radius:6px; border-left:5px solid #ffc107;">
                    <div style="font-weight:700; font-size:1em; color:#b45309;">${labels[1]}</div>
                    <div style="font-size:0.9em; color:#333; margin-top:2px;"><strong>${facilityCounts[1]}</strong> fasilitas tersedia</div>
                </div>
                <div style="margin-bottom:15px; background:#fef2f2; padding:12px; border-radius:6px; border-left:5px solid #dc3545;">
                    <div style="font-weight:700; font-size:1em; color:#b91c1c;">${labels[2]}</div>
                    <div style="font-size:0.9em; color:#333; margin-top:2px;"><strong>${facilityCounts[2]}</strong> fasilitas tersedia</div>
                </div>
                <div style="color:#28a745; font-weight:600; font-size:0.85em; display:flex; align-items:center; gap:6px;"><span style="font-size:1.2em;">✓</span> Analisis selesai ditampilkan</div>
            </div>`;

      this.showResults(resultHTML);
    } catch (e) {
      console.error("Isochrone Error:", e);
      this.showResults("Gagal memuat analisis.", "error");
    } finally {
      UIUtils.hideLoading();
    }
  },

  filterIsochrone(type) {
    if (this.state.activeIsochroneFilter === type) {
      this.state.activeIsochroneFilter = null;
      this.renderIsochroneLayer("all");
    } else {
      this.state.activeIsochroneFilter = type;
      this.renderIsochroneLayer(type);
    }
  },

  updateFilterUI(activeType) {},

  renderIsochroneLayer(filterType) {
    if (this.state.currentIsochroneLayer) {
      this.state.analysisLayer.removeLayer(this.state.currentIsochroneLayer);
      this.state.currentIsochroneLayer = null;
    }
    if (!this.state.isochroneData) return;
    const layer = L.geoJSON(this.state.isochroneData, {
      filter: (feature) => {
        if (filterType === "all") return true;
        return feature.properties.rangeType === filterType;
      },
      style: (feature) => {
        const type = feature.properties.rangeType;
        let c = "#dc3545";
        let opacity = 0.2;
        if (type === "green") c = "#28a745";
        else if (type === "yellow") c = "#ffc107";
        else if (type === "red") c = "#dc3545";
        if (filterType !== "all") opacity = 0.5;
        return { color: c, weight: 2, fillOpacity: opacity, fillColor: c };
      },
    });
    this.state.currentIsochroneLayer = layer;
    this.state.analysisLayer.addLayer(layer);
    if (layer.getBounds().isValid())
      this.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
  },
});
