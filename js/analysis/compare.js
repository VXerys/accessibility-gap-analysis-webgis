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
        radius: 500,
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
        radius: 500,
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
          <div class="modern-result-card">
              <div style="text-align:center; margin-bottom:20px;">
                   <div style="font-size:0.85em; text-transform:uppercase; letter-spacing:1px; color:#64748b; font-weight:600; margin-bottom:4px;">HASIL ANALISIS PERBANDINGAN</div>
                   <h3 style="margin:0; font-size:1.2rem; display:flex; align-items:center; justify-content:center; gap:10px; color:${winnerColor}">
                        <i class="ph-duotone ph-trophy" style="font-size:1.4em;"></i> ${winnerText}
                   </h3>
              </div>
              
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:24px;">
                  <!-- CARD A -->
                  <div style="background:#f8fafc; border-radius:12px; padding:16px; border:1px solid ${
                    resultA.score > resultB.score ? "#3b82f6" : "#e2e8f0"
                  }; position:relative; overflow:hidden;">
                      ${
                        resultA.score > resultB.score
                          ? '<div style="position:absolute; top:0; left:0; right:0; height:4px; background:#3b82f6;"></div>'
                          : ""
                      }
                      <div style="text-align:center; margin-bottom:12px;">
                          <div style="font-weight:700; color:#3b82f6; margin-bottom:4px;">LOKASI A</div>
                          <div style="font-size:2rem; font-weight:800; color:#1e293b; line-height:1;">${
                            resultA.score
                          }</div>
                          <div style="font-size:0.75rem; color:#64748b; font-weight:500;">SKOR POTENSI</div>
                      </div>
                      
                      <div style="border-top:1px solid #cbd5e1; padding-top:12px;">
                           <div style="font-size:0.75rem; color:#64748b; margin-bottom:2px;">Fasilitas Terdekat:</div>
                           <div style="font-size:0.85rem; font-weight:600; color:#334155; line-height:1.3; margin-bottom:4px;">${
                             resultA.nearestName
                           }</div>
                           <div style="font-size:0.8rem; color:#475569; display:flex; align-items:center; gap:4px;">
                                <i class="ph-bold ph-ruler"></i> ${
                                  resultA.nearestDist
                                } km
                           </div>
                      </div>
                  </div>

                  <!-- CARD B -->
                  <div style="background:#f8fafc; border-radius:12px; padding:16px; border:1px solid ${
                    resultB.score > resultA.score ? "#ef4444" : "#e2e8f0"
                  }; position:relative; overflow:hidden;">
                      ${
                        resultB.score > resultA.score
                          ? '<div style="position:absolute; top:0; left:0; right:0; height:4px; background:#ef4444;"></div>'
                          : ""
                      }
                      <div style="text-align:center; margin-bottom:12px;">
                          <div style="font-weight:700; color:#ef4444; margin-bottom:4px;">LOKASI B</div>
                          <div style="font-size:2rem; font-weight:800; color:#1e293b; line-height:1;">${
                            resultB.score
                          }</div>
                          <div style="font-size:0.75rem; color:#64748b; font-weight:500;">SKOR POTENSI</div>
                      </div>
                      
                      <div style="border-top:1px solid #cbd5e1; padding-top:12px;">
                           <div style="font-size:0.75rem; color:#64748b; margin-bottom:2px;">Fasilitas Terdekat:</div>
                           <div style="font-size:0.85rem; font-weight:600; color:#334155; line-height:1.3; margin-bottom:4px;">${
                             resultB.nearestName
                           }</div>
                           <div style="font-size:0.8rem; color:#475569; display:flex; align-items:center; gap:4px;">
                                <i class="ph-bold ph-ruler"></i> ${
                                  resultB.nearestDist
                                } km
                           </div>
                      </div>
                  </div>
              </div>

              <div class="highlight-box" style="margin-bottom:20px;">
                  <div style="display:flex; gap:10px;">
                      <i class="ph-fill ph-check-circle" style="color:var(--primary-color); font-size:1.2rem; margin-top:2px;"></i>
                      <div>
                          <div style="font-weight:600; color:#1e293b; margin-bottom:4px;">Rekomendasi Strategis</div>
                          <div class="highlight-desc" style="margin:0;">
                              Berdasarkan analisis aksesibilitas radius 500m, 
                              ${
                                resultA.score > resultB.score
                                  ? "<strong>Lokasi A</strong> lebih unggul karena memiliki kedekatan agregat yang lebih baik ke fasilitas layanan publik."
                                  : "<strong>Lokasi B</strong> lebih unggul karena memiliki kedekatan agregat yang lebih baik ke fasilitas layanan publik."
                              }
                          </div>
                      </div>
                  </div>
              </div>

              <button class="btn-action-full" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; background:#f1f5f9; color:#475569; border:none; border-radius:8px; font-weight:600; cursor:pointer; transition:all 0.2s;" onclick="AnalysisUtils.resetCompare()" onmouseover="this.style.background='#e2e8f0';" onmouseout="this.style.background='#f1f5f9';">
                  <i class="ph-bold ph-arrow-counter-clockwise"></i> Reset Perbandingan
              </button>
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
