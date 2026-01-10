Object.assign(AnalysisUtils, {
  async findNearestFacility(point, latlng) {
    this.clearAnalysisLayers();
    if (this.state.nearestMethod === "road") UIUtils.showLoading();
    const userMarker = L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#333",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(this.state.analysisLayer);
    userMarker.bindPopup("Lokasi Anda").openPopup();
    const from = turf.point(point);
    let nearestCandidate = null;
    let minDist = Infinity;
    this.state.allFacilities.forEach((f) => {
      if (f.geometry.type === "Point") {
        const d = turf.distance(from, turf.point(f.geometry.coordinates));
        if (d < minDist) {
          minDist = d;
          nearestCandidate = f;
        }
      }
    });
    if (!nearestCandidate) {
      this.showResults("Tidak ada fasilitas.", "error");
      UIUtils.hideLoading();
      return;
    }
    const fLatLng = [
      nearestCandidate.geometry.coordinates[1],
      nearestCandidate.geometry.coordinates[0],
    ];
    const name = this.getRealFacilityName(nearestCandidate.properties);
    const color = this.getFacilityColor(name, nearestCandidate.properties);
    if (this.state.nearestMethod === "line") {
      L.polyline([latlng, fLatLng], {
        color: color,
        weight: 3,
        dashArray: "10, 10",
      }).addTo(this.state.analysisLayer);
      L.circleMarker(fLatLng, {
        radius: 10,
        fillColor: color,
        color: "#fff",
        fillOpacity: 1,
      }).addTo(this.state.analysisLayer);
      this.showResults(`
            <div class="modern-result-card">
                <h4><i class="ph-duotone ph-target" style="color:${color}"></i> Fasilitas Terdekat</h4>
                <div style="font-size:0.9em; color:#64748b; margin-bottom:16px;">Hasil analisis menggunakan metode Garis Lurus (Euclidean).</div>

                <div class="metric-grid" style="grid-template-columns: 1fr;">
                    <div class="metric-card">
                        <div class="metric-value" style="color:${color}">${minDist.toFixed(
        2
      )} <span style="font-size:0.5em; color:#64748b;">KM</span></div>
                        <div class="metric-label">Jarak Lurus</div>
                    </div>
                </div>

                <div class="highlight-box" style="margin-top:20px; border-left:4px solid ${color};">
                    <div class="highlight-title">${name}</div>
                    <div class="highlight-desc">Fasilitas terdekat yang ditemukan dari titik analisis.</div>
                </div>
            </div>
          `);
      this.map.fitBounds(L.latLngBounds([latlng, fLatLng]), {
        padding: [50, 50],
      });
      UIUtils.hideLoading();
    } else {
      try {
        const routeData = await RoutingService.getRoute(
          point,
          nearestCandidate.geometry.coordinates
        );
        const summary = routeData.features[0].properties.summary;
        const km = (summary.distance / 1000).toFixed(2);
        const minutes = Math.round((summary.duration * 3.0) / 60);
        let status =
          minutes <= 10 ? "Sangat Dekat" : minutes <= 30 ? "Menengah" : "Jauh";
        L.geoJSON(routeData, {
          style: { color: color, weight: 6, opacity: 0.8 },
        }).addTo(this.state.analysisLayer);
        L.circleMarker(fLatLng, {
          radius: 10,
          fillColor: color,
          color: "#fff",
          fillOpacity: 1,
        }).addTo(this.state.analysisLayer);
        this.showResults(`
                <div class="modern-result-card">
                    <h4><i class="ph-duotone ph-target" style="color:${color}"></i> Fasilitas Terdekat</h4>
                    <div style="font-size:0.9em; color:#64748b; margin-bottom:16px;">Hasil analisis rute berkendara.</div>

                    <div class="metric-grid">
                        <div class="metric-card">
                            <div class="metric-value" style="color:${color}">${minutes} <span style="font-size:0.5em; color:#64748b;">Mnt</span></div>
                            <div class="metric-label">Estimasi Waktu</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value">${km} <span style="font-size:0.5em; color:#64748b;">KM</span></div>
                            <div class="metric-label">Jarak Tempuh</div>
                        </div>
                    </div>

                    <div class="highlight-box" style="display:flex; align-items:center; gap:8px; margin-top:12px; background:${color}10; border-left:none; border-radius:8px;">
                        <i class="ph-fill ph-info" style="color:${color}"></i>
                        <span style="font-weight:600; color:${color}">${status}</span>
                    </div>

                    <div class="highlight-box" style="margin-top:12px; border-left:4px solid ${color};">
                        <div class="highlight-title">${name}</div>
                        <div class="highlight-desc">Rute tercepat via jalan raya.</div>
                    </div>
                </div>
            `);
        this.map.fitBounds(L.latLngBounds([latlng, fLatLng]), {
          padding: [50, 50],
        });
      } catch (e) {
        this.showResults("Gagal rute API", "error");
      } finally {
        UIUtils.hideLoading();
      }
    }
  },
});
