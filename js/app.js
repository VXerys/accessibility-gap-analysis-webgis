(function () {
  "use strict";

  function hideSplashScreen() {
    const splash = document.getElementById("splash-screen");
    if (splash) {
      setTimeout(() => {
        splash.classList.add("hidden");
        const landing = document.getElementById("landing-page");
        if (landing) {
          landing.classList.add("active");
          document.body.classList.add("mode-landing");
        }
        setTimeout(() => {
          splash.style.display = "none";
        }, 800);
      }, 1500);
    }
  }

  function initApp() {
    try {
      UIUtils.initInfoPanel();
      UIUtils.startRealtimeClock();
      window.map = MapInitializer.init();

      if (typeof AnalysisUtils !== "undefined") {
        AnalysisUtils.init(window.map);
      }

      if (typeof PolicePatrolSimulation !== "undefined") {
        PolicePatrolSimulation.init(window.map);
      }

      if (typeof ChatAssistant !== "undefined") {
        ChatAssistant.init(window.map);
      }

      setTimeout(() => {
        UIUtils.updateStatsDisplay();
      }, 1500);

      const panel = document.getElementById("info-panel");
      if (panel) panel.classList.add("collapsed");

      if (UIUtils.updateNavState) UIUtils.updateNavState("home");

      hideSplashScreen();
    } catch (error) {
      console.error("Application initialization failed:", error);
      UIUtils.showError("Gagal menginisialisasi aplikasi.");
      hideSplashScreen();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
