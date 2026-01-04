Object.assign(AnalysisUtils, {
  async runCompareAnalysis(point, latlng) {
    if (this.state.districtBoundary) {
      const pt = turf.point(point);
      let poly = this.state.districtBoundary;
      if (poly.geometry.type === "LineString") poly = turf.lineToPolygon(poly);
      if (!turf.booleanPointInPolygon(pt, poly)) {
        L.circleMarker(latlng, {
          radius: 8,
          fillColor: "#666",
          color: "#fff",
          fillOpacity: 0.8,
        })
          .addTo(this.state.analysisLayer)
          .bindPopup("Titik Luar Wilayah")
          .openPopup();
        this.showResults(
          `<div class="result-item" style="border-left: 5px solid #666; background:#fff0f0;"><div class="result-details"><div class="result-name" style="color:#d32f2f;">⛔ Di Luar Jangkauan</div><div style="font-size:0.9em; margin-top:5px; color:#444;">Perbandingan hanya dapat dilakukan di dalam <strong>Batas Kecamatan</strong>.</div></div></div>`,
          "error"
        );
        return;
      }
    }
    if (this.state.comparePoints.length === 0) {
      this.clearAnalysisLayers();
      this.state.comparePoints.push({ point, latlng, id: "A" });
      L.circleMarker(latlng, {
        radius: 10,
        fillColor: "#007bff",
        color: "#fff",
        fillOpacity: 1,
      })
        .addTo(this.state.analysisLayer)
        .bindPopup("<b>Titik A</b>")
        .openPopup();
      L.circle(latlng, {
        radius: 1000,
        color: "#007bff",
        dashArray: "5, 10",
        fillColor: "#007bff",
        fillOpacity: 0.1,
      }).addTo(this.state.analysisLayer);
      document.getElementById(
        "analysis-info"
      ).innerHTML = `<p class="info-instruction" style="color:#007bff;"><strong>Titik A Terpilih!</strong><br>Sekarang klik lokasi kedua (Titik B).</p>`;
      return;
    } else if (this.state.comparePoints.length === 1) {
      this.state.comparePoints.push({ point, latlng, id: "B" });
      L.circleMarker(latlng, {
        radius: 10,
        fillColor: "#dc3545",
        color: "#fff",
        fillOpacity: 1,
      })
        .addTo(this.state.analysisLayer)
        .bindPopup("<b>Titik B</b>")
        .openPopup();
      L.circle(latlng, {
        radius: 1000,
        color: "#dc3545",
        dashArray: "5, 10",
        fillColor: "#dc3545",
        fillOpacity: 0.1,
      }).addTo(this.state.analysisLayer);
      UIUtils.showLoading();
      const analysisA = this.analyzeLocationPotential(
        this.state.comparePoints[0].point
      );
      const analysisB = this.analyzeLocationPotential(
        this.state.comparePoints[1].point
      );
      const resultA = await analysisA;
      const resultB = await analysisB;
      let winnerText = "";
      let winnerColor = "";
      if (resultA.score > resultB.score) {
        winnerText = "🏆 Lokasi A Lebih Strategis";
        winnerColor = "#007bff";
      } else if (resultB.score > resultA.score) {
        winnerText = "🏆 Lokasi B Lebih Strategis";
        winnerColor = "#dc3545";
      } else {
        winnerText = "⚖️ Potensi Seimbang";
        winnerColor = "#6f42c1";
      }
      this.showResults(`
              <div class="result-item" style="border-top: 5px solid ${winnerColor}">
                  <h4 style="margin:0 0 15px 0; color:${winnerColor}; text-align:center;">${winnerText}</h4>
                  <div style="display:flex; gap:10px; margin-bottom:15px;">
                      <div style="flex:1; background:#f0f7ff; padding:10px; border-radius:8px; border:1px solid #cce5ff; text-align:center;">
                          <div style="font-weight:700; color:#007bff; margin-bottom:5px;">Lokasi A</div>
                          <div style="font-size:2em; font-weight:800; color:#333; line-height:1;">${resultA.score}</div>
                          <div style="font-size:0.7em; color:#666; margin-bottom:8px;">Skor Potensi</div>
                          <div style="font-size:0.75em; text-align:left; border-top:1px solid #ddd; padding-top:5px; color:#555;"><strong>Terdekat:</strong><br>${resultA.nearestName}<br>(${resultA.nearestDist} km)</div>
                      </div>
                      <div style="flex:1; background:#fff0f1; padding:10px; border-radius:8px; border:1px solid #f5c6cb; text-align:center;">
                          <div style="font-weight:700; color:#dc3545; margin-bottom:5px;">Lokasi B</div>
                          <div style="font-size:2em; font-weight:800; color:#333; line-height:1;">${resultB.score}</div>
                          <div style="font-size:0.7em; color:#666; margin-bottom:8px;">Skor Potensi</div>
                          <div style="font-size:0.75em; text-align:left; border-top:1px solid #ddd; padding-top:5px; color:#555;"><strong>Terdekat:</strong><br>${resultB.nearestName}<br>(${resultB.nearestDist} km)</div>
                      </div>
                  </div>
                  <div style="font-size:0.85em; background:#f8f9fa; padding:12px; border-radius:8px; color:#555; line-height:1.5; border:1px solid #eee;"><strong>Analisis:</strong><br>Lokasi dengan skor lebih tinggi memiliki aksesibilitas lebih baik ke fasilitas pendidikan dan kesehatan dalam radius 1 KM.</div>
                  <button onclick="AnalysisUtils.resetCompare()" style="width:100%; margin-top:15px; padding:10px; background:#666; color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer;">Ulangi Perbandingan</button>
              </div>`);
      this.state.comparePoints = [];
      UIUtils.hideLoading();
    }
  },

  async analyzeLocationPotential(point) {
    const from = turf.point(point);
    const distances = this.state.allFacilities.map((f) => {
      const to = turf.point(f.geometry.coordinates);
      const dist = turf.distance(from, to, { units: "kilometers" });
      const props = f.properties;
      const name = this.getRealFacilityName(props);
      return { dist, name };
    });
    distances.sort((a, b) => a.dist - b.dist);
    const nearest3 = distances.slice(0, 3);
    const avgDist = nearest3.reduce((sum, item) => sum + item.dist, 0) / 3;
    let score = Math.round(100 - avgDist * 35);
    if (score < 0) score = 0;
    if (score > 100) score = 100;
    return {
      score: score,
      nearestName: nearest3[0].name,
      nearestDist: nearest3[0].dist.toFixed(2),
    };
  },

  resetCompare() {
    this.clearAnalysisLayers();
    this.state.comparePoints = [];
    document.getElementById(
      "analysis-info"
    ).innerHTML = `<p class="info-instruction">⚖️ <strong>Mode Perbandingan</strong><br>Klik <strong>Titik A (Lokasi 1)</strong>, lalu klik <strong>Titik B (Lokasi 2)</strong>.</p>`;
    const panel = document.getElementById("analysis-panel");
    panel.classList.remove("has-results");
  },
});
