const UIUtils = {
  stats: {
    sd: 0,
    smp: 0,
    sma: 0,
    universitas: 0,
    rumahSakit: 0,
    puskesmas: 0,
    klinik: 0,
    posyandu: 0,
    total: 0,
    totalHealth: 0,
  },

  showLoading() {
    const loading = document.getElementById("loading");
    if (loading) loading.classList.remove("hidden");
  },

  hideLoading() {
    const loading = document.getElementById("loading");
    if (loading) loading.classList.add("hidden");
  },

  showError(message) {
    console.error(message);
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
    errorDiv.style.cssText = `
            position: fixed; top: 20px; right: 20px; background: #ef4444; color: white;
            padding: 1rem 1.5rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000; max-width: 320px; animation: slideIn 0.3s ease-out;
        `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  },

  incrementStat(category) {
    if (this.stats.hasOwnProperty(category)) {
      this.stats[category]++;
      if (
        ["rumahSakit", "puskesmas", "klinik", "posyandu"].includes(category)
      ) {
        this.stats.totalHealth++;
      }
    }
    this.stats.total++;
  },

  updateStatsDisplay(areaText) {
    const elements = {
      "stat-sd": this.stats.sd,
      "stat-smp": this.stats.smp,
      "stat-sma": this.stats.sma,
      "stat-univ": this.stats.universitas,
      "stat-rs": this.stats.rumahSakit,
      "stat-puskesmas": this.stats.puskesmas,
      "stat-klinik": this.stats.klinik,
      "stat-posyandu": this.stats.posyandu,
      "total-schools": this.stats.total - this.stats.totalHealth,
      "total-health": this.stats.totalHealth,
    };

    Object.keys(elements).forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.textContent = elements[id];
    });

    if (areaText) {
      const locElement = document.getElementById("total-locations");
      if (locElement) locElement.innerText = areaText;
    }
    this.updateProgressBars();
  },

  startRealtimeClock() {
    const clockElement = document.getElementById("realtime-clock");
    if (!clockElement) return;
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      clockElement.innerText = timeString + " WIB";
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  updateProgressBars() {
    const totalSchools =
      this.stats.sd +
        this.stats.smp +
        this.stats.sma +
        this.stats.universitas || 1;
    const schoolPercentages = {
      sd: (this.stats.sd / totalSchools) * 100,
      smp: (this.stats.smp / totalSchools) * 100,
      sma: (this.stats.sma / totalSchools) * 100,
      univ: (this.stats.universitas / totalSchools) * 100,
    };
    this.setProgressBar("bar-sd", schoolPercentages.sd);
    this.setProgressBar("bar-smp", schoolPercentages.smp);
    this.setProgressBar("bar-sma", schoolPercentages.sma);
    this.setProgressBar("bar-univ", schoolPercentages.univ);
  },

  setProgressBar(id, percentage) {
    const bar = document.getElementById(id);
    if (bar) bar.style.width = `${Math.round(percentage)}%`;
  },

  animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.innerHTML = Math.floor(progress * (end - start) + start);
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  },

  initInfoPanel() {
    const panel = document.getElementById("info-panel");
    const closeBtn = document.getElementById("close-sidebar");
    const dashboardBtn = document.getElementById("nav-dashboard-btn");
    const aboutBtn = document.getElementById("nav-about-btn");
    const themeBtn = document.getElementById("theme-toggle");

    if (closeBtn && panel) {
      closeBtn.addEventListener("click", () => {
        if (window.innerWidth > 768) panel.classList.add("collapsed");
        else panel.classList.remove("active");
      });
    }

    if (dashboardBtn) {
      dashboardBtn.addEventListener("click", () => {
        if (typeof DashboardUI !== "undefined") {
          DashboardUI.open();
        } else {
          console.error("DashboardUI not loaded");
        }
      });
    }

    const mapBtns = document.querySelectorAll('[data-target="map"]');
    mapBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.startExploration(false);
        if (panel) panel.classList.add("collapsed");
        if (window.innerWidth <= 768) panel.classList.remove("active");
        document
          .querySelectorAll(".glass-modal")
          .forEach((m) => m.classList.add("hidden"));
        this.updateNavState("map");
      });
    });

    if (aboutBtn) {
      aboutBtn.addEventListener("click", () => {
        this.toggleModal("modal-about");
        this.updateNavState("about");
      });
    }

    if (themeBtn) {
      themeBtn.addEventListener("click", () => this.toggleTheme());
    }

    this.initTheme();

    const homeBtns = document.querySelectorAll('[data-target="home"]');
    homeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (panel) panel.classList.add("collapsed");
        document
          .querySelectorAll(".glass-modal")
          .forEach((m) => m.classList.add("hidden"));
        const landing = document.getElementById("landing-page");
        if (landing) landing.classList.add("active");
        document.body.classList.add("mode-landing");
        this.updateNavState("home");
      });
    });
  },

  startExploration(openDashboard = false) {
    const landing = document.getElementById("landing-page");
    if (landing) landing.classList.remove("active");
    document.body.classList.remove("mode-landing");

    if (openDashboard) {
      if (typeof DashboardUI !== "undefined") DashboardUI.open();
    }
  },

  switchTab(btn, tabId) {
    let container = btn.closest(".info-section");
    let btnSelector = ".tab-btn";

    if (!container) {
      container = btn.closest(".landing-container");
      btnSelector = ".tab-pill";
    }

    if (!container) return;

    container
      .querySelectorAll(btnSelector)
      .forEach((b) => b.classList.remove("active"));

    const allContents = document.querySelectorAll(".tab-content");
    allContents.forEach((c) => {
      if (
        container.contains(c) ||
        (container.classList.contains("landing-container") &&
          document.querySelector(".landing-tab-contents").contains(c))
      ) {
        c.classList.remove("active");
      }
    });

    btn.classList.add("active");
    const tabContent = document.getElementById(tabId);
    if (tabContent) tabContent.classList.add("active");
  },

  navigateToLandingTab(tabId) {
    const btn = document.querySelector(
      `.landing-tabs-nav button[onclick*="${tabId}"]`
    );
    if (btn) btn.click();
  },

  updateNavState(target) {
    document
      .querySelectorAll(".nav-link")
      .forEach((btn) => btn.classList.remove("active"));
    const activeBtn =
      document.querySelector(`[data-target="${target}"]`) ||
      document.getElementById(`nav-${target}-btn`);
    if (activeBtn) activeBtn.classList.add("active");
  },

  toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (modal.classList.contains("hidden")) modal.classList.remove("hidden");
      else modal.classList.add("hidden");
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeIcon(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const newTheme = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    this.updateThemeIcon(newTheme);
  },

  updateThemeIcon(theme) {
    const icon = document.getElementById("theme-icon");
    if (icon) {
      icon.className =
        theme === "dark" ? "ph-duotone ph-sun" : "ph-duotone ph-moon-stars";
    }
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = UIUtils;
}
