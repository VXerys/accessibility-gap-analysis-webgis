(function () {
    'use strict';

    function hideSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            setTimeout(() => {
                splash.classList.add('hidden');
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 500);
            }, 1500);
        }
    }

    function initApp() {
        try {
            UIUtils.initInfoPanel();

            UIUtils.startRealtimeClock();

            const map = MapInitializer.init();

            if (typeof AnalysisUtils !== 'undefined') {
                AnalysisUtils.init(map);
            }

            if (typeof PolicePatrolSimulation !== 'undefined') {
                PolicePatrolSimulation.init(map);
            }

            if (typeof ChatAssistant !== 'undefined') {
                ChatAssistant.init(map);
            }

            setTimeout(() => {
                UIUtils.updateStatsDisplay();
            }, 1500);

            hideSplashScreen();
        } catch (error) {
            console.error('Application initialization failed:', error);
            UIUtils.showError('Gagal menginisialisasi aplikasi.');
            hideSplashScreen();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();