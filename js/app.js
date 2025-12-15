/**
 * Main Application Entry Point
 * Initializes the map application when DOM is ready
 */

(function() {
    'use strict';

    /**
     * Hide splash screen after loading
     */
    function hideSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            // Add hidden class after 1.5 seconds
            setTimeout(() => {
                splash.classList.add('hidden');
                // Remove from DOM after fade animation completes
                setTimeout(() => {
                    splash.style.display = 'none';
                }, 500); // Match the CSS transition duration
            }, 1500);
        }
    }

    /**
     * Initialize the application
     */
    function initApp() {
        try {
            // Initialize info panel toggle
            UIUtils.initInfoPanel();
            
            // Initialize map
            const map = MapInitializer.init();
            
            // Initialize analysis module
            if (typeof AnalysisUtils !== 'undefined') {
                AnalysisUtils.init(map);
            }

            // Initialize Realtime Simulation (Ambulance)
            if (typeof AmbulanceSimulation !== 'undefined') {
                AmbulanceSimulation.init(map);
            }
            
            // Update statistics display after a short delay
            // to allow data loading to complete
            setTimeout(() => {
                UIUtils.updateStatsDisplay();
            }, 1500);

            // Hide splash screen
            hideSplashScreen();
        } catch (error) {
            console.error('Application initialization failed:', error);
            UIUtils.showError('Gagal menginisialisasi aplikasi.');
            // Hide splash even if there's an error
            hideSplashScreen();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        // DOM already loaded
        initApp();
    }

})();