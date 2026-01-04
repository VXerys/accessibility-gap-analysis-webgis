const MarkerUtils = {
  iconConfig: {
    sdn: { color: "#0066cc", symbol: "🏫" },
    smp: { color: "#28a745", symbol: "🏫" },
    sma: { color: "#dc3545", symbol: "🏫" },
    universitas: { color: "#6f42c1", symbol: "🎓" },
    lainnya: { color: "#0066cc", symbol: "🏫" },
    rumahSakit: { color: "#e74c3c", symbol: "🏥" },
    puskesmas: { color: "#3498db", symbol: "⚕️" },
    klinik: { color: "#2ecc71", symbol: "🩺" },
    posyandu: { color: "#f39c12", symbol: "👶" },
    default: { color: "#3388ff", symbol: "●" },
  },

  getIconConfig(props, dataSource) {
    if (dataSource === "health") {
      for (let key in props) {
        const value = props[key];
        if (
          key.toLowerCase().includes("rs ") ||
          key.toLowerCase().includes("rumah sakit") ||
          (typeof value === "string" && value.toLowerCase().includes("rs "))
        ) {
          return this.iconConfig.rumahSakit;
        }
      }

      for (let key in props) {
        const value = props[key];
        if (
          key.toLowerCase().includes("puskesmas") ||
          (typeof value === "string" &&
            value.toLowerCase().includes("puskesmas"))
        ) {
          return this.iconConfig.puskesmas;
        }
      }

      for (let key in props) {
        const value = props[key];
        if (
          key.toLowerCase().includes("posyandu") ||
          (typeof value === "string" &&
            value.toLowerCase().includes("posyandu"))
        ) {
          return this.iconConfig.posyandu;
        }
      }

      for (let key in props) {
        const value = props[key];
        if (
          key.toLowerCase().includes("klinik") ||
          (typeof value === "string" && value.toLowerCase().includes("klinik"))
        ) {
          return this.iconConfig.klinik;
        }
      }

      return this.iconConfig.klinik;
    }

    if (props.SDN || (props["SDN "] && props["SDN "].trim() !== "")) {
      return this.iconConfig.sdn;
    }
    if (props.SDIT || props.Madrasah) {
      return this.iconConfig.lainnya;
    }
    if (
      props.SMPN ||
      props.SMP ||
      (props["SMP "] && props["SMP "].trim() !== "")
    ) {
      return this.iconConfig.smp;
    }
    if (
      props.SMAN ||
      props.SMK ||
      (props["SMAN "] && props["SMAN "].trim() !== "")
    ) {
      return this.iconConfig.sma;
    }
    if (
      props.Universitas ||
      (props["Universitas "] && props["Universitas "].trim() !== "")
    ) {
      return this.iconConfig.universitas;
    }
    return this.iconConfig.default;
  },

  createMarker(feature, latlng, dataSource) {
    const props = feature.properties;
    const config = this.getIconConfig(props, dataSource);

    const markerIcon = L.divIcon({
      className: "custom-marker",
      html: `<div style="
                background-color: ${config.color};
                width: 28px;
                height: 28px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                color: white;
                font-weight: bold;
            ">${config.symbol}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });

    const marker = L.marker(latlng, { icon: markerIcon });

    const { popupContent, category } = PopupUtils.generatePopupContent(
      props,
      dataSource
    );

    let fullPopupContent = popupContent;
    if (props.Foto || props.ImageURL || props.image) {
      const imgUrl = props.Foto || props.ImageURL || props.image;
      fullPopupContent += `
                <div style="margin-top: 6px; text-align: center;">
                    <img src="${imgUrl}" alt="Foto Sekolah" 
                         style="width:200px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.3);" />
                </div>
            `;
    }

    marker.bindPopup(fullPopupContent);

    return marker;
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = MarkerUtils;
}
