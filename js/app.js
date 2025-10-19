/**
 * Main Application Entry Point
 * Initializes the map application when DOM is ready
 */

(function() {
    'use strict';

    /**
     * Initialize the application
     */
    function initApp() {
        try {
            // Initialize info panel toggle
            UIUtils.initInfoPanel();
            
            // Initialize map
            MapInitializer.init();
            
            // Update statistics display after a short delay
            // to allow data loading to complete
            setTimeout(() => {
                UIUtils.updateStatsDisplay();
            }, 1500);
        } catch (error) {
            console.error('Application initialization failed:', error);
            UIUtils.showError('Gagal menginisialisasi aplikasi.');
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
