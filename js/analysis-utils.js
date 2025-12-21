/**
 * Analysis Utilities Module
 * Handles spatial analysis operations using Turf.js and RoutingService
 * FINAL VERSION: Isochrone updated to Circular visual (Walking speed assumption).
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
      const isActive = panel.classList.toggle("active");

      // Toggle Map Shift
      const mapWrapper = document.querySelector(".map-wrapper");
      const footer = document.querySelector(".footer");

      if (isActive) {
        mapWrapper?.classList.add("sidebar-open");
        footer?.classList.add("sidebar-open");
        toggleBtn.style.opacity = "0";
        toggleBtn.style.pointerEvents = "none";
      } else {
        mapWrapper?.classList.remove("sidebar-open");
        footer?.classList.remove("sidebar-open");
        toggleBtn.style.opacity = "1";
        toggleBtn.style.pointerEvents = "auto";
      }

      setTimeout(() => this.map.invalidateSize(), 300);
    });

    if (closeBtn)
      closeBtn.addEventListener("click", () => {
        panel.classList.remove("active");
        const mapWrapper = document.querySelector(".map-wrapper");
        const footer = document.querySelector(".footer");
        const toggleBtn = document.getElementById("analysis-toggle");

        mapWrapper?.classList.remove("sidebar-open");
        footer?.classList.remove("sidebar-open");
        if (toggleBtn) {
          toggleBtn.style.opacity = "1";
          toggleBtn.style.pointerEvents = "auto";
        }
        setTimeout(() => this.map.invalidateSize(), 300);
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
    this.state.comparePoints = [];

    // Reset default methods
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
    } else if (mode === "compare") {
      htmlContent = `<p class="info-instruction">⚖️ <strong>Mode Perbandingan</strong><br>Klik <strong>Titik A (Lokasi 1)</strong>, lalu klik <strong>Titik B (Lokasi 2)</strong> untuk membandingkan potensi keduanya.</p>`;
      if (panel) panel.classList.add("active");
    } else if (mode === "gap") {
      htmlContent = `<p class="info-instruction">⚠️ <strong>Gap Analysis</strong><br>Klik sembarang titik DALAM BATAS KECAMATAN untuk mengecek ketersediaan fasilitas.</p>`;
      if (panel) panel.classList.add("active");
    } else if (mode === "clustering") {
      htmlContent = `<p class="info-instruction">🧩 <strong>GeoAI Clustering</strong><br>Klik <strong>"Jalankan Clustering"</strong> atau klik peta untuk mengelompokkan fasilitas secara otomatis menggunakan K-Means.</p>`;
      if (panel) panel.classList.add("active");
    } else {
      const instructions = {
        isochrone:
          "🕐 Klik peta untuk melihat analisis jangkauan waktu (Jalan Kaki).",
        buffer: "⭕ Service Area: Klik peta untuk melihat jangkauan radius.",
        topN: "🏆 Klik peta untuk melihat Top 5 lokasi berpotensi padat penduduk.",
      };
      htmlContent = `<p class="info-instruction">${instructions[mode] || "Pilih mode."
        }</p>`;

      if (panel) panel.classList.remove("active");
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
          "gap",
          "compare",
          "prediction",
          "clustering",
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

    if (
      !["distance", "nearest", "prediction", "compare", "gap", "clustering"].includes(
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
        break; // 🔴 TARGET MODIFIKASI
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
      case "clustering":
        this.performClustering();
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

  /**
   * ⭕ ISOCHRONE (CIRCULAR STYLE) & SERVICE AREA
   * Diperbarui agar Isochrone juga menggunakan Lingkaran (bukan API) dengan asumsi 5 km/jam.
   */
  async runIsochroneLogic(point, latlng, type) {
    this.clearAnalysisLayers();
    this.state.currentIsochroneLayer = null;
    UIUtils.showLoading();

    // Marker Pusat Analisis
    L.circleMarker(latlng, {
      radius: 8,
      fillColor: "#6f42c1",
      color: "#fff",
      fillOpacity: 1,
    })
      .addTo(this.state.analysisLayer)
      .bindPopup("<b>Pusat Analisis</b>")
      .openPopup();

    try {
      let ranges, labels, sublabels, title, subtitle;
      const processedFeatures = [];
      const facilityCounts = [0, 0, 0];

      // KONFIGURASI SESUAI PERMINTAAN
      if (type === "time") {
        title = "Analisis Aksesibilitas Waktu Tempuh";
        subtitle = "Berdasarkan kecepatan berjalan kaki rata-rata (5 km/jam)";
        // Asumsi: 5km/h -> 5 menit = 0.41km (dibulatkan 0.5km sesuai request)
        ranges = [0.5, 1.0, 1.5]; // KM
        labels = ["5 menit (0.5 km)", "10 menit (1 km)", "15 menit (1.5 km)"];
      } else {
        title = "Analisis Service Area";
        subtitle = "Analisis jangkauan layanan berdasarkan radius.";
        ranges = [0.5, 1.0, 1.5];
        labels = ["500 m", "1 km", "1.5 km"];
      }

      // BUAT LINGKARAN (TURF.JS) - UNTUK KEDUA MODE
      const center = turf.point(point);
      const options = { steps: 64, units: "kilometers" };

      const circleSmall = turf.circle(center, ranges[0], options);
      const circleMedium = turf.circle(center, ranges[1], options);
      const circleLarge = turf.circle(center, ranges[2], options);

      const facilityPoints = turf.featureCollection(
        this.state.allFacilities.map((f) => turf.point(f.geometry.coordinates))
      );

      // Hitung Fasilitas & Buat Donat (Agar warna tidak tumpang tindih)

      // Zona 1 (Hijau)
      circleSmall.properties = { rangeType: "green", value: 1 };
      processedFeatures.push(circleSmall);
      facilityCounts[0] = turf.pointsWithinPolygon(
        facilityPoints,
        circleSmall
      ).features.length;

      // Zona 2 (Kuning)
      const diffMedium = turf.difference(circleMedium, circleSmall);
      if (diffMedium) {
        diffMedium.properties = { rangeType: "yellow", value: 2 };
        processedFeatures.push(diffMedium);
      }
      // Kumulatif 1km
      facilityCounts[1] = turf.pointsWithinPolygon(
        facilityPoints,
        circleMedium
      ).features.length;

      // Zona 3 (Merah)
      const diffLarge = turf.difference(circleLarge, circleMedium);
      if (diffLarge) {
        diffLarge.properties = { rangeType: "red", value: 3 };
        processedFeatures.push(diffLarge);
      }
      // Kumulatif 1.5km
      facilityCounts[2] = turf.pointsWithinPolygon(
        facilityPoints,
        circleLarge
      ).features.length;

      this.state.isochroneData = {
        type: "FeatureCollection",
        features: processedFeatures,
      };
      this.state.isochroneRanges = ranges;
      this.state.activeIsochroneFilter = null;

      // Render Peta
      this.renderIsochroneLayer("all");

      // --- RENDER UI (SAMA UNTUK KEDUANYA KARENA FORMAT SAMA) ---
      const resultHTML = `
        <div class="result-item" style="padding: 20px; border: none; box-shadow: none;">
            <h4 style="margin:0 0 5px 0; color:#2c3e50; font-size:16px;">${title}</h4>
            <div style="font-size:0.8em; color:#666; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
                ${subtitle}
            </div>

            <div style="margin-bottom:10px; background:#f0fdf4; padding:12px; border-radius:6px; border-left:5px solid #28a745;">
                <div style="font-weight:700; font-size:1em; color:#15803d;">${labels[0]}</div>
                <div style="font-size:0.9em; color:#333; margin-top:2px;">
                    <strong>${facilityCounts[0]}</strong> fasilitas tersedia
                </div>
            </div>

            <div style="margin-bottom:10px; background:#fefce8; padding:12px; border-radius:6px; border-left:5px solid #ffc107;">
                <div style="font-weight:700; font-size:1em; color:#b45309;">${labels[1]}</div>
                <div style="font-size:0.9em; color:#333; margin-top:2px;">
                    <strong>${facilityCounts[1]}</strong> fasilitas tersedia
                </div>
            </div>

            <div style="margin-bottom:15px; background:#fef2f2; padding:12px; border-radius:6px; border-left:5px solid #dc3545;">
                <div style="font-weight:700; font-size:1em; color:#b91c1c;">${labels[2]}</div>
                <div style="font-size:0.9em; color:#333; margin-top:2px;">
                    <strong>${facilityCounts[2]}</strong> fasilitas tersedia
                </div>
            </div>

            <div style="color:#28a745; font-weight:600; font-size:0.85em; display:flex; align-items:center; gap:6px;">
                <span style="font-size:1.2em;">✓</span> Analisis selesai ditampilkan
            </div>
        </div>
      `;

      this.showResults(resultHTML);
    } catch (e) {
      console.error("Isochrone Error:", e);
      this.showResults("Gagal memuat analisis.", "error");
    } finally {
      UIUtils.hideLoading();
    }
  },

  filterIsochrone(type) {
    if (this.state.activeIsochroneFilter === type) {
      this.state.activeIsochroneFilter = null;
      this.renderIsochroneLayer("all");
    } else {
      this.state.activeIsochroneFilter = type;
      this.renderIsochroneLayer(type);
    }
  },

  updateFilterUI(activeType) {
    // UI handled by HTML string
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
        let opacity = 0.2; // Transparan
        if (type === "green") c = "#28a745";
        else if (type === "yellow") c = "#ffc107";
        else if (type === "red") c = "#dc3545";
        if (filterType !== "all") opacity = 0.5;
        return { color: c, weight: 2, fillOpacity: opacity, fillColor: c };
      },
    });
    this.state.currentIsochroneLayer = layer;
    this.state.analysisLayer.addLayer(layer);
    if (layer.getBounds().isValid())
      this.map.fitBounds(layer.getBounds(), { padding: [50, 50] });
  },

  // --- FITUR LAIN (TETAP SAMA) ---
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
        this.showResults(`
          <div class="result-item" style="padding: 15px; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="display:flex; align-items:center; gap:15px;">
                  <div style="font-size:24px;">📏</div>
                  <div>
                      <div style="font-weight:700; color:#2c3e50; font-size:1em; margin-bottom:2px;">Jarak Linear</div>
                      <div style="font-size:1.4em; font-weight:800; color:#333;">${straightDist.toFixed(
          2
        )} km</div>
                      <div style="font-size:0.85em; color:#888;">${(
            straightDist * 1000
          ).toFixed(0)} meter</div>
                  </div>
              </div>
          </div>
        `);
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
          this.showResults(`
            <div class="result-item" style="padding: 15px; border: 1px solid #eee; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; gap:15px;">
                     <div style="font-size:24px;">🚗</div>
                     <div>
                        <div style="font-weight:700; color:#2c3e50; font-size:1em; margin-bottom:2px;">Jarak Rute Jalan</div>
                        <div style="font-size:1.4em; font-weight:800; color:#333;">${distanceKm} km</div>
                        <div style="font-size:0.85em; color:#888;">${summary.distance.toFixed(
            0
          )} meter</div>
                     </div>
                </div>
            </div>
          `);
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
        distributionHTML += `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px; font-size:0.85em; border-bottom:1px solid #eee; padding-bottom:3px;">
                <span style="color:#555;">${key}</span>
                <span style="font-weight:bold; color:#333;">${value}</span>
            </div>
          `;
      }
    }

    if (distributionHTML === "") {
      distributionHTML = `<div style="font-size:0.85em; color:#888; font-style:italic;">Tidak ada fasilitas dalam radius 1 km.</div>`;
    }

    this.showResults(`
      <div class="result-item" style="padding:0; border:none; box-shadow:none;">
          <div style="background:${headerColor}; color:white; padding:15px; border-radius:8px; text-align:center; font-weight:700; font-size:1.1em; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
              ${statusHeader}
          </div>
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
      </div>
  `);
    UIUtils.hideLoading();
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
          style: {
            color: color,
            weight: 4,
            opacity: 0.7,
            lineCap: "round",
          },
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
      resultsHTML += `<div class="result-item" style="border-left: 5px solid ${color}; position:relative; overflow:hidden;"><div style="position:absolute; right:-10px; top:-10px; background:${color}; color:white; width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2em; opacity:0.2;">#${rank}</div><div style="font-weight:bold; color:#333; font-size:1.1em; margin-bottom:4px;">${fac.name
        }</div><div style="font-size:0.85em; color:#666; margin-bottom:8px;">Jarak: <strong>${fac.dist.toFixed(
          2
        )} km</strong></div><div style="background:#f8f9fa; padding:8px; border-radius:6px; margin-bottom:6px;"><div style="font-size:0.75em; text-transform:uppercase; color:#888; font-weight:600;">Potensi Kepadatan</div><div style="font-weight:bold; color:${color}; font-size:1em;">${density}</div></div><div style="font-size:0.85em; color:#555; line-height:1.4; border-top:1px solid #eee; padding-top:6px;">💡 ${reason}</div></div>`;
    });
    await Promise.all(routePromises);
    this.showResults(resultsHTML);
    UIUtils.hideLoading();
  },

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
              </div>
          `);
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
      listHTML += `<li style="display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #eee; font-size:0.85em;"><span>${d.icon
        } ${d.name
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

  async performClustering() {
    this.clearAnalysisLayers();
    UIUtils.showLoading();

    setTimeout(() => {
      try {
        const facilities = this.state.allFacilities;
        if (!facilities || facilities.length === 0) {
          throw new Error("Data fasilitas belum dimuat.");
        }

        // 1. Kelompokkan Fasilitas berdasarkan Kategori
        const categories = {
          SD: {
            data: [],
            color: "#0066cc",
            label: "Sekolah Dasar",
            alias: "Cluster SD",
          },
          SMP: {
            data: [],
            color: "#28a745",
            label: "SMP/Sederajat",
            alias: "Cluster SMP",
          },
          SMA: {
            data: [],
            color: "#dc3545",
            label: "SMA/SMK",
            alias: "Cluster SMA",
          },
          Universitas: {
            data: [],
            color: "#6f42c1",
            label: "Perguruan Tinggi",
            alias: "Kawasan Kampus",
          },
          Kesehatan: {
            data: [],
            color: "#17a2b8",
            label: "Fasilitas Kesehatan",
            alias: "Zona Kesehatan",
          },
          Lainnya: {
            data: [],
            color: "#6c757d",
            label: "Fasilitas Umum",
            alias: "Area Fasum",
          },
        };

        facilities.forEach((f) => {
          const props = f.properties;
          const name = this.getRealFacilityName(props).toLowerCase();
          const pt = turf.point(f.geometry.coordinates, f.properties);

          if (name.includes("sd ") || name.includes("mib") || name.includes("sdn")) categories.SD.data.push(pt);
          else if (name.includes("smp") || name.includes("mts")) categories.SMP.data.push(pt);
          else if (name.includes("sma") || name.includes("smk") || name.includes("man")) categories.SMA.data.push(pt);
          else if (name.includes("universitas") || name.includes("stikes") || name.includes("akade"))
            categories.Universitas.data.push(pt);
          else if (
            name.includes("rs ") ||
            name.includes("sakit") ||
            name.includes("puskesmas") ||
            name.includes("klinik") ||
            name.includes("posyandu")
          )
            categories.Kesehatan.data.push(pt);
          else categories.Lainnya.data.push(pt);
        });

        let resultHTML = "";
        let totalClusters = 0;

        // 2. Lakukan K-Means untuk Setiap Kategori
        Object.keys(categories).forEach((key) => {
          const cat = categories[key];
          if (cat.data.length === 0) return;

          // Tentukan jumlah cluster dinamis (min 1, max item/2) agar tidak error jika data sedikit
          // Aturan: Jika data < 3, jadikan 1 cluster. Jika lebih, maksimal 5 cluster.
          let k = Math.min(5, Math.ceil(cat.data.length / 3));
          if (cat.data.length < 3) k = 1;

          const collection = turf.featureCollection(cat.data);

          // Turf K-Means
          const clustered = turf.clustersKmeans(collection, {
            numberOfClusters: k,
          });

          // Grouping hasil cluster untuk Convex Hull
          const groupCoords = {};

          clustered.features.forEach((feature) => {
            const clusterId = feature.properties.cluster; // 0, 1, 2...
            const uniqueClusterId = `${key}-${clusterId}`; // SD-0, SD-1

            // Visualisasi Titik
            L.circleMarker(
              [
                feature.geometry.coordinates[1],
                feature.geometry.coordinates[0],
              ],
              {
                radius: 5,
                fillColor: cat.color,
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
              }
            )
              .bindPopup(
                `<b>${this.getRealFacilityName(feature.properties)}</b><br>${cat.alias
                } #${clusterId + 1}`
              )
              .addTo(this.state.analysisLayer);

            if (!groupCoords[clusterId]) groupCoords[clusterId] = [];
            groupCoords[clusterId].push(feature.geometry.coordinates);
          });

          // Visualisasi Area (Hull)
          Object.keys(groupCoords).forEach((cId) => {
            totalClusters++;
            const coords = groupCoords[cId];
            if (coords.length >= 3) {
              const pts = turf.featureCollection(
                coords.map((c) => turf.point(c))
              );
              const hull = turf.convex(pts);
              if (hull) {
                L.geoJSON(hull, {
                  style: {
                    color: cat.color,
                    weight: 2,
                    dashArray: "5, 5",
                    fillOpacity: 0.1,
                    fillColor: cat.color,
                  },
                })
                  .bindTooltip(`${cat.alias} ${parseInt(cId) + 1}`, {
                    permanent: true,
                    direction: "center",
                    className: "cluster-label",
                  })
                  .addTo(this.state.analysisLayer);
              }
            }
          });

          // Tambahkan Info ke Panel
          resultHTML += `
            <div style="margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; font-size:0.9em; border-bottom:1px solid #eee; padding-bottom:5px;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="display:inline-block; width:10px; height:10px; background:${cat.color}; border-radius:50%;"></span>
                    <span style="color:#555;">${cat.label}</span>
                </div>
                <span style="font-weight:bold; color:#333;">${k} Cluster</span>
            </div>
          `;
        });

        this.showResults(`
            <div class="result-item" style="border:none; box-shadow:none;">
                 <div style="margin-bottom:15px; text-align:center;">
                    <div style="font-size:32px;">🧩</div>
                    <h4 style="margin:5px 0 0 0; color:#2c3e50;">Category Clustering</h4>
                    <span style="font-size:0.8em; color:#888;">Spatial Grouping by Type</span>
                </div>
                
                <div style="background:#f8f9fa; padding:12px; border-radius:8px; margin-bottom:15px; font-size:0.9em; color:#444; line-height:1.5;">
                    Algoritma telah mendeteksi <strong>${totalClusters} zona fasilitas</strong> berdasarkan kategori pendidikan dan kesehatan.
                </div>

                <div style="margin-bottom:15px; background:#fff; border:1px solid #eee; padding:10px; border-radius:8px;">
                    ${resultHTML}
                </div>

                <div style="font-size:0.85em; color:#666; border-top:1px solid #eee; padding-top:10px;">
                    <strong>🎯 Manfaat Analisis Ini:</strong><br>
                    <ul style="padding-left:15px; margin:5px 0 0 0; line-height:1.4;">
                        <li><strong>Identifikasi Pusat Layanan:</strong> Area dengan cluster padat menandakan kawasan pusat kegiatan (misal: Kawasan Pendidikan).</li>
                        <li><strong>Deteksi Ketimpangan:</strong> Jika semua sekolah menumpuk di satu cluster, berarti ada wilayah lain yang tidak terlayani (Blind Spot).</li>
                        <li><strong>Perencanaan Transportasi:</strong> Cluster fasilitas umum membutuhkan rute angkutan umum yang lebih intensif.</li>
                    </ul>
                </div>
            </div>
        `);
      } catch (e) {
        console.error("Clustering error:", e);
        this.showResults("Gagal melakukan clustering.", "error");
      } finally {
        UIUtils.hideLoading();
      }
    }, 500);
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
      const toggleBtn = document.getElementById("analysis-toggle");
      if (toggleBtn) {
        toggleBtn.style.opacity = "0";
        toggleBtn.style.pointerEvents = "none";
      }
      setTimeout(() => this.map.invalidateSize(), 300);
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
        const toggleBtn = document.getElementById("analysis-toggle");
        if (toggleBtn) {
          toggleBtn.style.opacity = "0";
          toggleBtn.style.pointerEvents = "none";
        }
        setTimeout(() => this.map.invalidateSize(), 300);
      }
    }
  },
};

if (typeof module !== "undefined" && module.exports)
  module.exports = AnalysisUtils;
