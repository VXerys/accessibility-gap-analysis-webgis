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
        subtitle = "Berdasarkan estimasi waktu dan jarak tempuh";
        ranges = [0.05, 0.25, 0.5];
        labels = [
          "2-3 menit (50 m)",
          "10-15 menit (250 m)",
          "30 menit (500 m)",
        ];
      } else {
        title = "Analisis Service Area";
        subtitle = "Analisis jangkauan layanan berdasarkan radius.";
        ranges = [0.05, 0.25, 0.5];
        labels = ["50 m", "250 m", "500 m"];
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
            <div class="modern-result-card">
                <h4><i class="ph-duotone ph-timer" style="color:#8b5cf6"></i> ${title}</h4>
                <div style="font-size:0.9em; color:#64748b; margin-bottom:16px;">${subtitle}</div>
                
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <div class="highlight-box success" style="margin:0; padding:12px; border-left:4px solid #10b981;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700; color:#047857;">${labels[0]}</span>
                            <span style="background:white; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.85em; color:#047857;">${facilityCounts[0]} Fasilitas</span>
                        </div>
                    </div>
                    
                    <div class="highlight-box warning" style="margin:0; padding:12px; border-left:4px solid #f59e0b;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700; color:#b45309;">${labels[1]}</span>
                            <span style="background:white; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.85em; color:#b45309;">+ ${facilityCounts[1]} Fasilitas</span>
                        </div>
                    </div>

                    <div class="highlight-box danger" style="margin:0; padding:12px; border-left:4px solid #ef4444;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-weight:700; color:#b91c1c;">${labels[2]}</span>
                            <span style="background:white; padding:2px 8px; border-radius:12px; font-weight:bold; font-size:0.85em; color:#b91c1c;">+ ${facilityCounts[2]} Fasilitas</span>
                        </div>
                    </div>
                </div>

                <div class="highlight-box" style="margin-top:16px; background:#f8fafc; border:1px solid #e2e8f0;">
                    <div class="highlight-title" style="font-size:0.9em;"><i class="ph-fill ph-check-circle" style="color:#10b981"></i> Kesimpulan</div>
                    <div class="highlight-desc">
                         Area hijau adalah zona dengan aksesibilitas terbaik. Semakin merah, semakin sulit akses menuju pusat analisis.
                    </div>
                </div>
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
