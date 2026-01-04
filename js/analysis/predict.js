Object.assign(AnalysisUtils, {
  async predictSettlementGrowth(point, latlng) {
    this.clearAnalysisLayers();
    this.state.predictionCache = {
      center: { lng: point[0], lat: point[1] },
      facilities: [],
      lines: [],
    };
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
          `<div class="result-item" style="border-left: 5px solid #666; background:#fff0f0;"><div class="result-details"><div class="result-name" style="color:#d32f2f;">⛔ Di Luar Jangkauan</div><div style="font-size:0.9em; margin-top:5px; color:#444;">Lokasi berada di luar <strong>Batas Kecamatan</strong>.</div></div></div>`,
          "error"
        );
        return;
      }
    }
    UIUtils.showLoading();
    const from = turf.point(point);
    const distances = this.state.allFacilities.map((f) => {
      const to = turf.point(f.geometry.coordinates);
      const props = f.properties;
      const name = this.getRealFacilityName(props);
      let icon = "🏫";
      if (
        name.toLowerCase().includes("rs") ||
        name.toLowerCase().includes("puskesmas")
      )
        icon = "🏥";
      else if (name.toLowerCase().includes("universitas")) icon = "🎓";
      return {
        dist: turf.distance(from, to, { units: "kilometers" }),
        name: name,
        icon: icon,
        coords: f.geometry.coordinates,
        props: props,
      };
    });
    distances.sort((a, b) => a.dist - b.dist);
    const relevantFacilities = distances
      .filter((d) => d.dist <= 0.3)
      .slice(0, 5);
    if (relevantFacilities.length === 0 && distances.length > 0)
      relevantFacilities.push(distances[0]);
    this.state.predictionCache.facilities = relevantFacilities;
    const nearest3 = distances.slice(0, 3);
    const avgDist =
      nearest3.reduce((sum, item) => sum + item.dist, 0) / nearest3.length;
    let prediction = {};
    let color = "";
    let facilityContext = "";
    const nearestTypes = nearest3.map((d) => d.name.toLowerCase());
    const hasUniv = nearestTypes.some(
      (n) => n.includes("universitas") || n.includes("stikes")
    );
    const hasHealth = nearestTypes.some(
      (n) => n.includes("rs") || n.includes("puskesmas")
    );
    const hasSchool = nearestTypes.some(
      (n) => n.includes("sd") || n.includes("smp")
    );
    if (hasUniv)
      facilityContext =
        "Keberadaan <strong>Perguruan Tinggi</strong> di dekat lokasi ini merupakan faktor utama pemicu kepadatan. Area ini sangat diminati oleh mahasiswa, sehingga berpotensi tinggi untuk pertumbuhan <strong>rumah kost, kontrakan, dan usaha kuliner murah</strong>.";
    else if (hasHealth)
      facilityContext =
        "Kedekatan dengan <strong>Fasilitas Kesehatan</strong> membuat lokasi ini strategis untuk tenaga medis dan keluarga pasien. Potensi pertumbuhan tinggi untuk <strong>apotek, penginapan, dan hunian sewa jangka pendek</strong>.";
    else if (hasSchool)
      facilityContext =
        "Dominasi fasilitas sekolah di area ini menjadikannya <strong>zona favorit bagi keluarga muda</strong>. Kebutuhan akan hunian dekat sekolah sangat tinggi untuk meminimalkan biaya transportasi anak dan usaha jajanan.";
    else
      facilityContext =
        "Aksesibilitas yang baik ke berbagai fasilitas umum menjadikan lokasi ini strategis untuk <strong>perumahan umum</strong>. Warga cenderung memilih lokasi ini karena kemudahan menjangkau layanan dasar.";

    if (avgDist < 0.5) {
      prediction = {
        probability: "Sangat Tinggi",
        years: "1 - 2 Tahun",
        reason: `Aksesibilitas sangat prima (< 500m). ${facilityContext}`,
      };
      color = "#dc3545";
    } else if (avgDist < 1.5) {
      prediction = {
        probability: "Sedang - Tinggi",
        years: "3 - 5 Tahun",
        reason: `Lokasi strategis dengan jarak menengah. ${facilityContext}`,
      };
      color = "#fd7e14";
    } else if (avgDist < 3.0) {
      prediction = {
        probability: "Rendah - Sedang",
        years: "5 - 10 Tahun",
        reason:
          "Aksesibilitas mulai menurun (> 1.5 km). Pertumbuhan cenderung lambat dan bergantung pada kepemilikan kendaraan pribadi. Lahan mungkin masih didominasi kebun campuran.",
      };
      color = "#ffc107";
    } else {
      prediction = {
        probability: "Rendah",
        years: "> 10 Tahun",
        reason:
          "Lokasi terisolir dari pusat layanan publik. Biaya transportasi tinggi membuat daya tarik hunian rendah. Cenderung tetap menjadi lahan hijau/pertanian.",
      };
      color = "#28a745";
    }

    let listHTML = `<ul style="list-style:none; padding:0; margin:0;">`;
    relevantFacilities.forEach((d) => {
      listHTML += `<li style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee; font-size:0.85em;"><span>${
        d.icon
      } ${
        d.name
      }</span><span style="font-weight:bold; color:#444;">${d.dist.toFixed(
        2
      )} km</span></li>`;
    });
    listHTML += `</ul>`;
    L.circleMarker(latlng, {
      radius: 8,
      fillColor: color,
      color: "#fff",
      fillOpacity: 1,
    })
      .addTo(this.state.analysisLayer)
      .bindPopup("Titik Prediksi");
    L.circle(latlng, {
      radius: 100,
      color: color,
      fillColor: color,
      fillOpacity: 0.2,
      dashArray: "5, 10",
    }).addTo(this.state.analysisLayer);
    this.showResults(
      `<div class="result-item" style="display:block; border-top: 5px solid ${color};"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><h4 style="margin:0; color:#333; font-size:15px;">Prediksi Pertumbuhan</h4><span style="background:${color}; color:white; padding:4px 10px; border-radius:12px; font-size:0.8em; font-weight:bold;">${prediction.years}</span></div><div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:12px;"><div style="font-size:0.9em; color:#666;">Potensi Pemukiman Baru:</div><div style="font-size:1.4em; font-weight:800; color:${color};">${prediction.probability}</div></div><div style="font-size:0.9em; line-height:1.6; color:#444; margin-bottom:15px; text-align:justify;"><strong>Analisis Aksesibilitas:</strong><br>${prediction.reason}</div><button onclick="AnalysisUtils.togglePredictionVisuals()" style="width:100%; background:#3388ff; color:white; border:none; padding:10px; border-radius:6px; font-weight:600; cursor:pointer;"><span>🔍 Cek Fasilitas Terdekat</span></button><div id="accessibility-details" style="display:none; margin-top:15px; background:#fff; border:1px solid #eee; border-radius:8px; padding:10px; max-height:250px; overflow-y:auto;"><div style="margin-bottom:8px; font-size:0.8em; color:#666; font-style:italic;">*Menampilkan fasilitas dalam radius 300 meter.</div>${listHTML}</div></div>`
    );
    UIUtils.hideLoading();
  },

  async togglePredictionVisuals() {
    const el = document.getElementById("accessibility-details");
    const isVisible = el && el.style.display !== "none";
    const cache = this.state.predictionCache;
    if (el) el.style.display = isVisible ? "none" : "block";
    if (isVisible) {
      if (cache.lines.length > 0)
        cache.lines.forEach((line) =>
          this.state.analysisLayer.removeLayer(line)
        );
    } else {
      if (cache.lines.length > 0) {
        cache.lines.forEach((line) => this.state.analysisLayer.addLayer(line));
      } else if (cache.facilities.length > 0) {
        if (this.state.predictionMethod === "line") {
          cache.facilities.forEach((fac) => {
            const lineColor = this.getFacilityColor(fac.name, fac.props);
            const lineLayer = L.polyline(
              [
                [cache.center.lat, cache.center.lng],
                [fac.coords[1], fac.coords[0]],
              ],
              { color: lineColor, weight: 2, opacity: 0.8, dashArray: "5, 5" }
            ).addTo(this.state.analysisLayer);
            cache.lines.push(lineLayer);
          });
        } else {
          UIUtils.showLoading();
          const routePromises = cache.facilities.map(async (fac) => {
            const lineColor = this.getFacilityColor(fac.name, fac.props);
            try {
              const routeData = await RoutingService.getRoute(
                [cache.center.lng, cache.center.lat],
                fac.coords,
                "driving-car"
              );
              return L.geoJSON(routeData, {
                style: {
                  color: lineColor,
                  weight: 4,
                  opacity: 0.8,
                  lineCap: "round",
                },
              }).addTo(this.state.analysisLayer);
            } catch (err) {
              return L.polyline(
                [
                  [cache.center.lat, cache.center.lng],
                  [fac.coords[1], fac.coords[0]],
                ],
                {
                  color: lineColor,
                  weight: 3,
                  opacity: 0.6,
                  dashArray: "5, 10",
                }
              ).addTo(this.state.analysisLayer);
            }
          });
          const newLines = await Promise.all(routePromises);
          cache.lines = newLines.filter((l) => l !== null);
          UIUtils.hideLoading();
        }
        if (cache.lines.length > 0) {
          const group = new L.featureGroup(cache.lines);
          this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
      }
    }
  },
});
