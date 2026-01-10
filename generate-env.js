const fs = require("fs");
const path = require("path");

// Pastikan folder js ada (meskipun biasanya sudah ada)
const dirPath = path.join(__dirname, "js");
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath);
}

// Ambil variable dari Environment (Netlify)
// Jika tidak ada (misal run lokal tanpa setup), akan jadi string kosong
const groqKey = process.env.GROQ_API_KEY || "";
const orsKey = process.env.ORS_API_KEY || "";

const envContent = `window.ENV = {
  GROQ_API_KEY: "${groqKey}",
  ORS_API_KEY: "${orsKey}"
};`;

const filePath = path.join(dirPath, "env.js");

try {
  fs.writeFileSync(filePath, envContent);
  console.log(
    "✅ js/env.js berhasil dibuat dengan Environment Variables dari Netlify."
  );
  console.log("Keys injected:", {
    GROQ: groqKey ? "Yes (Hiden)" : "No",
    ORS: orsKey ? "Yes (Hidden)" : "No",
  });
} catch (error) {
  console.error("❌ Gagal membuat js/env.js:", error);
  process.exit(1);
}
