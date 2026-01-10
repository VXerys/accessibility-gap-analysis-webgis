Object.assign(AnalysisUtils, {
  setupEventListeners() {
    // New Dock Element Handling
    const dockContainer = document.querySelector(".dock-glass");
    const modeButtons = dockContainer
      ? dockContainer.querySelectorAll(".dock-item[data-mode]")
      : [];
    const clearBtn = document.getElementById("clear-analysis");

    // Mode Buttons Handler (Dock)
    modeButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const mode = e.currentTarget.dataset.mode;

        // Deactivate all first
        modeButtons.forEach((b) => b.classList.remove("active"));

        // Toggle Logic
        if (this.state.currentMode === mode) {
          // Unselect if same mode clicked
          this.setMode(null);
          e.currentTarget.classList.remove("active");
        } else {
          // Activate new mode
          this.setMode(mode);
          e.currentTarget.classList.add("active");

          // Show toast instruction immediately
          this.showInstructionToast(mode);
        }
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        this.setMode(null); // Disable any active tool
        this.clearAnalysis();
        modeButtons.forEach((b) => b.classList.remove("active"));
        const toast = document.getElementById("analysis-results");
        if (toast) toast.style.display = "none";
      });
    }
  },

  showInstructionToast(mode) {
    const instructions = {
      nearest: "Klik pada peta untuk mencari fasilitas terdekat.",
      distance: "Klik Titik A dan Titik B pada peta untuk mengukur jarak.",
      isochrone:
        "Klik lokasi pada peta untuk melihat jangkauan akses (50m - 250m - 500m).",
      buffer: "Klik lokasi untuk melihat area layanan (Service Area).",
      gap: "Klik area kecamatan untuk analisis kesenjangan akses.",
      compare: "Klik dua lokasi berbeda untuk membandingkan aksesibilitasnya.",
      clustering:
        "Klik 'Jalankan Clustering' atau klik peta untuk analisis K-Means.",
      prediction: "Klik area dalam batas kecamatan untuk prediksi pemukiman.",
      topN: "Klik peta untuk melihat Top 5 lokasi berpotensi padat penduduk.",
    };

    const msg =
      instructions[mode] || "Mode aktif. Silakan berinteraksi dengan peta.";

    // Target the floating pill directly
    const infoPill = document.getElementById("analysis-info");
    if (infoPill) {
      infoPill.innerHTML = `<i class="ph-fill ph-info"></i> ${msg}`;
      infoPill.style.display = "block";
      // Ensure pill animation triggers
      infoPill.style.animation = "none";
      infoPill.offsetHeight; /* trigger reflow */
      infoPill.style.animation = "fadeIn 0.3s ease";
    }

    // Hide old toast if present
    const oldToast = document.getElementById("analysis-results");
    if (oldToast) oldToast.style.display = "none";
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

  closeSidebar() {
    const sidebar = document.getElementById("analysis-sidebar");
    if (sidebar) sidebar.classList.remove("active");
  },

  showResults(content, type = "success") {
    const sidebar = document.getElementById("analysis-sidebar");
    const sidebarContent = document.getElementById("analysis-sidebar-content");
    const infoDiv = document.getElementById("analysis-info"); // Floating pill

    if (sidebar && sidebarContent) {
      if (infoDiv) infoDiv.style.display = "none";

      sidebarContent.innerHTML = content;
      sidebar.classList.add("active");

      // Optionally shift map controls or map center if needed,
      // but for now just showing sidebar is enough.

      // Ensure the old toast is hidden if it exists
      const oldToast = document.getElementById("analysis-results");
      if (oldToast) oldToast.style.display = "none";
    } else {
      console.error("Analysis Sidebar elements not found.");
      // Fallback to console
      console.log("Analysis Results:", content);
    }
  },
});
