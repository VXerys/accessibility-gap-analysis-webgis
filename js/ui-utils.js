/**
 * UI Utilities
 * Handles loading states and error messages
 */

const UIUtils = {
    /**
     * Statistics counter
     */
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
        totalHealth: 0
    },

    /**
     * Show loading indicator
     */
    showLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('show');
        }
    },

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('show');
        }
    },

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<strong>Error:</strong> ${message}`;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 320px;
            font-family: 'Poppins', sans-serif;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (errorDiv.parentNode) {
                        errorDiv.parentNode.removeChild(errorDiv);
                    }
                }, 300);
            }
        }, 5000);
    },

    /**
     * Update statistics counter
     * @param {string} category - Category name (sd, smp, sma, universitas, rumahSakit, puskesmas, klinik, posyandu)
     */
    incrementStat(category) {
        if (this.stats.hasOwnProperty(category)) {
            this.stats[category]++;
            
            // Update total health facilities counter
            if (['rumahSakit', 'puskesmas', 'klinik', 'posyandu'].includes(category)) {
                this.stats.totalHealth++;
            }
        }
        this.stats.total++;
    },

    /**
     * Update statistics display in UI
     */
    updateStatsDisplay() {
        const elements = {
            'stat-sd': this.stats.sd,
            'stat-smp': this.stats.smp,
            'stat-sma': this.stats.sma,
            'stat-univ': this.stats.universitas,
            'stat-rs': this.stats.rumahSakit,
            'stat-puskesmas': this.stats.puskesmas,
            'stat-klinik': this.stats.klinik,
            'stat-posyandu': this.stats.posyandu,
            'total-schools': this.stats.total - this.stats.totalHealth,
            'total-health': this.stats.totalHealth,
            'total-locations': 1 // Kecamatan Gunung Puyuh
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.animateNumber(element, 0, elements[id], 1000);
            }
        });

        // Update progress bars after animation
        setTimeout(() => {
            this.updateProgressBars();
        }, 500);
    },

    /**
     * Update progress bars based on statistics
     */
    updateProgressBars() {
        const totalSchools = this.stats.sd + this.stats.smp + this.stats.sma + this.stats.universitas || 1;
        const totalHealth = this.stats.totalHealth || 1;
        
        // School percentages
        const schoolPercentages = {
            sd: (this.stats.sd / totalSchools) * 100,
            smp: (this.stats.smp / totalSchools) * 100,
            sma: (this.stats.sma / totalSchools) * 100,
            univ: (this.stats.universitas / totalSchools) * 100
        };

        // Health percentages
        const healthPercentages = {
            rs: (this.stats.rumahSakit / totalHealth) * 100,
            puskesmas: (this.stats.puskesmas / totalHealth) * 100,
            klinik: (this.stats.klinik / totalHealth) * 100,
            posyandu: (this.stats.posyandu / totalHealth) * 100
        };

        // Animate school progress bars
        this.setProgressBar('bar-sd', schoolPercentages.sd);
        this.setProgressBar('bar-smp', schoolPercentages.smp);
        this.setProgressBar('bar-sma', schoolPercentages.sma);
        this.setProgressBar('bar-univ', schoolPercentages.univ);

        // Animate health progress bars
        this.setProgressBar('bar-rs', healthPercentages.rs);
        this.setProgressBar('bar-puskesmas', healthPercentages.puskesmas);
        this.setProgressBar('bar-klinik', healthPercentages.klinik);
        this.setProgressBar('bar-posyandu', healthPercentages.posyandu);
    },

    /**
     * Set progress bar width with animation
     * @param {string} id - Progress bar element ID
     * @param {number} percentage - Percentage width (0-100)
     */
    setProgressBar(id, percentage) {
        const bar = document.getElementById(id);
        if (bar) {
            bar.style.width = `${Math.round(percentage)}%`;
        }
    },

    /**
     * Animate number counter
     * @param {HTMLElement} element - Target element
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    animateNumber(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = this.easeOutQuad(progress);
            const current = Math.floor(start + difference * easeProgress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = end;
            }
        };

        requestAnimationFrame(step);
    },

    /**
     * Easing function for smooth animation
     * @param {number} t - Progress (0 to 1)
     * @returns {number} Eased value
     */
    easeOutQuad(t) {
        return t * (2 - t);
    },

    /**
     * Initialize info panel toggle
     */
    initInfoPanel() {
        const toggle = document.getElementById('info-toggle');
        const panel = document.getElementById('info-panel');

        if (toggle && panel) {
            toggle.addEventListener('click', () => {
                panel.classList.toggle('active');
            });
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIUtils;
}