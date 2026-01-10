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
    comparePoints: [],
    markerRegistry: {}, // New: Store markers by FID
  },

  registerMarker(fid, marker) {
    this.state.markerRegistry[fid] = marker;
  },

  getMarker(fid) {
    return this.state.markerRegistry[fid];
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
    if (resultsDiv) {
      resultsDiv.style.display = "none";
      resultsDiv.innerHTML = "";
    }
    if (infoDiv) infoDiv.style.display = "block";
    if (this.state.districtBoundary) {
      const layer = L.geoJSON(this.state.districtBoundary, {
        style: { color: "#3388ff", weight: 2, fillOpacity: 0 },
      });
      this.state.analysisLayer.addLayer(layer);
    }
  },
};

if (typeof module !== "undefined" && module.exports)
  module.exports = AnalysisUtils;
