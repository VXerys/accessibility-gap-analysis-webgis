/**
 * Analysis Utilities Module
 * Handles spatial analysis operations using Turf.js and RoutingService
 */

const AnalysisUtils = {
  state: {
    currentMode: null,
    analysisLayer: null,
    markers: [],
    lastClickPoint: null,
    allFacilities: [],
    districtBoundary: null,
    isochroneData: null,
    isochroneRanges: [],
    activeIsochroneFilter: null,
    currentIsochroneLayer: null,
    measureMethod: "road",
    nearestMethod: "road",
    predictionMethod: "road",
    predictionCache: { center: null, facilities: [], lines: [] },
  },

  init(map) {
    if (!map) return;
    this.map = map;
    this.state.analysisLayer = L.layerGroup().addTo(map);
    try {
      this.setupEventListeners();
    } catch (e) {
      console.error(e);
    }
    this.setupMapClickHandler();
  },

  setDistrictBoundary(feature) {
    this.state.districtBoundary = feature;
  },

  setupEventListeners() {
    const toggleBtn = document.getElementById("analysis-toggle");
    const panel = document.getElementById("analysis-panel");
    const closeBtn = document.getElementById("analysis-close");
    const clearBtn = document.getElementById("clear-analysis");
    const modeButtons = document.querySelectorAll(".analysis-mode-btn");

    // Kita hanya menggeser MAP, tidak Footer
    const mapWrapper = document.querySelector(".map-wrapper");

    if (!toggleBtn || !panel) return;

    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      panel.classList.remove("has-results");
      panel.classList.toggle("active");

      // Geser Peta Saja (Agar tidak tertutup sidebar)
      if (mapWrapper && window.innerWidth > 768) {
        const isActive = panel.classList.contains("active");
        mapWrapper.classList.toggle("sidebar-open", isActive);
        // Refresh ukuran peta
        setTimeout(() => {
          this.map.invalidateSize();
        }, 405);
      }
    });

    if (closeBtn)
      closeBtn.addEventListener("click", () => {
        panel.classList.remove("active");
        // Kembalikan posisi peta
        if (mapWrapper) {
          mapWrapper.classList.remove("sidebar-open");
          setTimeout(() => {
            this.map.invalidateSize();
          }, 405);
        }
      });

    if (clearBtn)
      clearBtn.addEventListener("click", () => this.clearAnalysis());

    modeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = e.currentTarget.dataset.mode;
        this.setMode(mode);
        modeButtons.forEach((b) => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
      });
    });
  },

  setMode(mode) {
    this.state.currentMode = mode;
    this.state.lastClickPoint = null;
    this.state.isochroneData = null;
    this.state.currentIsochroneLayer = null;
    this.state.activeIsochroneFilter = null;
    this.state.predictionCache = { center: null, facilities: [], lines: [] };

    if (mode === "distance") this.state.measureMethod = "road";
    if (mode === "nearest") this.state.nearestMethod = "road";
    if (mode === "prediction") this.state.predictionMethod = "road";

    const infoDiv = document.getElementById("analysis-info");
    const panel = document.getElementById("analysis-panel");

    let htmlContent = "";
    const btnStyle =
      "cursor:pointer; padding:8px 12px; border-radius:6px; font-size:0.85em; font-weight:600; border:1px solid #ccc; background:#fff; flex:1; text-align:center; transition:all 0.2s;";
    const activeStyle =
      "background:#6f42c1; color:white; border-color:#6f42c1;";

    if (mode === "distance") {
      htmlContent = `
            <p class="info-instruction" style="margin-bottom:10px;">Pilih metode pengukuran:</p>
            <div style="display:flex; gap:10px; margin-bottom:12px;">
                <button id="btn-dist-line" onclick="AnalysisUtils.setMeasureMethod('line')" style="${btnStyle}">📏 Garis Lurus</button>
                <button id="btn-dist-road" onclick="AnalysisUtils.setMeasureMethod('road')" style="${btnStyle} ${activeStyle}">🚗 Ikuti Jalan (API)</button>
            </div>
            <p class="info-instruction" style="font-size:0.85em; color:#666;"><span id="dist-desc">Klik Titik A lalu Titik B untuk mengukur rute.</span></p>
        `;
      if (panel) panel.classList.add("active");
    } else if (mode === "nearest") {
      htmlContent = `
            <p class="info-instruction" style="margin-bottom:10px;">Pilih metode pencarian:</p>
            <div style="display:flex; gap:10px; margin-bottom:12px;">
                <button id="btn-near-line" onclick="AnalysisUtils.setNearestMethod('line')" style="${btnStyle}">📏 Garis Lurus</button>
                <button id="btn-near-road" onclick="AnalysisUtils.setNearestMethod('road')" style="${btnStyle} ${activeStyle}">🚗 Ikuti Jalan (API)</button>
            </div>
            <p class="info-instruction" style="font-size:0.85em; color:#666;"><span id="near-desc">Klik peta untuk mencari fasilitas terdekat.</span></p>
        `;
      if (panel) panel.classList.add("active");
    } else if (mode === "prediction") {
      htmlContent = `
            <p class="info-instruction" style="margin-bottom:10px;">Metode Prediksi:</p>
            <div style="display:flex; gap:10px; margin-bottom:12px;">
                <button id="btn-pred-line" onclick="AnalysisUtils.setPredictionMethod('line')" style="${btnStyle}">📏 Garis Lurus</button>
                <button id="btn-pred-road" onclick="AnalysisUtils.setPredictionMethod('road')" style="${btnStyle} ${activeStyle}">🚗 Ikuti Jalan (API)</button>
            </div>
            <p class="info-instruction" style="font-size:0.85em; color:#666;"><span id="pred-desc">Klik area dalam batas kecamatan untuk prediksi pemukiman.</span></p>
        `;
      if (panel) panel.classList.add("active");
    } else {
      const instructions = {
        isochrone: "🕐 Klik peta untuk melihat area jangkauan waktu.",
        buffer:
          "⭕ KHUSUS MARKER: Klik ikon Sekolah/RS untuk melihat Service Area.",
        topN: "🏆 Klik peta untuk 5 fasilitas terdekat.",
        gap: "⚠️ Klik peta untuk analisis gap.",
        compare: "⚖️ Klik dua lokasi untuk membandingkan.",
      };
      htmlContent = `<p class="info-instruction">${
        instructions[mode] || "Pilih mode."
      }</p>`;

      if (panel) panel.classList.remove("active");
      const mapWrapper = document.querySelector(".map-wrapper");
      if (mapWrapper) mapWrapper.classList.remove("sidebar-open");
    }

    if (infoDiv) infoDiv.innerHTML = htmlContent;
    this.clearAnalysisLayers();
  },

  setMeasureMethod(method) {
    this.state.measureMethod = method;
    this.updateMethodUI(
      "btn-dist",
      method,
      "Titik A lalu Titik B",
      "mengukur rute"
    );
    this.clearAnalysisLayers();
    this.state.lastClickPoint = null;
  },
  setNearestMethod(method) {
    this.state.nearestMethod = method;
    this.updateMethodUI(
      "btn-near",
      method,
      "peta",
      "mencari fasilitas terdekat"
    );
  },
  setPredictionMethod(method) {
    this.state.predictionMethod = method;
    this.updateMethodUI(
      "btn-pred",
      method,
      "area dalam batas",
      "prediksi pemukiman"
    );
  },

  updateMethodUI(prefix, method, clickTarget, action) {
    const btnLine = document.getElementById(`${prefix}-line`);
    const btnRoad = document.getElementById(`${prefix}-road`);
    const desc = document.getElementById(`${prefix}-desc`);
    const activeStyle =
      "background:#6f42c1; color:white; border-color:#6f42c1;";
    const inactiveStyle = "background:#fff; color:#333; border-color:#ccc;";

    if (method === "line") {
      if (btnLine) btnLine.style.cssText += activeStyle;
      if (btnRoad) btnRoad.style.cssText += inactiveStyle;
      if (desc)
        desc.innerText = `Klik ${clickTarget} untuk ${action} (Garis Lurus).`;
    } else {
      if (btnLine) btnLine.style.cssText += inactiveStyle;
      if (btnRoad) btnRoad.style.cssText += activeStyle;
      if (desc)
        desc.innerText = `Klik ${clickTarget} untuk ${action} (Jalan Raya/API).`;
    }
  },

  setupMapClickHandler() {
    this.map.on("click", (e) => {
      if (this.state.currentMode === "buffer") return;
      this.handleInteraction(e.latlng);
    });

    this.map.on("popupopen", (e) => {
      if (!this.state.currentMode) return;
      const sourceMarker = e.popup._source;
      if (this.state.analysisLayer.hasLayer(sourceMarker)) return;

      if (
        [
          "distance",
          "nearest",
          "isochrone",
          "buffer",
          "topN",
          "gap",
          "compare",
          "prediction",
        ].includes(this.state.currentMode)
      ) {
        e.popup.removeFrom(this.map);
        if (sourceMarker && sourceMarker.getLatLng) {
          setTimeout(() => {
            this.handleInteraction(sourceMarker.getLatLng());
          }, 10);
        }
      }
    });
  },

  handleInteraction(latlng) {
    if (!this.state.currentMode) return;
    const panel = document.getElementById("analysis-panel");
    const mapWrapper = document.querySelector(".map-wrapper");

    // Tutup panel jika bukan mode pemilihan
    if (
      !["distance", "nearest", "prediction"].includes(this.state.currentMode)
    ) {
      if (panel) panel.classList.remove("active");
      if (mapWrapper) mapWrapper.classList.remove("sidebar-open");
    }

    const point = [latlng.lng, latlng.lat];

    switch (this.state.currentMode) {
      case "nearest":
        this.findNearestFacility(point, latlng);
        break;
      case "isochrone":
        this.runIsochroneLogic(point, latlng, "time");
        break;
      case "buffer":
        this.runIsochroneLogic(point, latlng, "distance");
        break;
      case "distance":
        this.measureDistance(point, latlng);
        break;
      case "topN":
        this.findTopNearestFacilities(point, latlng);
        break;
      case "gap":
        this.gapAnalysis(point, latlng);
        break;
      case "compare":
        this.compareAccessibility(point, latlng);
        break;
      case "prediction":
        this.predictSettlementGrowth(point, latlng);
        break;
    }
  },

  storeFacilities(facilities) {
    this.state.allFacilities = facilities;
  },

  // --- PREDIKSI (Radius 300m, Dual Mode, Warna Warni) ---
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
      const name =
        props.nama || props.SDN || props.RS || props.KETERANGAN || "Fasilitas";
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

    if (avgDist < 0.5) {
      prediction = {
        probability: "Sangat Tinggi",
        years: "1 - 2 Tahun",
        reason:
          "Aksesibilitas prima (< 500m ke fasilitas). Potensial pemadatan pemukiman.",
      };
      color = "#dc3545";
    } else if (avgDist < 1.5) {
      prediction = {
        probability: "Sedang - Tinggi",
        years: "3 - 5 Tahun",
        reason:
          "Lokasi strategis untuk perumahan klaster. Terjangkau dari pusat layanan.",
      };
      color = "#fd7e14";
    } else if (avgDist < 3.0) {
      prediction = {
        probability: "Rendah - Sedang",
        years: "5 - 10 Tahun",
        reason:
          "Aksesibilitas menurun. Pertumbuhan lambat, butuh kendaraan pribadi.",
      };
      color = "#ffc107";
    } else {
      prediction = {
        probability: "Rendah",
        years: "> 10 Tahun",
        reason:
          "Terisolir dari layanan publik. Cenderung tetap menjadi lahan hijau.",
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

    this.showResults(`
          <div class="result-item" style="display:block; border-top: 5px solid ${color};">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <h4 style="margin:0; color:#333; font-size:15px;">Prediksi Pertumbuhan</h4>
                  <span style="background:${color}; color:white; padding:4px 10px; border-radius:12px; font-size:0.8em; font-weight:bold;">${prediction.years}</span>
              </div>
              <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:12px;">
                  <div style="font-size:0.9em; color:#666;">Potensi Pemukiman Baru:</div>
                  <div style="font-size:1.4em; font-weight:800; color:${color};">${prediction.probability}</div>
              </div>
              <div style="font-size:0.9em; line-height:1.6; color:#444; margin-bottom:15px; text-align:justify;"><strong>Analisis Aksesibilitas:</strong><br>${prediction.reason}</div>
              <button onclick="AnalysisUtils.togglePredictionVisuals()" style="width:100%; background:#3388ff; color:white; border:none; padding:10px; border-radius:6px; font-weight:600; cursor:pointer;"><span>🔍 Cek Fasilitas Terdekat</span></button>
              <div id="accessibility-details" style="display:none; margin-top:15px; background:#fff; border:1px solid #eee; border-radius:8px; padding:10px; max-height:250px; overflow-y:auto;">
                  <div style="margin-bottom:8px; font-size:0.8em; color:#666; font-style:italic;">*Menampilkan fasilitas dalam radius 300 meter.</div>${listHTML}
              </div>
          </div>
      `);
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
              const lineLayer = L.geoJSON(routeData, {
                style: {
                  color: lineColor,
                  weight: 4,
                  opacity: 0.8,
                  lineCap: "round",
                },
              }).addTo(this.state.analysisLayer);
              return lineLayer;
            } catch (err) {
              const lineLayer = L.polyline(
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
              return lineLayer;
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

  getFacilityColor(name, props) {
    let lineColor = "#888";
    const p = props || {};
    const n = name.toLowerCase();
    if (p.RS || n.includes("rs ")) lineColor = "#e74c3c";
    else if (p.Puskesmas || n.includes("puskesmas")) lineColor = "#3498db";
    else if (p.Klinik || n.includes("klinik")) lineColor = "#2ecc71";
    else if (p.Posyandu || n.includes("posyandu")) lineColor = "#f39c12";
    else if (p.SDN || n.includes("sd ")) lineColor = "#0066cc";
    else if (p.SMPN || n.includes("smp")) lineColor = "#28a745";
    else if (p.SMAN || n.includes("sma")) lineColor = "#dc3545";
    else if (p.Universitas || n.includes("universitas")) lineColor = "#6f42c1";
    else if (p.Madrasah || n.includes("madrasah")) lineColor = "#fd7e14";
    return lineColor;
  },

  // --- UKUR JARAK & TERDEKAT ---
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
        this.showResults(
          `<div class="result-item" style="border-left: 6px solid #3388ff"><div class="result-icon" style="background:#e3f2fd; color:#0066cc;">📏</div><div class="result-details"><div class="result-name">Jarak Garis Lurus</div><div class="result-distance" style="font-size: 1.6em; color: #333; font-weight:800;">${straightDist.toFixed(
            2
          )} <span style="font-size:0.6em; color:#666">km</span></div><div style="margin-top:8px; display:flex; gap:10px; font-size:0.8em;"><span style="color:#3388ff;">● Awal (Biru)</span><span style="color:#333;">⇢</span><span style="color:#dc3545;">● Akhir (Merah)</span></div></div></div>`
        );
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
          this.showResults(
            `<div class="result-item"><div class="result-icon" style="background:#e3f2fd; color:#0066cc;">📏</div><div class="result-details"><div class="result-name">Pengukuran Rute Jalan</div><div class="result-distance" style="font-size: 1.6em; color: #333; font-weight:800;">${distanceKm} <span style="font-size:0.6em; color:#666">km</span></div><div style="margin-top:8px; display:flex; gap:10px; font-size:0.8em;"><span style="color:#3388ff;">● Awal (Biru)</span><span style="color:#333;">⇢</span><span style="color:#dc3545;">● Akhir (Merah)</span></div></div></div>`
          );
        } catch (error) {
          this.showResults("Gagal rute API", "error");
        } finally {
          this.state.lastClickPoint = null;
          UIUtils.hideLoading();
        }
      }
    }
  },

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
    const name = nearestCandidate.properties.nama || "Fasilitas";
    if (this.state.nearestMethod === "line") {
      L.polyline([latlng, fLatLng], {
        color: "#ff7800",
        weight: 3,
        dashArray: "10, 10",
      }).addTo(this.state.analysisLayer);
      L.circleMarker(fLatLng, {
        radius: 10,
        fillColor: "#ff7800",
        color: "#fff",
        fillOpacity: 1,
      }).addTo(this.state.analysisLayer);
      this.showResults(
        `<div class="result-item" style="border-left: 6px solid #ff7800"><div class="result-details"><div class="result-name">${name}</div><div class="result-distance">${minDist.toFixed(
          2
        )} km</div><div class="result-info" style="margin-top:5px; font-size:0.85em; color:#666;">Jarak Garis Lurus (Euclidean)</div></div></div>`
      );
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
        const minutes = Math.round((summary.duration * 1.8) / 60);
        const color = RoutingService.getTimeColor(summary.duration * 1.8);
        let status =
          minutes <= 10
            ? "✅ Sangat Dekat"
            : minutes <= 30
            ? "⚠️ Menengah"
            : "⛔ Jauh";
        L.geoJSON(routeData, {
          style: { color: color, weight: 6, opacity: 0.8 },
        }).addTo(this.state.analysisLayer);
        L.circleMarker(fLatLng, {
          radius: 10,
          fillColor: color,
          color: "#fff",
          fillOpacity: 1,
        }).addTo(this.state.analysisLayer);
        this.showResults(
          `<div class="result-item" style="border-left: 6px solid ${color}"><div class="result-details"><div class="result-name">${name}</div><div class="result-distance" style="color:${color}; font-weight:bold; font-size:1.3em;">${minutes} Menit</div><div class="result-time">Jarak: ${km} km</div><div class="result-info" style="margin-top:5px;">${status}</div></div></div>`
        );
        this.map.fitBounds(L.latLngBounds([latlng, fLatLng]), {
          padding: [50, 50],
        });
      } catch (e) {
        console.error(e);
        this.showResults("Gagal rute API.", "error");
      } finally {
        UIUtils.hideLoading();
      }
    }
  },

  async runIsochroneLogic(point, latlng, type) {
    this.clearAnalysisLayers();
    this.state.currentIsochroneLayer = null;
    UIUtils.showLoading();
    const centerMarker = L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#6f42c1",
      color: "#fff",
      fillOpacity: 1,
    }).addTo(this.state.analysisLayer);
    try {
      let ranges, labels, sublabels, title;
      if (type === "time") {
        title = "Analisis Jangkauan Waktu";
        const tf = 1.5;
        ranges = [
          Math.round(600 / tf),
          Math.round(1200 / tf),
          Math.round(1800 / tf),
        ];
        labels = ["0 - 10 Mnt", "10 - 20 Mnt", "20 - 30 Mnt"];
        sublabels = ["Sangat Dekat", "Dekat", "Jauh"];
      } else {
        title = "Service Area (Jarak)";
        ranges = [500, 1000, 1500];
        labels = ["0 - 0.5 KM", "0.5 - 1 KM", "1 - 1.5 KM"];
        sublabels = ["Jalan Kaki", "Menengah", "Kendaraan"];
      }
      const data = await RoutingService.getIsochrones(
        point,
        "driving-car",
        ranges,
        type
      );
      data.features.sort((a, b) => a.properties.value - b.properties.value);
      const processedFeatures = [];
      if (data.features[0]) {
        data.features[0].properties.rangeType = "green";
        processedFeatures.push(data.features[0]);
      }
      if (data.features[1]) {
        try {
          const diff = turf.difference(data.features[1], data.features[0]);
          if (diff) {
            diff.properties = {
              ...data.features[1].properties,
              rangeType: "yellow",
            };
            processedFeatures.push(diff);
          }
        } catch (e) {}
      }
      if (data.features[2]) {
        try {
          const diff = turf.difference(data.features[2], data.features[1]);
          if (diff) {
            diff.properties = {
              ...data.features[2].properties,
              rangeType: "red",
            };
            processedFeatures.push(diff);
          }
        } catch (e) {}
      }
      this.state.isochroneData = {
        type: "FeatureCollection",
        features: processedFeatures,
      };
      this.state.isochroneRanges = ranges;
      this.state.activeIsochroneFilter = null;
      this.renderIsochroneLayer("all");
      const btnStyle =
        "cursor:pointer; padding:10px 5px; border-radius:8px; text-align:center; font-weight:bold; transition:all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); border: 3px solid transparent; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;";
      this.showResults(`
            <div class="isochrone-results"><h4 style="margin-bottom:15px;">${title}</h4><div style="display:flex; gap:8px; justify-content: space-between;"><div id="btn-iso-green" onclick="AnalysisUtils.filterIsochrone('green')" style="${btnStyle} background-color:#28a745; color:white;"><div style="font-size:0.9em;">${labels[0]}</div><div style="font-size:0.65em; font-weight:normal;">${sublabels[0]}</div></div><div id="btn-iso-yellow" onclick="AnalysisUtils.filterIsochrone('yellow')" style="${btnStyle} background-color:#ffc107; color:#333;"><div style="font-size:0.9em;">${labels[1]}</div><div style="font-size:0.65em; font-weight:normal;">${sublabels[1]}</div></div><div id="btn-iso-red" onclick="AnalysisUtils.filterIsochrone('red')" style="${btnStyle} background-color:#dc3545; color:white;"><div style="font-size:0.9em;">${labels[2]}</div><div style="font-size:0.65em; font-weight:normal;">${sublabels[2]}</div></div></div></div>
          `);
    } catch (e) {
      this.showResults("Gagal isochrone", "error");
    } finally {
      UIUtils.hideLoading();
    }
  },

  filterIsochrone(type) {
    if (this.state.activeIsochroneFilter === type) {
      this.state.activeIsochroneFilter = null;
      this.renderIsochroneLayer("all");
      this.updateFilterUI(null);
    } else {
      this.state.activeIsochroneFilter = type;
      this.renderIsochroneLayer(type);
      this.updateFilterUI(type);
    }
  },
  updateFilterUI(activeType) {
    const types = ["green", "yellow", "red"];
    const bgColors = { green: "#28a745", yellow: "#ffc107", red: "#dc3545" };
    const textColors = { green: "white", yellow: "#333", red: "white" };
    const activeBorderColors = { green: "white", yellow: "#333", red: "white" };
    const baseStyle =
      "cursor:pointer; padding:10px 5px; border-radius:8px; text-align:center; font-weight:bold; transition:all 0.2s; box-shadow: 0 2px 5px rgba(0,0,0,0.2); flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;";
    types.forEach((t) => {
      const btn = document.getElementById(`btn-iso-${t}`);
      if (btn) {
        let style =
          baseStyle +
          `background-color:${bgColors[t]}; color:${textColors[t]};`;
        if (t === activeType)
          style += `border: 3px solid ${activeBorderColors[t]}; transform: scale(1.05); box-shadow: 0 4px 8px rgba(0,0,0,0.3); opacity: 1;`;
        else if (activeType !== null)
          style += `border: 3px solid transparent; transform: scale(0.95); opacity: 0.5;`;
        else
          style += `border: 3px solid transparent; opacity: 1; transform: scale(1);`;
        btn.style.cssText = style;
      }
    });
  },
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
        let opacity = 0.5;
        if (type === "green") c = "#28a745";
        else if (type === "yellow") c = "#ffc107";
        else if (type === "red") c = "#dc3545";
        if (filterType !== "all") opacity = 0.7;
        return { color: c, weight: 1, fillOpacity: opacity, fillColor: c };
      },
    });
    this.state.currentIsochroneLayer = layer;
    this.state.analysisLayer.addLayer(layer);
    if (layer.getBounds().isValid()) this.map.fitBounds(layer.getBounds());
  },
  clearAnalysisLayers() {
    if (this.state.analysisLayer) this.state.analysisLayer.clearLayers();
    this.state.currentIsochroneLayer = null;
  },
  clearAnalysis() {
    this.clearAnalysisLayers();
    this.state.lastClickPoint = null;
    const panel = document.getElementById("analysis-panel");
    const resultsDiv = document.getElementById("analysis-results");
    const infoDiv = document.getElementById("analysis-info");
    if (panel) {
      panel.classList.remove("has-results");
      panel.classList.add("active");
      const mapWrapper = document.querySelector(".map-wrapper");
      if (mapWrapper) mapWrapper.classList.add("sidebar-open");
    }
    if (resultsDiv) resultsDiv.style.display = "none";
    if (infoDiv) infoDiv.style.display = "block";
  },
  showResults(content, type = "success") {
    const panel = document.getElementById("analysis-panel");
    const resultsDiv = document.getElementById("analysis-results");
    const resultsContent = document.getElementById("results-content");
    if (resultsDiv && resultsContent) {
      resultsDiv.style.display = "block";
      resultsContent.innerHTML = content;
      resultsContent.className = `results-content ${type}`;
      if (panel) {
        panel.classList.add("has-results");
        panel.classList.add("active");
        const mapWrapper = document.querySelector(".map-wrapper");
        if (mapWrapper) mapWrapper.classList.add("sidebar-open");
      }
    }
  },
  findTopNearestFacilities(point, latlng) {
    this.showResults("Fitur Top 5 belum update API.", "info");
  },
  gapAnalysis(point, latlng) {
    this.showResults("Fitur Gap belum update API.", "info");
  },
  compareAccessibility(point, latlng) {
    this.showResults("Fitur Compare belum update API.", "info");
  },
};

if (typeof module !== "undefined" && module.exports)
  module.exports = AnalysisUtils;
