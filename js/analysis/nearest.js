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
            <div class="result-item" style="border-left: 5px solid ${color}; padding: 15px;">
                <div style="font-size:0.85em; color:#666; margin-bottom:5px;">Fasilitas Terdekat</div>
                <div style="font-size:1.8em; font-weight:800; color:${color}; line-height:1.2;">${minDist.toFixed(
        2
      )} KM</div>
                <div style="font-size:0.9em; color:#444; margin-bottom:8px;">Mode: <strong>Garis Lurus</strong></div>
                <div style="margin-top:12px; padding-top:10px; border-top:1px solid #eee; font-size:0.9em; color:#2c3e50; font-weight:600;">${name}</div>
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
                <div class="result-item" style="border-left: 5px solid ${color}; padding: 15px;">
                    <div style="font-size:0.85em; color:#666; margin-bottom:5px;">Fasilitas Terdekat</div>
                    <div style="font-size:1.8em; font-weight:800; color:${color}; line-height:1.2;">${minutes} Menit</div>
                    <div style="font-size:0.9em; color:#444; margin-bottom:8px;">Jarak: <strong>${km} km</strong></div>
                    <div style="display:flex; align-items:center; gap:6px; font-size:0.9em; font-weight:600; color:#333;"><span style="color:${color}; font-size:1.2em;">☑</span> ${status}</div>
                    <div style="margin-top:12px; padding-top:10px; border-top:1px solid #eee; font-size:0.95em; color:#2c3e50; font-weight:bold;">${name}</div>
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

  async findTop5Hotspots(point, latlng) {
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
          `<div class="result-item" style="border-left: 5px solid #666; background:#fff0f0;"><div class="result-details"><div class="result-name" style="color:#d32f2f;">⛔ Di Luar Jangkauan</div><div style="font-size:0.9em; margin-top:5px; color:#444;">Analisis Top 5 hanya berlaku di dalam <strong>Batas Kecamatan</strong>.</div></div></div>`,
          "error"
        );
        return;
      }
    }
    UIUtils.showLoading();
    const userMarker = L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#333",
      color: "#fff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(this.state.analysisLayer);
    userMarker.bindPopup("Titik Analisis").openPopup();
    const from = turf.point(point);
    const candidates = this.state.allFacilities.map((f) => {
      const to = turf.point(f.geometry.coordinates);
      const dist = turf.distance(from, to, { units: "kilometers" });
      const props = f.properties;
      const name = this.getRealFacilityName(props);
      let type = "general";
      const nLower = name.toLowerCase();
      if (
        nLower.includes("sd") ||
        nLower.includes("smp") ||
        nLower.includes("sma")
      )
        type = "school";
      else if (
        nLower.includes("rs") ||
        nLower.includes("puskesmas") ||
        nLower.includes("klinik")
      )
        type = "health";
      else if (nLower.includes("universitas")) type = "univ";
      return { dist, name, type, coords: f.geometry.coordinates, props: props };
    });
    candidates.sort((a, b) => a.dist - b.dist);
    const top5 = candidates.slice(0, 5);
    if (top5.length === 0) {
      this.showResults("Tidak ada fasilitas ditemukan.", "error");
      UIUtils.hideLoading();
      return;
    }
    let resultsHTML = `<div class="result-item" style="border-bottom:none; box-shadow:none; padding-bottom:0; background:transparent;"><h4 style="margin:0 0 10px 0; color:#2c3e50;">🏆 Top 5 Potensi Kepadatan</h4><p style="font-size:0.85em; color:#666;">Analisis potensi kepadatan hunian berdasarkan daya tarik fasilitas terdekat.</p></div>`;
    const routePromises = top5.map(async (fac, index) => {
      let reason = "";
      let density = "";
      const color = this.getFacilityColor(fac.name, fac.props);
      if (fac.type === "univ") {
        density = "Sangat Tinggi";
        reason =
          "Kawasan pendidikan tinggi memicu pertumbuhan kos-kosan dan komersial.";
      } else if (fac.type === "health") {
        density = "Tinggi";
        reason = "Fasilitas kesehatan vital menarik aktivitas ekonomi 24 jam.";
      } else if (fac.type === "school") {
        density = "Sedang - Tinggi";
        reason =
          "Magnet bagi keluarga muda, menumbuhkan jajanan dan layanan jemputan.";
      } else {
        density = "Sedang";
        reason = "Titik temu warga, berpotensi menumbuhkan warung kelontong.";
      }
      const rank = index + 1;
      try {
        const routeData = await RoutingService.getRoute(
          point,
          fac.coords,
          "driving-car"
        );
        L.geoJSON(routeData, {
          style: { color: color, weight: 4, opacity: 0.7, lineCap: "round" },
        }).addTo(this.state.analysisLayer);
      } catch (e) {
        L.polyline(
          [
            [latlng.lat, latlng.lng],
            [fac.coords[1], fac.coords[0]],
          ],
          { color: color, weight: 2, dashArray: "5,5" }
        ).addTo(this.state.analysisLayer);
      }
      L.circleMarker([fac.coords[1], fac.coords[0]], {
        radius: 12,
        fillColor: color,
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      })
        .addTo(this.state.analysisLayer)
        .bindPopup(`<b>#${rank} ${fac.name}</b><br>Potensi: ${density}`);
      resultsHTML += `<div class="result-item" style="border-left: 5px solid ${color}; position:relative; overflow:hidden;"><div style="position:absolute; right:-10px; top:-10px; background:${color}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2em; opacity:0.2;">#${rank}</div><div style="font-weight:bold; color:#333; font-size:1.1em; margin-bottom:4px;">${
        fac.name
      }</div><div style="font-size:0.85em; color:#666; margin-bottom:8px;">Jarak: <strong>${fac.dist.toFixed(
        2
      )} km</strong></div><div style="background:#f8f9fa; padding:8px; border-radius:6px; margin-bottom:6px;"><div style="font-size:0.75em; text-transform:uppercase; color:#888; font-weight:600;">Potensi Kepadatan</div><div style="font-weight:bold; color:${color}; font-size:1em;">${density}</div></div><div style="font-size:0.85em; color:#555; line-height:1.4; border-top:1px solid #eee; padding-top:6px;">💡 ${reason}</div></div>`;
    });
    await Promise.all(routePromises);
    this.showResults(resultsHTML);
    UIUtils.hideLoading();
  },
});
