Object.assign(AnalysisUtils, {
  async gapAnalysis(point, latlng) {
    this.clearAnalysisLayers();
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
          `<div class="result-item" style="border-left: 5px solid #666; background:#fff0f0;"><div class="result-details"><div class="result-name" style="color:#d32f2f;">⛔ Di Luar Jangkauan</div><div style="font-size:0.9em; margin-top:5px; color:#444;">Analisis Gap hanya dapat dilakukan di dalam <strong>Batas Kecamatan</strong>.</div></div></div>`,
          "error"
        );
        return;
      }
    }
    UIUtils.showLoading();
    L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#ffc107",
      color: "#fff",
      fillOpacity: 1,
    })
      .addTo(this.state.analysisLayer)
      .bindPopup("Titik Gap Analysis")
      .openPopup();
    L.circle(latlng, {
      radius: 500,
      color: "#ff7800",
      dashArray: "10, 10",
      fillColor: "#ff7800",
      fillOpacity: 0.15,
    }).addTo(this.state.analysisLayer);
    const from = turf.point(point);
    const circleIdeal = turf.circle(from, 0.25, {
      steps: 64,
      units: "kilometers",
    });
    const circleStandard = turf.circle(from, 0.5, {
      steps: 64,
      units: "kilometers",
    });
    const facilityPoints = turf.featureCollection(
      this.state.allFacilities.map((f) => turf.point(f.geometry.coordinates))
    );
    const countIdeal = turf.pointsWithinPolygon(facilityPoints, circleIdeal)
      .features.length;
    const countStandard = turf.pointsWithinPolygon(
      facilityPoints,
      circleStandard
    ).features.length;

    let statusHeader = "";
    let headerColor = "";
    if (countStandard > 0) {
      statusHeader =
        "TERLAYANI<br><span style='font-size:0.7em; font-weight:normal;'>Akses Baik</span>";
      headerColor = "#28a745";
    } else {
      statusHeader =
        "TIDAK TERLAYANI<br><span style='font-size:0.7em; font-weight:normal;'>Kurang Terlayani</span>";
      headerColor = "#dc3545";
    }

    const facilitiesIn1KM = this.state.allFacilities.filter((f) => {
      const to = turf.point(f.geometry.coordinates);
      return turf.distance(from, to, { units: "kilometers" }) <= 0.5;
    });

    let typeCounts = {
      "Sekolah (SD/SMP/SMA)": 0,
      "Kesehatan (RS/Klinik)": 0,
      Universitas: 0,
      Lainnya: 0,
    };

    facilitiesIn1KM.forEach((f) => {
      const name = this.getRealFacilityName(f.properties).toLowerCase();
      if (
        name.includes("sd") ||
        name.includes("smp") ||
        name.includes("sma") ||
        name.includes("madrasah")
      ) {
        typeCounts["Sekolah (SD/SMP/SMA)"]++;
      } else if (
        name.includes("rs") ||
        name.includes("puskesmas") ||
        name.includes("klinik") ||
        name.includes("posyandu")
      ) {
        typeCounts["Kesehatan (RS/Klinik)"]++;
      } else if (name.includes("universitas") || name.includes("stikes")) {
        typeCounts["Universitas"]++;
      } else {
        typeCounts["Lainnya"]++;
      }
    });

    let distributionHTML = "";
    for (const [key, value] of Object.entries(typeCounts)) {
      if (value > 0) {
        distributionHTML += `
          <div class="facility-list-item">
            <span class="facility-name">${key}</span>
            <span class="facility-count">${value}</span>
          </div>`;
      }
    }

    if (distributionHTML === "") {
      distributionHTML = `<div style="font-size:0.85em; color:var(--text-secondary); font-style:italic; padding: 10px;">Tidak ada fasilitas dalam radius 500m.</div>`;
    }

    this.showResults(`
        <div class="modern-result-card">
            <div style="text-align:center; padding-bottom:16px; border-bottom:1px solid #f0f0f0; margin-bottom:16px;">
                 <h4 style="margin:0; font-size:1.1rem; color:#475569; margin-bottom:8px;">Status Layanan Wilayah</h4>
                 <div style="
                    display: inline-block; 
                    padding: 8px 16px; 
                    border-radius: 50px; 
                    background: ${headerColor}15; 
                    color: ${headerColor}; 
                    font-weight: 700; 
                    font-size: 1rem;
                    border: 1px solid ${headerColor}30;">
                    ${countStandard > 0 ? "✅ TERLAYANI" : "⚠️ TIDAK TERLAYANI"}
                 </div>
                 <div style="font-size:0.85em; color:#64748b; margin-top:6px;">
                    ${
                      countStandard > 0
                        ? "Area memiliki akses memadai ke fasilitas publik."
                        : "Area urgensi tinggi, minim akses fasilitas publik."
                    }
                 </div>
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px;">
                <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:12px; text-align:center;">
                    <div style="font-size:1.8rem; font-weight:800; color:#16a34a; line-height:1;">${countIdeal}</div>
                    <div style="font-size:0.75rem; color:#15803d; font-weight:600; margin-top:4px;">ZONA IDEAL</div>
                    <div style="font-size:0.7rem; color:#4ade80;">Radius < 250m</div>
                </div>
                <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:12px; padding:12px; text-align:center;">
                    <div style="font-size:1.8rem; font-weight:800; color:#d97706; line-height:1;">${countStandard}</div>
                    <div style="font-size:0.75rem; color:#b45309; font-weight:600; margin-top:4px;">ZONA STANDAR</div>
                    <div style="font-size:0.7rem; color:#fcd34d;">Radius < 500m</div>
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="font-size:0.9rem; font-weight:700; color:#334155;">Distribusi Fasilitas</div>
                    <div style="font-size:0.75rem; color:#94a3b8; background:#f1f5f9; padding:2px 8px; border-radius:12px;">Radius 500m</div>
                </div>
                
                <div style="background:#f8fafc; border-radius:12px; padding:4px; border:1px solid #e2e8f0;">
                    ${
                      distributionHTML !== ""
                        ? `<div style="display:flex; flex-direction:column; gap:1px;">
                            ${Object.entries(typeCounts)
                              .filter(([_, val]) => val > 0)
                              .map(
                                ([key, val]) => `
                                <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:white; border-radius:8px; margin-bottom:2px;">
                                    <div style="display:flex; align-items:center; gap:8px;">
                                        <div style="width:6px; height:6px; border-radius:50%; background:#64748b;"></div>
                                        <span style="font-size:0.85rem; color:#475569; font-weight:500;">${key}</span>
                                    </div>
                                    <span style="font-weight:700; color:#1e293b; background:#f1f5f9; padding:2px 8px; border-radius:6px; font-size:0.85rem;">${val}</span>
                                </div>`
                              )
                              .join("")}
                           </div>`
                        : `<div style="text-align:center; padding:20px; color:#94a3b8; font-size:0.9rem;">
                              <i class="ph-duotone ph-warning-circle" style="font-size:1.5rem; margin-bottom:4px;"></i><br>
                              Tidak ada fasilitas ditemukan
                           </div>`
                    }
                </div>
            </div>

            <div class="highlight-box" style="background:#eff6ff; border-left:4px solid #3b82f6;">
                <div class="highlight-title" style="color:#1d4ed8;"><i class="ph-fill ph-info"></i> Rekomendasi</div>
                <div class="highlight-desc" style="color:#1e40af;">
                    ${
                      countStandard < 2
                        ? "Kawasan ini <strong>High Priority</strong> untuk intervensi pembangunan. Disarankan penambahan fasilitas dasar (Klinik/Posyandu) untuk meningkatkan skor aksesibilitas."
                        : "Kawasan ini memiliki aksesibilitas dasar. Fokus selanjutnya adalah peningkatan kualitas layanan atau diversifikasi jenis fasilitas."
                    }
                </div>
            </div>
        </div>`);
    UIUtils.hideLoading();
  },
});
