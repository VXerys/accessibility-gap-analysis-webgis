const ChatAssistant = {
  apiKey:
    window.ENV && window.ENV.GROQ_API_KEY
      ? window.ENV.GROQ_API_KEY
      : localStorage.getItem("groq_api_key") || "",
  apiUrl: "https://api.groq.com/openai/v1/chat/completions",

  init(map) {
    this.map = map;
    this.renderUI();
    this.bindEvents();
    console.log("🤖 Chat AI Assistant Initialized");
  },

  renderUI() {
    const chatHTML = `
            <div class="chat-widget-btn" id="chat-btn">
                <span class="chat-icon">💬</span>
            </div>
    <div class="chat-window" id="chat-window">
        <div class="chat-header">
            <div class="chat-title">
                <h3><span class="ai-status"></span> GIS Assistant</h3>
            </div>
            <button class="close-chat" id="close-chat">×</button>
        </div>
        <div class="chat-messages" id="chat-messages">
            <div class="message ai">
                Halo! Saya asisten AI Kecamatan Gunung Puyuh. 👋<br>
                    Silakan tanya tentang:
                    <ul style="margin-top:5px; padding-left:15px;">
                        <li>Kepadatan Penduduk</li>
                        <li>Prediksi Pertumbuhan (1-10 thn)</li>
                        <li>Jarak & Fasilitas Terdekat</li>
                        <li>Analisis Kesenjangan (Gap)</li>
                    </ul>
            </div>
        </div>
        <div class="typing-indicator" id="typing-indicator">
            <div class="dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        </div>
        <div class="chat-input-area">
            <input type="text" class="chat-input" id="chat-input" placeholder="Tanya sesuatu tentang wilayah ini...">
                <button class="send-btn" id="send-btn">➤</button>
        </div>
    </div>`;

    document.body.insertAdjacentHTML("beforeend", chatHTML);
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
      closeBtn.addEventListener("click", () =>
        chatWindow.classList.remove("active")
      );
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
      const key = input.value.trim();
      this.apiKey = key;
      localStorage.setItem("groq_api_key", key);
      const btn = document.getElementById("save-api-key-btn");
      if (btn) {
        btn.textContent = "Tersimpan!";
        btn.disabled = true;
        btn.style.backgroundColor = "#10b981";
      }
      this.addMessage(
        "✅ API Key berhasil disimpan. Silahkan kirim pesan Anda kembali.",
        "ai"
      );
    }
  },

  async handleSend() {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();
    if (!message) return;

    this.addMessage(message, "user");
    input.value = "";

    if (!this.apiKey) {
      this.apiKey = localStorage.getItem("groq_api_key") || "";
    }

    if (!this.apiKey) {
      this.addMessage(
        `
                ⚠️ <strong>API Key Diperlukan</strong><br>
                Server tidak mendeteksi Environment Variable untuk API Key (biasa terjadi di GitHub Pages).<br>
                Silakan masukkan <strong>Groq API Key</strong> Anda sendiri (Gratis):<br>
                <div style="margin-top:8px; margin-bottom:5px;">
                    <input type="password" id="user-api-key-input" placeholder="gsk_..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-bottom:8px; box-sizing:border-box;">
                    <button id="save-api-key-btn" style="width:100%; padding:8px; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">Simpan & Lanjutkan</button>
                </div>
                <small style="color:#64748b;">Key akan disimpan aman di LocalStorage browser Anda.</small>
            `,
        "ai"
      );
      return;
    }

    this.showTyping(true);

    try {
      const context = this.gatherContext();
      const response = await this.callGroqAPI(message, context);
      this.addMessage(response, "ai");
    } catch (error) {
      console.error("Chat Error:", error);
      this.addMessage(
        `⚠️ <strong>Gagal Terhubung:</strong><br>${error.message}<br><small>Cek console untuk detail.</small>`,
        "ai"
      );
    } finally {
      this.showTyping(false);
    }
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
    if (!this.apiKey) throw new Error("API Key tidak ditemukan.");
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

  addMessage(text, type) {
    const container = document.getElementById("chat-messages");
    const div = document.createElement("div");
    div.className = `message ${type}`;
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
    div.innerHTML = formattedText;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  showTyping(show) {
    const indicator = document.getElementById("typing-indicator");
    if (show) indicator.classList.add("active");
    else indicator.classList.remove("active");
    const container = document.getElementById("chat-messages");
    container.scrollTop = container.scrollHeight;
  },
};
