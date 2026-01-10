const ChatEngine = {
  apiKey:
    window.ENV && window.ENV.GROQ_API_KEY
      ? window.ENV.GROQ_API_KEY
      : localStorage.getItem("groq_api_key") || "",
  apiUrl: "https://api.groq.com/openai/v1/chat/completions",
  predictionLayers: [],
  activeMarkers: [],

  setMap(map) {
    this.map = map;
  },

  getApiKey() {
    return this.apiKey;
  },

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem("groq_api_key", key);
  },

  showPredictionZones() {
    this.clearPredictionZones();
    const zones = [
      {
        lat: -6.9015,
        lng: 106.925,
        r: 250,
        label: "Zona Utara (Karangtengah)",
        desc: "Pertumbuhan perumahan baru & akses Pasar",
      },
      {
        lat: -6.912,
        lng: 106.915,
        r: 300,
        label: "Zona Tengah (Gunungpuyuh)",
        desc: "Pusat pendidikan & perkantoran",
      },
      {
        lat: -6.918,
        lng: 106.92,
        r: 200,
        label: "Zona Selatan (Sriwedari)",
        desc: "Ekspansi hunian & akses jalan lingkar",
      },
    ];

    zones.forEach((z) => {
      const circle = L.circle([z.lat, z.lng], {
        color: "#f43f5e",
        fillColor: "#f43f5e",
        fillOpacity: 0.3,
        radius: 0,
        weight: 2,
        dashArray: "5, 5",
      }).addTo(this.map);

      let currentR = 0;
      const animate = () => {
        if (currentR < z.r) {
          currentR += 10;
          circle.setRadius(currentR);
          requestAnimationFrame(animate);
        }
      };
      animate();

      circle.bindPopup(`<strong>🔮 Prediksi: ${z.label}</strong><br>${z.desc}`);
      this.predictionLayers.push(circle);
    });

    const group = L.featureGroup(this.predictionLayers);
    this.map.flyToBounds(group.getBounds().pad(0.2), { duration: 1.5 });

    return zones.map((z) => z.label).join(", ");
  },

  clearPredictionZones() {
    this.predictionLayers.forEach((l) => this.map.removeLayer(l));
    this.predictionLayers = [];
  },

  clearInteractiveMarkers() {
    if (this.activeMarkers.length > 0) {
      this.activeMarkers.forEach((layer) => this.map.removeLayer(layer));
      this.activeMarkers = [];
    }
    this.map.closePopup();
  },

  findFacilityByName(query) {
    if (!GeoJSONLoader || !GeoJSONLoader.allFacilities) return null;
    const lowerQ = query.toLowerCase().replace(/[^a-z0-9]/g, "");

    const getDistance = (a, b) => {
      const matrix = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) == a.charAt(j - 1))
            matrix[i][j] = matrix[i - 1][j - 1];
          else
            matrix[i][j] =
              Math.min(
                matrix[i - 1][j - 1],
                matrix[i][j - 1],
                matrix[i - 1][j]
              ) + 1;
        }
      }
      return matrix[b.length][a.length];
    };

    let bestMatch = null;
    let minDist = Infinity;

    GeoJSONLoader.allFacilities.forEach((f) => {
      const p = f.properties;
      const candidates = [p.NAMOBJ, p.SDN, p.REMARK, p.Name].filter(Boolean);

      candidates.forEach((rawName) => {
        const name = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (name.includes(lowerQ) || lowerQ.includes(name)) {
          if (minDist > 0.1) {
            minDist = 0.1;
            bestMatch = f;
          }
        } else {
          const dist = getDistance(name, lowerQ);
          const threshold = Math.max(3, name.length * 0.4);
          if (dist <= threshold && dist < minDist) {
            minDist = dist;
            bestMatch = f;
          }
        }
      });
    });

    return bestMatch;
  },

  handleLayerControl(message) {
    const showMatch = message.match(
      /(tampilkan|lihat|munculkan|aktifkan)\s+layer\s+(.+)/i
    );
    const hideMatch = message.match(
      /(sembunyikan|hapus|hilangkan|matikan)\s+layer\s+(.+)/i
    );

    if (!showMatch && !hideMatch) return null;

    const action = showMatch ? "show" : "hide";
    const query = (showMatch || hideMatch)[2].toLowerCase();
    const controlContainer = document.querySelector(".leaflet-control-layers");
    if (!controlContainer) return null;

    if (
      !controlContainer.classList.contains("leaflet-control-layers-expanded")
    ) {
      controlContainer.classList.add("leaflet-control-layers-expanded");
    }

    const labels = Array.from(controlContainer.querySelectorAll("label"));
    const targetLabel = labels.find((l) =>
      l.innerText.toLowerCase().includes(query)
    );

    if (targetLabel) {
      const input = targetLabel.querySelector("input");
      const isChecked = input.checked;

      if (action === "show" && !isChecked) input.click();
      if (action === "hide" && isChecked) input.click();

      setTimeout(
        () =>
          controlContainer.classList.remove("leaflet-control-layers-expanded"),
        1000
      );

      return `
              <div style="background:#f0fdf4; border-left:4px solid #22c55e; padding:10px; border-radius:4px; margin-bottom:8px;">
                  <strong>Layer Diperbarui</strong><br>
                  Layer "${targetLabel.innerText}" berhasil ${
        action === "show" ? "ditampilkan" : "disembunyikan"
      }.
              </div>
          `;
    }

    controlContainer.classList.remove("leaflet-control-layers-expanded");
    return null;
  },

  processAIResponse(text) {
    const mapTag = text.match(/\[MAP:\s*(.*?)\]/i);
    let locationName = null;
    let cleanText = text;

    if (mapTag) {
      locationName = mapTag[1].trim();
      cleanText = cleanText.replace(mapTag[0], "").trim();
    }

    const cmdTag = text.match(/\[CMD:\s*PREDICTION\]/i);
    let command = null;
    if (cmdTag) {
      command = "PREDICTION";
      cleanText = cleanText.replace(cmdTag[0], "").trim();
    }

    return { text: cleanText, location: locationName, command: command };
  },

  gatherContext() {
    const stats = typeof UIUtils !== "undefined" ? UIUtils.stats : {};
    const area =
      typeof GeoJSONLoader !== "undefined" && GeoJSONLoader.districtArea
        ? GeoJSONLoader.districtArea
        : "Belum terhitung";
    let center = "Unknown";
    let zoom = "Unknown";
    if (this.map) {
      const c = this.map.getCenter();
      center = `${c.lat.toFixed(4)}, ${c.lng.toFixed(4)}`;
      zoom = this.map.getZoom();
    }
    return `
        CONTEXT DATA:
        - Wilayah: Kecamatan Gunung Puyuh, Sukabumi
        - Luas Wilayah Terhitung: ${area}
        - Total Institusi Pendidikan: ${
          stats.total - (stats.totalHealth || 0) || 0
        }
          (SD: ${stats.sd || 0}, SMP: ${stats.smp || 0}, SMA: ${
      stats.sma || 0
    }, Univ: ${stats.universitas || 0})
        - Total Fasilitas Kesehatan: ${stats.totalHealth || 0}
          (RS: ${stats.rumahSakit || 0}, Puskesmas: ${
      stats.puskesmas || 0
    }, Klinik: ${stats.klinik || 0})
        - Posisi Peta Saat Ini: ${center} (Zoom: ${zoom})
        
        PREDICTION RULES (Use these logic):
        1. Jarak < 0.5km ke fasilitas: Pertumbuhan "Sangat Tinggi" (1-2 thn). Area kosan/kuliner.
        2. Jarak 0.5 - 1.5km: "Sedang-Tinggi" (3-5 thn). Area hunian sewa/apotek.
        3. Jarak 1.5 - 3.0km: "Rendah-Sedang" (5-10 thn). Perumahan umum.
        4. Jarak > 3.0km: "Rendah". Lahan hijau/pertanian.
        
        Keberadaan Universitas memicu kos-kosan.
        Keberadaan RS memicu apotek/penginapan.
        Keberadaan Sekolah memicu hunian keluarga muda.
        `;
  },

  async callGroqAPI(userMessage, context) {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem("groq_api_key") || "";
      if (!this.apiKey) throw new Error("API Key tidak ditemukan.");
    }

    const systemPrompt = `
        Kamu adalah Asisten GeoAI Ahli untuk WebGIS Analisis Kesenjangan Aksesibilitas di Kecamatan Gunung Puyuh.
        Tugasmu adalah menjawab pertanyaan pengguna tentang data spasial, fasilitas, dan prediksi wilayah.
        
        Gunakan data berikut sebagai fakta dasar:
        ${context}

        PENTING:
        - Jika ditanya prediksi, gunakan logika dari data yang tersedia untuk menalar.
        - Jawab dengan bahasa Indonesia yang profesional, ramah, dan ringkas.
        - JANGAN menyebutkan kata "PREDICTION RULES", "CONTEXT DATA", atau istilah teknis internal lainnya.
        - Jelaskan seolah-olah Anda adalah ahli tata kota yang berbicara langsung kepada warga.
        - Gunakan format markdown (bold, list) agar mudah dibaca.
        
        🔥 FITUR INTERAKTIF (PENTING):
        1. Jika jawabanmu membahas satu Lokasi Spesifik atau Fasilitas Tertentu (misal: "SDN 1 Gunungpuyuh", "RSUD Syamsudin"), KAMU WAJIB MENAMBAHKAN TAG BERIKUT DI AKHIR JAWABAN:
           [MAP: Nama Exact Lokasi]
        
        2. Jika jawabanmu membahas PREDIKSI ZONA PADAT atau WILAYAH PROSPEKTIF (dan sistem belum menampilkannya), tambahkan tag:
           [CMD: PREDICTION]
        `;

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature: 0.5,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error ${response.status}: ${
            errData.error?.message || response.statusText
          }`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        throw new Error(
          "Koneksi ditolak (CORS/Network). Pastikan Anda menggunakan HTTPS atau Localhost."
        );
      }
      throw err;
    }
  },
};
