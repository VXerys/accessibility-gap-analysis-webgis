/**
 * Popup Utilities
 * Handles creation and styling of popup content
 */

const PopupUtils = {
    /**
     * Generate popup content based on feature properties and data source
     * @param {Object} props - Feature properties
     * @param {string} dataSource - Source of data ('map' or 'school')
     * @returns {Object} Object containing popupContent and category
     */
    generatePopupContent(props, dataSource) {
        let popupContent = '';
        let category = null;

        if (dataSource === 'map') {
            if (props.BatasKecamatan) {
                popupContent = this.createPopupHTML('📍 Batas Kecamatan', props.BatasKecamatan, '#ff7800');
                category = 'batasKecamatan';
            } else if (props.SDN || (props['SDN '] && props['SDN '].trim() !== '')) {
                const nama = props.SDN || props['SDN '];
                popupContent = this.createPopupHTML('🏫 Sekolah Dasar Negeri', nama, '#0066cc');
                category = 'sdn';
            }
        }

        if (dataSource === 'school') {
            if (props.SDN || (props['SDN '] && props['SDN '].trim() !== '')) {
                const nama = props.SDN || props['SDN '];
                popupContent = this.createPopupHTML('🏫 Sekolah Dasar', nama, '#0066cc');
                category = 'sdn';
            } else if (props.SDIT) {
                popupContent = this.createPopupHTML('🏫 SDIT', props.SDIT, '#0066cc');
                category = 'sdn';
            } else if (props.SMPN || props.SMP || (props['SMP '] && props['SMP '].trim() !== '')) {
                const nama = props.SMPN || props.SMP || props['SMP '];
                popupContent = this.createPopupHTML('🏫 Sekolah Menengah Pertama', nama, '#28a745');
                category = 'smp';
            } else if (props.SMAN || props.SMK || (props['SMAN '] && props['SMAN '].trim() !== '')) {
                const nama = props.SMAN || props.SMK || props['SMAN '];
                const jenis = props.SMAN || props['SMAN '] ? 'SMA' : 'SMK';
                popupContent = this.createPopupHTML(`🏫 ${jenis}`, nama, '#dc3545');
                category = 'sma';
            } else if (props.Universitas || (props['Universitas '] && props['Universitas '].trim() !== '')) {
                const nama = props.Universitas || props['Universitas '];
                popupContent = this.createPopupHTML('🎓 Universitas', nama, '#6f42c1');
                category = 'universitas';
            } else if (props.Madrasah) {
                popupContent = this.createPopupHTML('🕌 Madrasah', props.Madrasah, '#fd7e14');
                category = 'lainnya';
            }
        }

        return { popupContent, category };
    },

    /**
     * Create formatted popup HTML
     * @param {string} title - Popup title
     * @param {string} content - Popup content
     * @param {string} color - Title color
     * @returns {string} HTML string for popup
     */
    createPopupHTML(title, content, color) {
        return `
            <div style="padding: 5px;">
                <strong style="color: ${color}; font-size: 14px;">${title}</strong><br>
                <span style="font-size: 13px;">${content}</span>
            </div>
        `;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PopupUtils;
}
