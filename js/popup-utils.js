const PopupUtils = {
  generatePopupContent(props, dataSource) {
    let popupContent = "";
    let category = null;

    if (dataSource === "map") {
      if (props.BatasKecamatan) {
        popupContent = this.createPopupHTML(
          "📍 Batas Kecamatan",
          props.BatasKecamatan,
          "#ff7800",
          props
        );
        category = "batasKecamatan";
      } else if (props.SDN || (props["SDN "] && props["SDN "].trim() !== "")) {
        const nama = props.SDN || props["SDN "];
        popupContent = this.createPopupHTML(
          "🏫 Sekolah Dasar Negeri",
          nama,
          "#0066cc",
          props
        );
        category = "sdn";
      }
    }

    if (dataSource === "school") {
      if (props.SDN || (props["SDN "] && props["SDN "].trim() !== "")) {
        const nama = props.SDN || props["SDN "];
        popupContent = this.createPopupHTML(
          "🏫 Sekolah Dasar",
          nama,
          "#0066cc",
          props
        );
        category = "sdn";
      } else if (props.SDIT) {
        popupContent = this.createPopupHTML(
          "🏫 SDIT",
          props.SDIT,
          "#0066cc",
          props
        );
        category = "sdn";
      } else if (
        props.SMPN ||
        props.SMP ||
        (props["SMP "] && props["SMP "].trim() !== "")
      ) {
        const nama = props.SMPN || props.SMP || props["SMP "];
        popupContent = this.createPopupHTML(
          "🏫 Sekolah Menengah Pertama",
          nama,
          "#28a745",
          props
        );
        category = "smp";
      } else if (
        props.SMAN ||
        props.SMK ||
        (props["SMAN "] && props["SMAN "].trim() !== "")
      ) {
        const nama = props.SMAN || props.SMK || props["SMAN "];
        const jenis = props.SMAN || props["SMAN "] ? "SMA" : "SMK";
        popupContent = this.createPopupHTML(
          `🏫 ${jenis}`,
          nama,
          "#dc3545",
          props
        );
        category = "sma";
      } else if (
        props.Universitas ||
        (props["Universitas "] && props["Universitas "].trim() !== "")
      ) {
        const nama = props.Universitas || props["Universitas "];
        popupContent = this.createPopupHTML(
          "🎓 Universitas",
          nama,
          "#6f42c1",
          props
        );
        category = "universitas";
      } else if (props.Madrasah) {
        popupContent = this.createPopupHTML(
          "🕌 Madrasah",
          props.Madrasah,
          "#fd7e14",
          props
        );
        category = "lainnya";
      }
    }

    if (dataSource === "health") {
      for (let key in props) {
        const keyLower = key.toLowerCase();
        if (
          keyLower === "foto" ||
          keyLower === "image" ||
          keyLower === "gambar"
        ) {
          continue;
        }
        if (keyLower.includes("rs ") || keyLower.includes("rumah sakit")) {
          popupContent = this.createPopupHTML(
            "🏥 Rumah Sakit",
            key,
            "#e74c3c",
            props
          );
          category = "rumahSakit";
          break;
        }
        if (keyLower.includes("puskesmas")) {
          popupContent = this.createPopupHTML(
            "⚕️ Puskesmas",
            key,
            "#3498db",
            props
          );
          category = "puskesmas";
          break;
        }
        if (keyLower.includes("posyandu")) {
          popupContent = this.createPopupHTML(
            "👶 Posyandu",
            key,
            "#f39c12",
            props
          );
          category = "posyandu";
          break;
        }
        if (keyLower.includes("klinik")) {
          popupContent = this.createPopupHTML(
            "🩺 Klinik",
            key,
            "#2ecc71",
            props
          );
          category = "klinik";
          break;
        }
      }
    }

    return { popupContent, category };
  },

  createPopupHTML(title, content, color, props = {}) {
    let imgHTML = "";
    let fotoPath = null;
    for (let key in props) {
      const keyLower = key.toLowerCase();
      if (
        keyLower === "foto" ||
        keyLower === "image" ||
        keyLower === "gambar"
      ) {
        fotoPath = props[key];
        break;
      }
    }

    if (fotoPath && fotoPath.trim() !== "") {
      let imgPath;
      if (fotoPath.startsWith("http://") || fotoPath.startsWith("https://")) {
        imgPath = fotoPath;
      } else {
        const cleanPath = fotoPath.replace(/^img[\\/]/, "").replace(/\\/g, "/");
        imgPath = `img/${cleanPath}`;
      }

      const altText =
        title.includes("Sekolah") ||
        title.includes("SDIT") ||
        title.includes("SMA") ||
        title.includes("SMK") ||
        title.includes("Universitas") ||
        title.includes("Madrasah")
          ? "Foto Sekolah"
          : title.includes("Rumah Sakit")
          ? "Foto Rumah Sakit"
          : title.includes("Puskesmas")
          ? "Foto Puskesmas"
          : title.includes("Klinik")
          ? "Foto Klinik"
          : title.includes("Posyandu")
          ? "Foto Posyandu"
          : "Foto Fasilitas";

      imgHTML = `
                <div style="margin-top: 6px; text-align:center;">
                    <img src="${imgPath}" 
                         alt="${altText}"
                         onerror="console.error('Gambar gagal dimuat:', this.src); this.style.display='none';"
                         onload="console.log('Gambar berhasil dimuat:', this.src);"
                         style="width:200px;max-width:100%;height:auto;border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,0.3);" />
                </div>
            `;
    }

    return `
            <div style="padding: 5px;">
                <strong style="color: ${color}; font-size: 14px;">${title}</strong><br>
                <span style="font-size: 13px;">${content}</span>
                ${imgHTML}
            </div>
        `;
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = PopupUtils;
}
