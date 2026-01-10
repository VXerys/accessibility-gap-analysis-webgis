Object.assign(AnalysisUtils, {
  async measureDistance(point, latlng) {
    if (!this.state.lastClickPoint) {
      this.clearAnalysisLayers();
      this.state.lastClickPoint = { point, latlng };
      const m = L.circleMarker(latlng, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#3388ff",
        fillOpacity: 1,
      }).addTo(this.state.analysisLayer);
      m.bindPopup("<b>Titik Awal</b>").openPopup();
    } else {
      const startPoint = this.state.lastClickPoint;
      const m2 = L.circleMarker(latlng, {
        radius: 7,
        color: "#fff",
        weight: 2,
        fillColor: "#dc3545",
        fillOpacity: 1,
      }).addTo(this.state.analysisLayer);
      m2.bindPopup("<b>Titik Tujuan</b>").openPopup();

      if (this.state.measureMethod === "line") {
        const straightDist = turf.distance(
          turf.point(startPoint.point),
          turf.point(point)
        );
        L.polyline([startPoint.latlng, latlng], {
          color: "#3388ff",
          weight: 3,
          dashArray: "10, 10",
          opacity: 0.8,
        }).addTo(this.state.analysisLayer);
        this.showResults(`
                  <div class="result-item" style="padding: 15px; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                      <div style="display:flex; align-items:center; gap:15px;">
                          <div style="font-size:24px;">📏</div>
                          <div>
                              <div style="font-weight:700; color:#2c3e50; font-size:1em; margin-bottom:2px;">Jarak Linear</div>
                              <div style="font-size:1.4em; font-weight:800; color:#333;">${straightDist.toFixed(
                                2
                              )} km</div>
                              <div style="font-size:0.85em; color:#888;">${(
                                straightDist * 1000
                              ).toFixed(0)} meter</div>
                          </div>
                      </div>
                  </div>
                `);
        this.state.lastClickPoint = null;
      } else {
        UIUtils.showLoading();
        try {
          const routeData = await RoutingService.getRoute(
            startPoint.point,
            point,
            "driving-car"
          );
          const summary = routeData.features[0].properties.summary;
          const distanceKm = (summary.distance / 1000).toFixed(2);
          L.geoJSON(routeData, {
            style: { color: "#3388ff", weight: 5, opacity: 0.8 },
          }).addTo(this.state.analysisLayer);
          this.showResults(`
                    <div class="modern-result-card">
                        <h4><i class="ph-duotone ph-road-horizon" style="color:#3388ff"></i> Jarak Rute Jalan</h4>
                        
                        <div class="metric-grid" style="margin-bottom:0; grid-template-columns: 1fr;">
                            <div class="metric-card" style="padding: 20px;">
                                <div class="metric-value" style="color:#3388ff; font-size:2.5rem;">${distanceKm} <span style="font-size:1rem; color:#666;">km</span></div>
                                <div class="metric-label">Total Jarak Tempuh</div>
                            </div>
                        </div>

                        <div style="margin-top:16px; padding:12px; background:#f0f9ff; border-radius:12px; color:#0c4a6e; font-size:0.9em; display:flex; gap:10px; align-items:center;">
                            <i class="ph-fill ph-info"></i>
                            <span>Jarak dihitung berdasarkan jaringan jalan asli menggunakan API routing.</span>
                        </div>
                    </div>
                  `);
        } catch (error) {
          this.showResults("Gagal rute API", "error");
        } finally {
          this.state.lastClickPoint = null;
          UIUtils.hideLoading();
        }
      }
    }
  },
});
