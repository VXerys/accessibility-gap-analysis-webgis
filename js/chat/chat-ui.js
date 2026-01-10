const ChatUI = {
  render() {
    const chatHTML = `
      <div class="chat-window" id="chat-window">
          <div class="chat-header">
              <div class="header-info">
                  <div class="ai-avatar-header">
                      <i class="ph-fill ph-robot"></i>
                      <div class="status-dot"></div>
                  </div>
                  <div class="chat-title">
                      <h3>GIS Assistant</h3>
                      <span class="subtitle">Smart City Analysis AI</span>
                  </div>
              </div>
              <button class="close-chat" id="close-chat"><i class="ph-bold ph-x"></i></button>
          </div>
          
          <div class="chat-messages" id="chat-messages">
               <div class="message ai">
                  <div class="message-content">
                      Halo! Saya asisten cerdas untuk <strong>Kecamatan Gunung Puyuh</strong>. 🗺️<br><br>
                      Saya dapat membantu Anda melakukan analisis spasial secara instan. Coba perintahkan saya:
                      <div class="suggestion-chips">
                          <span class="chip" onclick="document.getElementById('chat-input').value='Analisis top 5 hotspot'; document.getElementById('send-btn').click();">🏆 Top 5 Hotspot</span>
                          <span class="chip" onclick="document.getElementById('chat-input').value='Cari fasilitas kesehatan terdekat'; document.getElementById('send-btn').click();">🏥 Fasilitas Kesehatan</span>
                          <span class="chip" onclick="document.getElementById('chat-input').value='Analisis gap area'; document.getElementById('send-btn').click();">⚠️ Gap Analysis</span>
                      </div>
                  </div>
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
              <div class="input-wrapper">
                  <input type="text" class="chat-input" id="chat-input" placeholder="Ketik perintah analisis...">
                  <button class="send-btn" id="send-btn"><i class="ph-fill ph-paper-plane-right"></i></button>
              </div>
          </div>
      </div>`;

    document.body.insertAdjacentHTML("beforeend", chatHTML);
  },

  addMessage(text, type) {
    const container = document.getElementById("chat-messages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = `message ${type}`;
    if (type === "ai") {
      div.innerHTML = `<div class="message-content">${this.formatText(
        text
      )}</div>`;
    } else {
      div.innerHTML = this.formatText(text);
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");
  },

  showTyping(show) {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      if (show) indicator.classList.add("active");
      else indicator.classList.remove("active");
    }
    const container = document.getElementById("chat-messages");
    if (container) container.scrollTop = container.scrollHeight;
  },

  showApiKeyPrompt(onSave) {
    this.addMessage(
      `
              ⚠️ <strong>API Key Diperlukan</strong><br>
              Server tidak mendeteksi Environment Variable untuk API Key.<br>
              Silakan masukkan <strong>Groq API Key</strong> Anda sendiri:<br>
              <div style="margin-top:8px; margin-bottom:5px;">
                  <input type="password" id="user-api-key-input" placeholder="gsk_..." style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px; margin-bottom:8px; box-sizing:border-box;">
                  <button id="save-api-key-btn" style="width:100%; padding:8px; background:#2563eb; color:white; border:none; border-radius:4px; cursor:pointer;">Simpan & Lanjutkan</button>
              </div>
              <small style="color:#64748b;">Key akan disimpan aman di LocalStorage browser Anda.</small>
          `,
      "ai"
    );

    // Bind save button dynamically here or global listener?
    // Global listener is safer for dynamic content if not careful, but local is cleaner.
    // We'll rely on global listener in Controller for now as per original design.
  },
};
