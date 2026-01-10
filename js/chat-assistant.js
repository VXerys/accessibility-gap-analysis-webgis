const ChatAssistant = {
  init(map) {
    this.map = map;
    ChatEngine.setMap(map);
    ChatUI.render();
    this.bindEvents();
    console.log("Chat AI Assistant Initialized");
  },

  bindEvents() {
    const chatBtn = document.getElementById("chat-btn");
    const closeBtn = document.getElementById("close-chat");
    const chatWindow = document.getElementById("chat-window");
    const sendBtn = document.getElementById("send-btn");
    const input = document.getElementById("chat-input");

    if (chatBtn && chatWindow) {
      chatBtn.addEventListener("click", () =>
        chatWindow.classList.add("active")
      );
    }

    if (closeBtn && chatWindow) {
      closeBtn.addEventListener("click", () => {
        chatWindow.classList.remove("active");
        ChatEngine.clearPredictionZones();
        ChatEngine.clearInteractiveMarkers();
        if (
          typeof AnalysisUtils !== "undefined" &&
          AnalysisUtils.clearAnalysisLayers
        ) {
          AnalysisUtils.clearAnalysisLayers();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.handleSend());
    }

    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.handleSend();
      });
    }

    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "save-api-key-btn") {
        this.saveApiKey();
      }
    });
  },

  saveApiKey() {
    const input = document.getElementById("user-api-key-input");
    if (input && input.value.trim()) {
      ChatEngine.setApiKey(input.value.trim());
      const btn = document.getElementById("save-api-key-btn");
      if (btn) {
        btn.textContent = "Tersimpan!";
        btn.disabled = true;
        btn.style.backgroundColor = "#10b981";
      }
      ChatUI.addMessage(
        "✅ API Key berhasil disimpan. Silahkan kirim pesan Anda kembali.",
        "ai"
      );
    }
  },

  async handleSend() {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();
    if (!message) return;

    ChatUI.addMessage(message, "user");
    input.value = "";

    ChatEngine.clearPredictionZones();
    ChatEngine.clearInteractiveMarkers();
    if (
      typeof AnalysisUtils !== "undefined" &&
      AnalysisUtils.clearAnalysisLayers
    ) {
      AnalysisUtils.clearAnalysisLayers();
    }

    let systemInjection = "";

    const distanceMatch = message.match(
      /(?:ukur|cek|lihat)?\s*jarak\s*(?:antara|dari)?\s+(.+?)\s+(?:ke|dengan|dan|sampai)\s+(.+)/i
    );

    if (distanceMatch) {
      const locA = ChatEngine.findFacilityByName(distanceMatch[1].trim());
      const locB = ChatEngine.findFacilityByName(distanceMatch[2].trim());

      if (locA && locB) {
        ChatUI.showTyping(true);
        if (AnalysisUtils.setMode) AnalysisUtils.setMode("distance");

        const latlngA = [
          locA.geometry.coordinates[1],
          locA.geometry.coordinates[0],
        ];
        const latlngB = [
          locB.geometry.coordinates[1],
          locB.geometry.coordinates[0],
        ];

        await AnalysisUtils.measureDistance(
          [latlngA[1], latlngA[0]],
          L.latLng(latlngA[0], latlngA[1])
        );
        await AnalysisUtils.measureDistance(
          [latlngB[1], latlngB[0]],
          L.latLng(latlngB[0], latlngB[1])
        );

        const bounds = L.latLngBounds([latlngA, latlngB]);
        this.map.flyToBounds(bounds.pad(0.3), { duration: 1.5 });

        const distMeters = L.latLng(latlngA[0], latlngA[1]).distanceTo(
          L.latLng(latlngB[0], latlngB[1])
        );
        const distText =
          distMeters > 1000
            ? (distMeters / 1000).toFixed(2) + " km"
            : Math.round(distMeters) + " meter";

        systemInjection = `[SYSTEM ACTION]: Saya sudah melakukan pengukuran otomatis antara "${distanceMatch[1].trim()}" dan "${distanceMatch[2].trim()}". Jarak lurus: ${distText}. Tugas: Jawab user dengan jarak tersebut.`;
      }
    }

    const isoMatch = message.match(
      /(?:jangkauan|akses|radius|area layanan|buffer)\s+(?:dari|di|sekitar)?\s*(.+)/i
    );
    const isBuffer = /buffer|radius|area layanan/i.test(message);

    if (isoMatch && !distanceMatch) {
      const locName = isoMatch[1]
        .replace(/waktu|menit|jalan kaki/gi, "")
        .trim();
      const loc = ChatEngine.findFacilityByName(locName);

      if (loc) {
        ChatUI.showTyping(true);
        const mode = isBuffer ? "buffer" : "isochrone";
        if (AnalysisUtils.setMode) AnalysisUtils.setMode(mode);

        const latlng = L.latLng(
          loc.geometry.coordinates[1],
          loc.geometry.coordinates[0]
        );
        const point = [
          loc.geometry.coordinates[0],
          loc.geometry.coordinates[1],
        ];

        if (isBuffer)
          AnalysisUtils.runIsochroneLogic(point, latlng, "distance");
        else AnalysisUtils.runIsochroneLogic(point, latlng, "time");

        this.map.flyTo(latlng, 15, { duration: 1.5 });
        systemInjection = `[SYSTEM ACTION]: Analisis ${
          isBuffer ? "Buffer" : "Isochrone"
        } dijalankan untuk "${locName}". Hasil visual di peta.`;
      }
    }

    const nearMatch = message.match(
      /(?:fasilitas|sekolah|rs|puskesmas)\s+(?:terdekat|dekat)\s+(?:dari|di)?\s*(.+)/i
    );
    if (nearMatch && !distanceMatch) {
      const locName = nearMatch[1].trim();
      const loc = ChatEngine.findFacilityByName(locName);

      if (loc) {
        ChatUI.showTyping(true);
        if (AnalysisUtils.setMode) AnalysisUtils.setMode("nearest");
        const latlng = L.latLng(
          loc.geometry.coordinates[1],
          loc.geometry.coordinates[0]
        );
        const point = [
          loc.geometry.coordinates[0],
          loc.geometry.coordinates[1],
        ];

        AnalysisUtils.findNearestFacility(point, latlng);
        this.map.flyTo(latlng, 16, { duration: 1.5 });
        systemInjection = `[SYSTEM ACTION]: Fasilitas terdekat dari "${locName}" telah dicari. Rute ditampilkan di peta.`;
      }
    }

    const layerResponse = ChatEngine.handleLayerControl(message);
    if (layerResponse) {
      ChatUI.addMessage(layerResponse, "ai");
      ChatUI.showTyping(false);
      return;
    }

    const isPredictionQuery =
      /(prediksi|potensi|prospek|akan|masa depan|future|zona)/i.test(message) &&
      /(penduduk|wilayah|padat|ramai|pemukiman|huni)/i.test(message);

    const intents = [
      {
        regex: /(jarak|ukur|jauh)/i,
        btnId: "distance-btn",
        mode: "distance",
        tool: "Ukur Jarak",
      },
      {
        regex: /(top|terbanyak|ranking)/i,
        btnId: "topN-btn",
        mode: "topN",
        autoRun: true,
        tool: "Top 5",
      },
      {
        regex: /(terdekat|dekat|cari)/i,
        btnId: "nearest-btn",
        mode: "nearest",
        autoRun: true,
        tool: "Nearest",
      },
      {
        regex: /(jangkauan|waktu|iso)/i,
        btnId: "isochrone-btn",
        mode: "isochrone",
        tool: "Isochrone",
      },
      {
        regex: /(service|area|buffer)/i,
        btnId: "iso-btn",
        mode: "buffer",
        tool: "Buffer",
      },
      {
        regex: /(gap|kesenjangan)/i,
        btnId: "gap-btn",
        mode: "gap",
        autoRun: true,
        tool: "Gap Analysis",
      },
      {
        regex: /(banding|komparasi)/i,
        btnId: "compare-btn",
        mode: "compare",
        tool: "Compare",
      },
      {
        regex: /(hapus|reset|clear)/i,
        btnId: "clear-analysis",
        mode: null,
        tool: "Reset",
      },
    ];

    if (isPredictionQuery) {
      const zoneNames = ChatEngine.showPredictionZones();
      systemInjection = `[SYSTEM EVENT]: Visualisasi prediksi ditampilkan di 3 lokasi: ${zoneNames}. Jelaskan potensi kepadatan.`;
    } else {
      for (const intent of intents) {
        if (intent.regex.test(message)) {
          if (intent.mode) {
            if (AnalysisUtils.setMode) AnalysisUtils.setMode(intent.mode);
          } else if (intent.btnId === "clear-analysis") {
            if (AnalysisUtils.clearAnalysis) AnalysisUtils.clearAnalysis();
          }

          let shouldRun = intent.autoRun;
          if (systemInjection) shouldRun = false;

          if (shouldRun && this.map) {
            const center = this.map.getCenter();
            const point = [center.lng, center.lat];
            setTimeout(() => {
              if (intent.mode === "topN" && AnalysisUtils.findTop5Hotspots)
                AnalysisUtils.findTop5Hotspots(point, center);
              if (
                intent.mode === "nearest" &&
                AnalysisUtils.findNearestFacility
              )
                AnalysisUtils.findNearestFacility(point, center);
              if (intent.mode === "gap" && AnalysisUtils.gapAnalysis)
                AnalysisUtils.gapAnalysis(point, center);
            }, 500);

            if (intent.mode === "topN")
              systemInjection = `[SYSTEM]: Top 5 dijalankan. Fokus ranking & juara. Jangan prediksi.`;
            else if (intent.mode === "gap")
              systemInjection = `[SYSTEM]: Gap Analysis dijalankan. Fokus underserved & blank spot.`;
            else
              systemInjection = `[SYSTEM]: Tool ${intent.tool} aktif di tengah peta.`;
          }
          break;
        }
      }
    }

    if (!ChatEngine.getApiKey()) {
      ChatUI.showApiKeyPrompt();
      return;
    }

    ChatUI.showTyping(true);

    try {
      const context = ChatEngine.gatherContext() + systemInjection;
      const rawResponse = await ChatEngine.callGroqAPI(message, context);
      const { text, location, command } =
        ChatEngine.processAIResponse(rawResponse);

      ChatUI.addMessage(text, "ai");

      if (command === "PREDICTION") ChatEngine.showPredictionZones();

      if (location && this.map) {
        const facility = ChatEngine.findFacilityByName(location);
        if (facility) {
          const [lng, lat] = facility.geometry.coordinates;
          this.map.flyTo([lat, lng], 17, { duration: 1.5 });
          const marker = L.circleMarker([lat, lng], {
            radius: 20,
            color: "#ef4444",
            fill: false,
            weight: 4,
            dashArray: "5,5",
          })
            .addTo(this.map)
            .bindPopup(text)
            .openPopup();
          ChatEngine.activeMarkers.push(marker);
        }
      }
    } catch (error) {
      console.error(error);
      ChatUI.addMessage(`⚠️ Error: ${error.message}`, "ai");
    } finally {
      ChatUI.showTyping(false);
    }
  },
};
