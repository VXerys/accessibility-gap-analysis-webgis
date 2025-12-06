/**
 * Routing Service Module
 * Menghitung rute, waktu tempuh, dan isochrone menggunakan OpenRouteService API
 */

const RoutingService = {
  // 🔴 PENTING: Masukkan API Key OpenRouteService kamu di sini
  // Jangan lupa tanda kutip ('...')
  apiKey:
    "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjhiN2JkMWRhZDIyZTQ5OTI4NjFmNjk0NzgwMTA3MmQ4IiwiaCI6Im11cm11cjY0In0=",

  baseUrl: "https://api.openrouteservice.org/v2",

  /**
   * Hitung rute dan waktu tempuh antar dua titik
   * @param {Array} start - [lng, lat]
   * @param {Array} end - [lng, lat]
   * @param {string} profile - 'driving-car', 'cycling-regular', 'foot-walking'
   */
  async getRoute(start, end, profile = "driving-car") {
    try {
      const response = await fetch(
        `${this.baseUrl}/directions/${profile}/geojson`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: this.apiKey,
          },
          body: JSON.stringify({
            coordinates: [start, end],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Detail:", errorData);
        throw new Error("Gagal mengambil data rute (Cek Quota/Key)");
      }

      return await response.json();
    } catch (error) {
      console.error("Routing Error:", error);
      throw error;
    }
  },

  /**
   * Ambil data Isochrone (Area Layanan)
   * Mendukung mode Waktu (time) dan Jarak (distance)
   * * @param {Array} center - [lng, lat]
   * @param {string} profile - Mode transportasi
   * @param {Array} range - Array rentang (detik atau meter)
   * @param {string} rangeType - 'time' (default) atau 'distance'
   */
  async getIsochrones(
    center,
    profile = "driving-car",
    range = [300, 600, 900],
    rangeType = "time"
  ) {
    try {
      const response = await fetch(`${this.baseUrl}/isochrones/${profile}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: this.apiKey,
        },
        body: JSON.stringify({
          locations: [center],
          range: range,
          range_type: rangeType, // 'time' atau 'distance'
          area_units: "m", // Satuan output area selalu meter persegi
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Detail:", errorData);
        throw new Error("Gagal mengambil data isochrone");
      }

      return await response.json();
    } catch (error) {
      console.error("Isochrone Error:", error);
      throw error;
    }
  },

  /**
   * Helper: Tentukan warna berdasarkan durasi waktu (Traffic Light System)
   * Digunakan untuk pewarnaan rute
   */
  getTimeColor(durationSeconds) {
    const minutes = Math.round(durationSeconds / 60);

    // Logika Skala Lokal (Kecamatan/Kota)
    if (minutes <= 10) return "#28a745"; // Hijau (Sangat Dekat)
    if (minutes <= 30) return "#ffc107"; // Kuning (Menengah)
    return "#dc3545"; // Merah (Jauh)
  },
};

// Export module agar bisa diakses oleh file lain
if (typeof module !== "undefined" && module.exports) {
  module.exports = RoutingService;
}
