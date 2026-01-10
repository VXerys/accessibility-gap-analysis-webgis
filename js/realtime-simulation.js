const PolicePatrolSimulation = {
  state: {
    active: true,
    cars: [],
    animationFrameId: null,
    loading: true,
  },

  init(map) {
    this.map = map;
    if (!this.map) return;

    console.log("👮 Police Patrol (Smart Mode) Initialized");

    this.createStatusWidget("Menghubungkan ke Satelit Polisi...", "orange");

    this.initializePatrolUnits();
  },

  async initializePatrolUnits() {
    const waypoints1 = [
      [-6.90767, 106.92025],
      [-6.908, 106.914],
      [-6.911, 106.915],
      [-6.91, 106.918],
      [-6.90767, 106.92025],
    ];

    const waypoints2 = [
      [-6.90767, 106.92025],
      [-6.906, 106.925],
      [-6.909, 106.927],
      [-6.911, 106.923],
      [-6.90767, 106.92025],
    ];

    const waypoints3 = [
      [-6.90767, 106.92025],
      [-6.902, 106.92],
      [-6.9, 106.922],
      [-6.904, 106.923],
      [-6.90767, 106.92025],
    ];

    try {
      const [path1, path2, path3] = await Promise.all([
        this.calculateFullLoop(waypoints1),
        this.calculateFullLoop(waypoints2),
        this.calculateFullLoop(waypoints3),
      ]);

      this.createCar(0, path1, "Unit Pusat", "0811-1234-5678");
      this.createCar(1, path2, "Unit Utara", "0812-9876-5432");
      this.createCar(2, path3, "Unit Selatan", "0813-5555-8888");

      this.state.loading = false;
      this.updateStatusWidget("Patroli Aktif: 3 Unit", "#1e40af");

      this.startAnimation();
    } catch (e) {
      console.error("Gagal load rute patroli:", e);
      this.updateStatusWidget("Gagal memuat jalur patroli", "red");
    }
  },

  async calculateFullLoop(waypoints) {
    let fullPath = [];
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      const startCoord = [start[1], start[0]];
      const endCoord = [end[1], end[0]];

      try {
        const geojson = await RoutingService.getRoute(
          startCoord,
          endCoord,
          "driving-car"
        );
        if (geojson && geojson.features && geojson.features.length > 0) {
          const segmentCoords = geojson.features[0].geometry.coordinates;
          const leafletCoords = segmentCoords.map((c) => [c[1], c[0]]);
          fullPath = fullPath.concat(leafletCoords);
        }
      } catch (err) {
        console.warn("Segment skip:", err);
        fullPath.push(start, end);
      }
    }
    return fullPath;
  },

  createCar(id, path, label, phoneNumber) {
    if (!path || path.length === 0) return;

    const policeIcon = L.divIcon({
      className: "police-car-icon",
      html: `<div style="font-size:24px; filter:drop-shadow(2px 2px 2px rgba(0,0,0,0.3)); transform: scaleX(-1);">🚓</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const marker = L.marker(path[0], {
      icon: policeIcon,
      zIndexOffset: 1000,
    }).addTo(this.map);

    marker.bindPopup(`
      <div style="text-align:center;">
        <strong style="font-size:14px; color:#1e40af;">${label}</strong><br>
        <span style="font-size:12px; color:#475569;">Status: Patroli Rutin</span><br>
        <span style="font-size:12px; font-weight:600; color:#10b981;">📞 ${phoneNumber}</span>
      </div>
    `);

    this.state.cars.push({
      id: id,
      marker: marker,
      pathCoords: path,
      currentIndex: 0,
      progress: 0,
    });
  },

  startAnimation() {
    const SPEED_FACTOR = 0.002;

    const animate = () => {
      if (!this.state.active) return;

      this.state.cars.forEach((car) => {
        this.moveCarSmoothly(car, SPEED_FACTOR);
      });

      this.state.animationFrameId = requestAnimationFrame(animate);
    };
    this.state.animationFrameId = requestAnimationFrame(animate);
  },

  moveCarSmoothly(car, speed) {
    const path = car.pathCoords;
    const currentIdx = car.currentIndex;
    const nextIdx = (currentIdx + 1) % path.length;

    const p1 = path[currentIdx];
    const p2 = path[nextIdx];

    car.progress += speed;

    if (car.progress >= 1.0) {
      car.progress = 0;
      car.currentIndex = nextIdx;
      car.marker.setLatLng(p2);
    } else {
      const lat = p1[0] + (p2[0] - p1[0]) * car.progress;
      const lng = p1[1] + (p2[1] - p1[1]) * car.progress;
      car.marker.setLatLng([lat, lng]);
    }
  },

  createStatusWidget(text, color) {
    let widget = document.getElementById("police-widget");
    if (!widget) {
      widget = document.createElement("div");
      widget.id = "police-widget";
      widget.className = "police-widget-container"; // Use CSS class

      const mapWrapper = document.querySelector(".map-wrapper");
      const container = mapWrapper || document.body;
      container.appendChild(widget);
    }

    this.updateWidgetContent(widget, text, color);
  },

  updateStatusWidget(text, color) {
    const widget = document.getElementById("police-widget");
    if (widget) {
      this.updateWidgetContent(widget, text, color);
    }
  },

  updateWidgetContent(widget, text, color) {
    const statusClass = this.state.loading ? "status-loading" : "status-active";
    const statusText = this.state.loading
      ? "Mengontak Satelit..."
      : "Monitoring Aktif";

    widget.innerHTML = `
            <div class="pw-icon-box">
                <div class="pw-icon">🚓</div>
            </div>
            <div class="pw-content">
                <div class="pw-title">${text}</div>
                <div class="pw-subtitle">
                    <span class="pw-dot ${statusClass}"></span>
                    ${statusText}
                </div>
            </div>
        `;
  },
};
