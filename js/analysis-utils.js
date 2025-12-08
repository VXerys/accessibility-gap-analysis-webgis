/**
 * Analysis Utilities Module
 * Handles spatial analysis operations using Turf.js and RoutingService
 */

const AnalysisUtils = {
  // Analysis state
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
    comparePoints: [],
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

    if (!toggleBtn || !panel) return;

    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      panel.classList.remove("has-results");
      panel.classList.toggle("active");
    });

    if (closeBtn)
      closeBtn.addEventListener("click", () =>
        panel.classList.remove("active")
      );
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
    this.state.comparePoints = [];

    // Reset default methods
    if (mode === "distance") this.state.measureMethod = "road";
    if (mode === "nearest") this.state.nearestMethod = "road";
    if (mode === "prediction") this.state.predictionMethod = "road";

    const infoDiv = document.getElementById("analysis-info");
    const panel = document.getElementById("analysis-panel");
    let htmlContent = "";

    // Style tombol internal
    const btnStyle =
      "cursor:pointer; padding:8px 12px; border-radius:6px; font-size:0.85em; font-weight:600; border:1px solid #ccc; background:#fff; flex:1; text-align:center; transition:all 0.2s;";
    const activeStyle =
      "background:#6f42c1; color:white; border-color:#6f42c1;";

    // UI Logic
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
    } else if (mode === "compare") {
      htmlContent = `<p class="info-instruction">⚖️ <strong>Mode Perbandingan</strong><br>Klik <strong>Titik A (Lokasi 1)</strong>, lalu klik <strong>Titik B (Lokasi 2)</strong> untuk membandingkan potensi keduanya.</p>`;
      if (panel) panel.classList.add("active");
    } else if (mode === "gap") {
      htmlContent = `<p class="info-instruction">⚠️ <strong>Gap Analysis</strong><br>Klik sembarang titik DALAM BATAS KECAMATAN untuk mengecek ketersediaan fasilitas.</p>`;
      if (panel) panel.classList.add("active");
    } else {
      const instructions = {
        isochrone: "🕐 Klik peta untuk melihat area jangkauan waktu.",
        buffer:
          "⭕ KHUSUS MARKER: Klik ikon Sekolah/RS untuk melihat Service Area.",
        topN: "🏆 Klik peta untuk melihat Top 5 lokasi berpotensi padat penduduk.",
      };
      htmlContent = `<p class="info-instruction">${
        instructions[mode] || "Pilih mode."
      }</p>`;

      // Mode lain tutup panel sementara
      if (panel) panel.classList.remove("active");
    }

    if (infoDiv) infoDiv.innerHTML = htmlContent;
    this.clearAnalysisLayers();
  },

  // --- Helper Set Methods (PENTING UNTUK TOMBOL) ---
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
      // HAPUS BLOKIR BUFFER AGAR SERVICE AREA BISA KLIK PETA
      // if (this.state.currentMode === "buffer") return;
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

    // Hanya tutup panel jika mode tersebut tidak memiliki opsi tombol di panel
    if (
      !["distance", "nearest", "prediction", "compare", "gap"].includes(
        this.state.currentMode
      )
    ) {
      if (panel) panel.classList.remove("active");
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
        this.findTop5Hotspots(point, latlng);
        break;
      case "gap":
        this.gapAnalysis(point, latlng);
        break;
      case "compare":
        this.runCompareAnalysis(point, latlng);
        break;
      case "prediction":
        this.predictSettlementGrowth(point, latlng);
        break;
    }
  },

  storeFacilities(facilities) {
    this.state.allFacilities = facilities;
  },

  getRealFacilityName(props) {
    if (!props) return "Fasilitas";
    if (props.nama) return props.nama;
    if (props.name) return props.name;
    if (props.KETERANGAN) return props.KETERANGAN;
    const specificKeys = [
      "SDN",
      "SDIT",
      "SMP",
      "SMPN",
      "SMA",
      "SMAN",
      "SMK",
      "Universitas",
      "Madrasah",
      "RS",
      "Rumah Sakit",
      "Puskesmas",
      "Klinik",
      "Posyandu",
    ];
    for (let key of specificKeys) {
      if (
        props[key] &&
        typeof props[key] === "string" &&
        props[key].trim() !== ""
      )
        return props[key];
    }
    for (let key in props) {
      const k = key.toLowerCase();
      const v = props[key];
      if (
        (v === "" || v === null) &&
        (k.includes("rs ") ||
          k.includes("puskesmas") ||
          k.includes("klinik") ||
          k.includes("posyandu"))
      )
        return key;
    }
    return "Fasilitas Umum";
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

  // --- UKUR JARAK (FIXED) ---
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
          // Fallback ke Garis Lurus jika API Gagal
          console.warn("API Error, fallback to straight line");
          const straightDist = turf.distance(
            turf.point(startPoint.point),
            turf.point(point)
          );
          L.polyline([startPoint.latlng, latlng], {
            color: "red",
            weight: 3,
            dashArray: "5, 5",
            opacity: 0.8,
          }).addTo(this.state.analysisLayer);
          this.showResults(
            `<div class="result-item" style="border-left: 4px solid red;"><div class="result-details"><div class="result-name">Gagal Memuat Rute Jalan</div><div class="result-distance">${straightDist.toFixed(
              2
            )} km (Lurus)</div><div style="font-size:0.8em; color:red;">Menggunakan mode garis lurus karena gangguan koneksi.</div></div></div>`,
            "error"
          );
        } finally {
          this.state.lastClickPoint = null;
          UIUtils.hideLoading();
        }
      }
    }
  },

  // --- TERDEKAT (FIXED) ---
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

    if (!this.state.allFacilities || this.state.allFacilities.length === 0) {
      this.showResults("Data fasilitas belum dimuat.", "error");
      UIUtils.hideLoading();
      return;
    }

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
      this.showResults("Tidak ada fasilitas ditemukan.", "error");
      UIUtils.hideLoading();
      return;
    }

    const fLatLng = [
      nearestCandidate.geometry.coordinates[1],
      nearestCandidate.geometry.coordinates[0],
    ];
    const name = this.getRealFacilityName(nearestCandidate.properties);

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
        const minutes = Math.round((summary.duration * 3.0) / 60);
        const color = RoutingService.getTimeColor(summary.duration * 3.0);
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
        // Fallback
        console.warn("API Error, fallback to straight line");
        L.polyline([latlng, fLatLng], {
          color: "red",
          weight: 3,
          dashArray: "5, 5",
        }).addTo(this.state.analysisLayer);
        this.showResults(
          `<div class="result-item" style="border-left: 4px solid red;"><div class="result-details"><div class="result-name">${name}</div><div class="result-distance">${minDist.toFixed(
            2
          )} km</div><div style="font-size:0.8em; color:red;">Mode garis lurus (Koneksi API Gagal)</div></div></div>`
        );
        this.map.fitBounds(L.latLngBounds([latlng, fLatLng]), {
          padding: [50, 50],
        });
      } finally {
        UIUtils.hideLoading();
      }
    }
  },

  // --- ISOCHRONE & SERVICE AREA ---
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
        const tf = 3.0;
        ranges = [
          Math.round(600 / tf),
          Math.round(1200 / tf),
          Math.round(1800 / tf),
        ];
        labels = ["0 - 10 Mnt", "10 - 20 Mnt", "20 - 30 Mnt"];
        sublabels = ["Sangat Dekat", "Dekat", "Jauh"];
      } else {
        // 🔴 UPDATE: PERPENDEK JARAK SERVICE AREA
        title = "Service Area (Jarak)";
        ranges = [150, 300, 500];
        labels = ["0 - 150 M", "150 - 300 M", "300 - 500 M"];
        sublabels = [
          "Jalan Kaki Santai",
          "Jalan Kaki Cepat",
          "Perlu Kendaraan",
        ];
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
      this.showResults(
        `<div class="isochrone-results"><h4 style="margin-bottom:15px;">${title}</h4><div style="display:flex; gap:8px; justify-content: space-between;"><div id="btn-iso-green" onclick="AnalysisUtils.filterIsochrone('green')" style="${btnStyle} background-color:#28a745; color:white;"><div style="font-size:0.9em;">${labels[0]}</div><div style="font-size:0.65em; font-weight:normal;">${sublabels[0]}</div></div><div id="btn-iso-yellow" onclick="AnalysisUtils.filterIsochrone('yellow')" style="${btnStyle} background-color:#ffc107; color:#333;"><div style="font-size:0.9em;">${labels[1]}</div><div style="font-size:0.65em; font-weight:normal;">${sublabels[1]}</div></div><div id="btn-iso-red" onclick="AnalysisUtils.filterIsochrone('red')" style="${btnStyle} background-color:#dc3545; color:white;"><div style="font-size:0.9em;">${labels[2]}</div><div style="font-size:0.65em; font-weight:normal;">${sublabels[2]}</div></div></div></div>`
      );
    } catch (e) {
      this.showResults("Gagal memuat Service Area.", "error");
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

  // --- GAP ANALYSIS ---
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
      color: "#28a745",
      dashArray: "5, 10",
      fillOpacity: 0.1,
    }).addTo(this.state.analysisLayer);
    const from = turf.point(point);
    const distances = this.state.allFacilities.map((f) => {
      const to = turf.point(f.geometry.coordinates);
      const dist = turf.distance(from, to, { units: "kilometers" });
      const props = f.properties;
      const name = this.getRealFacilityName(props);
      let type = "general";
      const nLower = name.toLowerCase();
      if (nLower.includes("sd")) type = "sd";
      else if (nLower.includes("smp")) type = "smp";
      else if (nLower.includes("sma")) type = "sma";
      else if (nLower.includes("rs") || nLower.includes("puskesmas"))
        type = "health";
      return { dist, type, name };
    });
    distances.sort((a, b) => a.dist - b.dist);
    const nearbyFacilities = distances.filter((d) => d.dist <= 0.5);
    const hasSD = nearbyFacilities.some((d) => d.type === "sd");
    const hasSMP = nearbyFacilities.some((d) => d.type === "smp");
    const hasHealth = nearbyFacilities.some((d) => d.type === "health");
    let status = "";
    let recommendations = [];
    let color = "";
    if (hasSD && hasSMP && hasHealth) {
      status = "✅ Area Terlayani Baik";
      color = "#28a745";
      recommendations.push(
        "Fasilitas dasar (SD, SMP, Kesehatan) tersedia dalam radius 500m."
      );
    } else {
      status = "⚠️ Area Kesenjangan (Gap)";
      color = "#ffc107";
      if (!hasSD)
        recommendations.push(
          "❌ <strong>Kekurangan SD:</strong> Tidak ada Sekolah Dasar dalam jangkauan 500m."
        );
      if (!hasSMP)
        recommendations.push(
          "❌ <strong>Kekurangan SMP:</strong> Akses ke SMP sulit (luar 500m)."
        );
      if (!hasHealth)
        recommendations.push(
          "❌ <strong>Kekurangan Faskes:</strong> Jauh dari Puskesmas/RS (luar 500m)."
        );
    }
    if (nearbyFacilities.length === 0) {
      status = "⛔ Blank Spot (Kritis)";
      color = "#dc3545";
      recommendations = [
        "Area ini sangat minim fasilitas publik (tidak ada dalam radius 500m).",
        "Prioritas pembangunan fasilitas pendidikan dasar dan kesehatan.",
      ];
    }
    let recList = recommendations
      .map((r) => `<li style="margin-bottom:6px; font-size:0.9em;">${r}</li>`)
      .join("");
    this.showResults(
      `<div class="result-item" style="border-top: 5px solid ${color}"><h4 style="margin:0 0 10px 0; color:${color}; text-align:center;">${status}</h4><div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:12px;"><div style="font-size:0.85em; color:#666; margin-bottom:5px;">Analisis Radius 500 Meter:</div><ul style="padding-left:20px; color:#444;">${recList}</ul></div><div style="font-size:0.85em; color:#666;"><strong>Terdekat:</strong><br>${
        distances[0] ? distances[0].name : "Tidak ada data"
      } (${distances[0] ? distances[0].dist.toFixed(2) : "-"} km)</div></div>`
    );
    UIUtils.hideLoading();
  },

  // --- TOP 5 ---
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

  // --- COMPARE ---
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
      this.showResults(
        `<div class="result-item" style="border-top: 5px solid ${winnerColor}"><h4 style="margin:0 0 10px 0; color:${winnerColor}; text-align:center;">${winnerText}</h4><div style="display:flex; gap:10px; margin-bottom:10px;"><div style="flex:1; background:#f0f7ff; padding:8px; border-radius:8px; border:1px solid #cce5ff;"><div style="font-weight:bold; color:#007bff; text-align:center; margin-bottom:5px;">Lokasi A</div><div style="font-size:1.8em; font-weight:800; text-align:center; color:#333;">${resultA.score}</div><div style="font-size:0.75em; text-align:center; color:#666;">Skor Potensi</div><div style="margin-top:8px; font-size:0.8em;"><strong>Terdekat:</strong><br>${resultA.nearestName}<br>(${resultA.nearestDist} km)</div></div><div style="flex:1; background:#fff0f1; padding:8px; border-radius:8px; border:1px solid #f5c6cb;"><div style="font-weight:bold; color:#dc3545; text-align:center; margin-bottom:5px;">Lokasi B</div><div style="font-size:1.8em; font-weight:800; text-align:center; color:#333;">${resultB.score}</div><div style="font-size:0.75em; text-align:center; color:#666;">Skor Potensi</div><div style="margin-top:8px; font-size:0.8em;"><strong>Terdekat:</strong><br>${resultB.nearestName}<br>(${resultB.nearestDist} km)</div></div></div><div style="font-size:0.85em; background:#f8f9fa; padding:10px; border-radius:8px; color:#555; line-height:1.4;"><strong>Analisis:</strong><br>Lokasi dengan skor lebih tinggi memiliki aksesibilitas lebih baik ke fasilitas pendidikan dan kesehatan dalam radius 1 KM.</div><button onclick="AnalysisUtils.resetCompare()" style="width:100%; margin-top:10px; padding:8px; background:#666; color:white; border:none; border-radius:6px; cursor:pointer;">Ulangi Perbandingan</button></div>`
      );
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
    let score = Math.round(100 - avgDist * 30);
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

  // --- PREDIKSI ---
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
    // LOGIKA PENJELASAN
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
      const footer = document.querySelector(".footer");
      if (footer) footer.classList.add("sidebar-open");
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
        const footer = document.querySelector(".footer");
        if (footer) footer.classList.add("sidebar-open");
      }
    }
  },
};

// 🔴 PASTIKAN GLOBAL SCOPE AGAR TOMBOL HTML BISA AKSES
window.AnalysisUtils = AnalysisUtils;
