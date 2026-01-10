Object.assign(AnalysisUtils, {
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

    let resultsHTML = `
        <div class="modern-result-card">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
                 <h4 style="margin:0;"><i class="ph-duotone ph-trophy" style="color:#eab308; margin-right: 8px;"></i> Top 5</h4>
            </div>
            <div style="display:flex; flex-direction:column; gap:16px;">`;

    const cardPromises = top5.map(async (fac, index) => {
      let reason = "";
      let density = "";
      const color = this.getFacilityColor(fac.name, fac.props);

      if (fac.type === "univ") {
        density = "Sangat Tinggi";
        reason = "Magnet ekonomi utama (kos-kosan, komersial, jasa).";
      } else if (fac.type === "health") {
        density = "Tinggi";
        reason = "Aktivitas vital 24 jam & layanan pendukung.";
      } else if (
        fac.name.toLowerCase().includes("sma") ||
        fac.name.toLowerCase().includes("smk")
      ) {
        density = "Tinggi";
        reason = "Zona pelajar aktif & transportasi.";
      } else if (fac.type === "school") {
        density = "Sedang - Tinggi";
        reason = "Zona jemputan & warung makan.";
      } else {
        density = "Sedang";
        reason = "Titik temu sosial warga lokal.";
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

      let imageHTML = "";
      if (fac.props.Foto) {
        imageHTML = `<div style="width: 50px; height: 50px; border-radius: 8px; overflow: hidden; flex-shrink: 0; border: 1px solid #e2e8f0;">
               <img src="${fac.props.Foto}" alt="${fac.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='https://placehold.co/100x100?text=No+Img'">
           </div>`;
      } else {
        imageHTML = `<div style="width: 50px; height: 50px; background: ${color}15; color: ${color}; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
               <i class="ph-bold ${
                 fac.type === "univ" || fac.type === "school"
                   ? "ph-student"
                   : fac.type === "health"
                   ? "ph-heart"
                   : "ph-building"
               }" style="font-size: 1.5rem;"></i>
           </div>`;
      }

      return `
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); transition: transform 0.2s; position: relative; overflow: hidden;" onmouseover="this.style.transform='translateY(-2px)';" onmouseout="this.style.transform='translateY(0)';" >
               <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 6px; background: ${color};"></div>
               <div style="display:flex; justify-content:space-between; align-items:start; margin-left: 12px; gap: 12px;">
                    ${imageHTML}
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                             <div style="font-weight: 700; font-size: 1rem; color: #1e293b; line-height: 1.2;">${
                               fac.name
                             }</div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #64748b; margin-bottom: 12px;">
                           <span>${fac.dist.toFixed(
                             2
                           )} km dari titik analisis</span>
                        </div>
                        <div style="background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #f1f5f9;">
                           <div style="font-size: 0.85rem; margin-bottom: 4px;">
                              <span style="font-weight: 600; color: #475569;">Potensi Hunian:</span> 
                              <span style="font-weight: 700; color: ${color};">${density}</span>
                           </div>
                           <div style="font-size: 0.85rem; color: #64748b; font-style: italic; line-height: 1.4;">"${reason}"</div>
                        </div>
                    </div>
               </div>
          </div>`;
    });

    const cardsHTML = await Promise.all(cardPromises);
    resultsHTML += cardsHTML.join("");
    resultsHTML += `</div></div>`;
    this.showResults(resultsHTML);
    UIUtils.hideLoading();
  },
});
