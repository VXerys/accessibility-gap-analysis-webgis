const RoutingService = {
  apiKey: window.ENV && window.ENV.ORS_API_KEY ? window.ENV.ORS_API_KEY : "",
  baseUrl: "https://api.openrouteservice.org/v2",

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
          range_type: rangeType,
          area_units: "m",
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

  getTimeColor(durationSeconds) {
    const minutes = Math.round(durationSeconds / 60);
    if (minutes <= 10) return "#28a745";
    if (minutes <= 30) return "#ffc107";
    return "#dc3545";
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = RoutingService;
}
