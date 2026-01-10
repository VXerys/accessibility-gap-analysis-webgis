const DashboardUI = {
  open() {
    const dashboard = document.getElementById("dashboard-page");
    if (dashboard) dashboard.classList.add("active");
    document.body.classList.add("dashboard-active");
    this.switchView("overview");
    UIUtils.updateNavState("dashboard");
    this.renderGrid();
    this.updateStats();
  },

  close() {
    const dashboard = document.getElementById("dashboard-page");
    if (dashboard) dashboard.classList.remove("active");
    document.body.classList.remove("dashboard-active");
    UIUtils.updateNavState("map");
  },

  switchView(viewId, btn = null) {
    const sidebarBtns = document.querySelectorAll(".dash-menu-item");
    if (btn) {
      sidebarBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    } else {
      sidebarBtns.forEach((b) => {
        const onclick = b.getAttribute("onclick");
        if (onclick && onclick.includes(viewId)) {
          sidebarBtns.forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
        }
      });
    }

    document.querySelectorAll(".dash-view").forEach((v) => {
      v.classList.add("hidden");
      v.classList.remove("active");
      v.style.display = "none";
    });

    const target = document.getElementById(`dash-view-${viewId}`);
    if (target) {
      target.style.display = "block";
      setTimeout(() => {
        target.classList.remove("hidden");
        target.classList.add("active");
      }, 10);
    }
  },

  updateStats() {
    const facilities = AnalysisUtils.state.allFacilities || [];
    if (facilities.length === 0) return;

    const total = facilities.length;
    let health = 0;
    let edu = 0;

    facilities.forEach((f) => {
      const props = f.properties;
      const name = AnalysisUtils.getRealFacilityName(props).toLowerCase();
      if (
        name.includes("rs") ||
        name.includes("puskesmas") ||
        name.includes("klinik") ||
        name.includes("posyandu") ||
        props.RS
      ) {
        health++;
      } else {
        edu++;
      }
    });

    const elTotal = document.getElementById("stat-total-fac");
    const elEdu = document.getElementById("stat-total-edu");
    const elHealth = document.getElementById("stat-total-health");

    if (elTotal) UIUtils.animateValue(elTotal, 0, total, 1000);
    if (elEdu) UIUtils.animateValue(elEdu, 0, edu, 1000);
    if (elHealth) UIUtils.animateValue(elHealth, 0, health, 1000);
  },

  renderGrid(filterText = "", filterCategory = "all") {
    const container = document.getElementById("facilities-grid");
    if (!container) return;

    const facilities = AnalysisUtils.state.allFacilities || [];
    container.innerHTML = "";

    if (facilities.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:60px; color:#64748b;">
            <i class="ph-duotone ph-spinner" style="font-size:48px; animation:spin 1s linear infinite; color:var(--primary-color);"></i><br>
            <span style="display:block; margin-top:16px; font-weight:500;">Memuat data fasilitas...</span>
        </div>`;
      return;
    }

    let filtered = facilities.filter((f) => {
      const props = f.properties;
      const name = AnalysisUtils.getRealFacilityName(props).toLowerCase();
      if (name.includes("posyandu kemala")) return false;
      if (filterText && !name.includes(filterText.toLowerCase())) return false;
      if (filterCategory !== "all") {
        const typeInfo = this.getTypeInfo(name, props);
        const category = typeInfo.category.toLowerCase();
        if (filterCategory === "health" && category !== "health") return false;
        if (filterCategory === "education" && category !== "education")
          return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:60px; color:#64748b;">
            <i class="ph-duotone ph-mask-sad" style="font-size:48px; margin-bottom:16px; color:#94a3b8;"></i><br>
            <span style="font-size:1.1rem; font-weight:500;">Tidak ada fasilitas ditemukan.</span>
            <p style="margin-top:8px; font-size:0.9rem;">Coba gunakan kata kunci pencarian lain.</p>
        </div>`;
      return;
    }

    filtered.forEach((f) => {
      const props = f.properties;
      const name = AnalysisUtils.getRealFacilityName(props);
      const typeInfo = this.getTypeInfo(name, props);
      const coords = f.geometry.coordinates;

      let imageSrc = "assets/placeholder-facility.jpg";
      if (props.Foto) {
        let p = props.Foto;
        if (p.startsWith("..")) p = p.substring(2);
        if (p.startsWith("/")) p = p.substring(1);
        imageSrc = p;
      } else {
        if (typeInfo.category === "Health")
          imageSrc =
            "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=400&auto=format&fit=crop";
        else
          imageSrc =
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=400&auto=format&fit=crop";
      }

      const card = document.createElement("div");
      card.className = "facility-card-large";
      card.innerHTML = `
            <div class="large-card-img">
                <img src="${imageSrc}" alt="${name}" loading="lazy" onerror="this.src='https://placehold.co/500x300?text=No+Image'">
                <div class="large-card-badge" style="color:${typeInfo.color}">
                    ${typeInfo.icon} ${typeInfo.label}
                </div>
            </div>
            <div class="large-card-content">
                <div class="large-card-title">${name}</div>
                <div class="large-card-address">
                    <i class="ph-fill ph-map-pin"></i>
                    ${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}
                </div>
                
                <div class="large-card-stats">
                    <span class="badge-outline">Status: Aktif</span>
                    <span class="badge-outline">Kondisi: Baik</span>
                </div>

                <div class="large-card-actions">
                    <button class="btn-large-primary" onclick="DashboardUI.zoomToFacility('${
                      props.fid
                    }', ${coords[1]}, ${coords[0]})">
                        <i class="ph-bold ph-map-pin"></i> Lihat di Peta
                    </button>
                    <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      name + " Sukabumi"
                    )}" target="_blank" class="btn-large-secondary">
                        <i class="ph-bold ph-navigation-arrow"></i> Google Maps
                    </a>
                </div>
            </div>
        `;
      container.appendChild(card);
    });
  },

  getTypeInfo(name, props) {
    const n = name.toLowerCase();
    if (
      n.includes("universitas") ||
      n.includes("stikes") ||
      n.includes("akademi") ||
      n.includes("kampus")
    )
      return {
        label: "Perguruan Tinggi",
        icon: '<i class="ph-fill ph-bank"></i>',
        color: "#6f42c1",
        category: "Education",
      };
    if (
      n.includes("sma") ||
      n.includes("smk") ||
      n.includes("man") ||
      n.includes("aliyah")
    )
      return {
        label: "SMA/SMK",
        icon: '<i class="ph-fill ph-graduation-cap"></i>',
        color: "#dc3545",
        category: "Education",
      };
    if (n.includes("smp") || n.includes("mts"))
      return {
        label: "SMP",
        icon: '<i class="ph-fill ph-student"></i>',
        color: "#28a745",
        category: "Education",
      };
    if (
      n.includes("sd") ||
      n.includes("mi ") ||
      n.includes("madrasah ibtidaiyah")
    )
      return {
        label: "Sekolah Dasar",
        icon: '<i class="ph-fill ph-backpack"></i>',
        color: "#0066cc",
        category: "Education",
      };

    if (/\brs\b/.test(n) || n.includes("rumah sakit") || props.RS)
      return {
        label: "Rumah Sakit",
        icon: '<i class="ph-fill ph-first-aid"></i>',
        color: "#e74c3c",
        category: "Health",
      };
    if (n.includes("puskesmas"))
      return {
        label: "Puskesmas",
        icon: '<i class="ph-fill ph-heartbeat"></i>',
        color: "#3498db",
        category: "Health",
      };
    if (n.includes("klinik"))
      return {
        label: "Klinik",
        icon: '<i class="ph-fill ph-stethoscope"></i>',
        color: "#2ecc71",
        category: "Health",
      };
    if (n.includes("posyandu"))
      return {
        label: "Posyandu",
        icon: '<i class="ph-fill ph-baby"></i>',
        color: "#f39c12",
        category: "Health",
      };

    return {
      label: "Fasilitas Umum",
      icon: '<i class="ph-fill ph-building"></i>',
      color: "#64748b",
      category: "Other",
    };
  },

  filter() {
    const text = document.getElementById("facility-search").value;
    const activeTab = document.querySelector(".dash-menu-item.active");
    const category = activeTab ? this.getCategory(activeTab) : "all";
    this.renderGrid(text, category);
  },

  filterCategory(category, btn) {
    document
      .querySelectorAll(".dash-menu-item")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const text = document.getElementById("facility-search").value;
    this.renderGrid(text, category);
  },

  getCategory(btn) {
    const t = btn.innerText.toLowerCase();
    if (t.includes("semua")) return "all";
    if (t.includes("pendidikan")) return "education";
    if (t.includes("kesehatan")) return "health";
    return "all";
  },

  zoomToFacility(fid, lat, lng) {
    this.close();

    const landing = document.getElementById("landing-page");
    if (landing) landing.classList.remove("active");
    document.body.classList.remove("mode-landing");
    UIUtils.updateNavState("map");

    if (!window.map) {
      console.error("Map not initialized");
      return;
    }

    setTimeout(() => {
      window.map.invalidateSize();
    }, 100);

    window.map.flyTo([lat, lng], 18, {
      duration: 1.5,
    });

    const openPopupAction = () => {
      let marker = null;
      if (
        fid &&
        typeof AnalysisUtils !== "undefined" &&
        AnalysisUtils.getMarker
      ) {
        marker = AnalysisUtils.getMarker(fid);
      }

      if (marker) {
        if (!window.map.hasLayer(marker)) {
          marker.addTo(window.map);
        }
        setTimeout(() => {
          marker.openPopup();
        }, 100);
      } else {
        let found = false;
        window.map.eachLayer((layer) => {
          if (found) return;
          if (layer instanceof L.Marker && layer.getLatLng) {
            const mLat = layer.getLatLng().lat;
            const mLng = layer.getLatLng().lng;
            if (
              Math.abs(mLat - lat) < 0.0005 &&
              Math.abs(mLng - lng) < 0.0005
            ) {
              if (!window.map.hasLayer(layer)) {
                layer.addTo(window.map);
              }
              setTimeout(() => layer.openPopup(), 100);
              found = true;
            }
          }
        });
      }
    };

    window.map.once("moveend", openPopupAction);
    setTimeout(openPopupAction, 1600);
  },
};
