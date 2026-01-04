Object.assign(AnalysisUtils, {
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
            <p class="info-instruction" style="font-size:0.85em; color:#666;"><span id="dist-desc">Klik Titik A lalu Titik B untuk mengukur rute.</span></p>`;
      if (panel) panel.classList.add("active");
    } else if (mode === "nearest") {
      htmlContent = `
            <p class="info-instruction" style="margin-bottom:10px;">Pilih metode pencarian:</p>
            <div style="display:flex; gap:10px; margin-bottom:12px;">
                <button id="btn-near-line" onclick="AnalysisUtils.setNearestMethod('line')" style="${btnStyle}">📏 Garis Lurus</button>
                <button id="btn-near-road" onclick="AnalysisUtils.setNearestMethod('road')" style="${btnStyle} ${activeStyle}">🚗 Ikuti Jalan (API)</button>
            </div>
            <p class="info-instruction" style="font-size:0.85em; color:#666;"><span id="near-desc">Klik peta untuk mencari fasilitas terdekat.</span></p>`;
      if (panel) panel.classList.add("active");
    } else if (mode === "prediction") {
      htmlContent = `
            <p class="info-instruction" style="margin-bottom:10px;">Metode Prediksi:</p>
            <div style="display:flex; gap:10px; margin-bottom:12px;">
                <button id="btn-pred-line" onclick="AnalysisUtils.setPredictionMethod('line')" style="${btnStyle}">📏 Garis Lurus</button>
                <button id="btn-pred-road" onclick="AnalysisUtils.setPredictionMethod('road')" style="${btnStyle} ${activeStyle}">🚗 Ikuti Jalan (API)</button>
            </div>
            <p class="info-instruction" style="font-size:0.85em; color:#666;"><span id="pred-desc">Klik area dalam batas kecamatan untuk prediksi pemukiman.</span></p>`;
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
      htmlContent = `<p class="info-instruction">${
        instructions[mode] || "Pilih mode."
      }</p>`;
      if (panel) panel.classList.remove("active");
    }

    if (infoDiv) infoDiv.innerHTML = htmlContent;
    this.clearAnalysisLayers();
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
      ![
        "distance",
        "nearest",
        "prediction",
        "compare",
        "gap",
        "clustering",
      ].includes(this.state.currentMode)
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
      case "clustering":
        this.performClustering();
        break;
    }
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

  showResults(content, type = "success") {
    const panel = document.getElementById("analysis-panel");
    const resultsDiv = document.getElementById("analysis-results");
    const contentDiv = document.getElementById("results-content");
    const infoDiv = document.getElementById("analysis-info");
    if (panel && resultsDiv && contentDiv) {
      infoDiv.style.display = "none";
      contentDiv.innerHTML = content;
      resultsDiv.style.display = "block";
      panel.classList.add("has-results");
      panel.classList.add("active");
      const mapWrapper = document.querySelector(".map-wrapper");
      if (mapWrapper) mapWrapper.classList.add("sidebar-open");
      const footer = document.querySelector(".footer");
      if (footer) footer.classList.add("sidebar-open");
    }
  },
});
