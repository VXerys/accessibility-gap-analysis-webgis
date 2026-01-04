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
      radius: 1000,
      color: "#ff7800",
      dashArray: "10, 10",
      fillColor: "#ff7800",
      fillOpacity: 0.15,
    }).addTo(this.state.analysisLayer);
    const from = turf.point(point);
    const circleIdeal = turf.circle(from, 0.5, {
      steps: 64,
      units: "kilometers",
    });
    const circleStandard = turf.circle(from, 1.0, {
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
        "WELL SERVED<br><span style='font-size:0.7em; font-weight:normal;'>Akses Baik</span>";
      headerColor = "#28a745";
    } else {
      statusHeader =
        "UNDERSERVED<br><span style='font-size:0.7em; font-weight:normal;'>Kurang Terlayani</span>";
      headerColor = "#dc3545";
    }

    const facilitiesIn1KM = this.state.allFacilities.filter((f) => {
      const to = turf.point(f.geometry.coordinates);
      return turf.distance(from, to, { units: "kilometers" }) <= 1.0;
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
        distributionHTML += `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.85em; border-bottom:1px solid #eee; padding-bottom:3px;"><span style="color:#555;">${key}</span><span style="font-weight:bold; color:#333;">${value}</span></div>`;
      }
    }

    if (distributionHTML === "") {
      distributionHTML = `<div style="font-size:0.85em; color:#888; font-style:italic;">Tidak ada fasilitas dalam radius 1 km.</div>`;
    }

    this.showResults(`
        <div class="result-item" style="padding:0; border:none; box-shadow:none;">
            <div style="background:${headerColor}; color:white; padding:15px; border-radius:8px; text-align:center; font-weight:700; font-size:1.1em; box-shadow:0 4px 6px rgba(0,0,0,0.1);">${statusHeader}</div>
            <div style="margin-top:15px; padding:0 10px;">
                <div style="margin-bottom:8px; font-size:0.9em; color:#444;">Zona Ideal (< 500m): <strong style="float:right;">${countIdeal} fasilitas</strong></div>
                <div style="width:100%; background:#eee; height:6px; border-radius:3px; margin-bottom:12px;"><div style="width:${Math.min(
                  (countIdeal / 10) * 100,
                  100
                )}%; background:#28a745; height:100%; border-radius:3px;"></div></div>
                <div style="margin-bottom:8px; font-size:0.9em; color:#444;">Zona Standar (< 1km): <strong style="float:right;">${countStandard} fasilitas</strong></div>
                <div style="width:100%; background:#eee; height:6px; border-radius:3px; margin-bottom:20px;"><div style="width:${Math.min(
                  (countStandard / 10) * 100,
                  100
                )}%; background:#ffc107; height:100%; border-radius:3px;"></div></div>
                <div style="background:#f9f9f9; padding:12px; border-radius:8px; border:1px solid #eee;">
                    <h5 style="margin:0 0 10px 0; color:#2c3e50; font-size:0.9em;">Distribusi Tipe Fasilitas (1 KM):</h5>
                    ${distributionHTML}
                </div>
            </div>
        </div>`);
    UIUtils.hideLoading();
  },
});
