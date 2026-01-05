/**
 * Build script to generate env.js from Netlify environment variables
 * This runs during Netlify build process
 */
const fs = require('fs');
const path = require('path');

// Get environment variables (set in Netlify dashboard)
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const ORS_API_KEY = process.env.ORS_API_KEY || '';

// Generate the env.js content
const envContent = `// Auto-generated from Netlify environment variables
// DO NOT COMMIT THIS FILE
window.ENV = {
    GROQ_API_KEY: "${GROQ_API_KEY}",
    ORS_API_KEY: "${ORS_API_KEY}"
};
`;

// Write to js/env.js
const outputPath = path.join(__dirname, '..', 'js', 'env.js');

try {
    fs.writeFileSync(outputPath, envContent, 'utf8');
    console.log('✅ env.js generated successfully!');
    console.log(`   - GROQ_API_KEY: ${GROQ_API_KEY ? '***' + GROQ_API_KEY.slice(-4) : '(not set)'}`);
    console.log(`   - ORS_API_KEY: ${ORS_API_KEY ? '***' + ORS_API_KEY.slice(-4) : '(not set)'}`);
} catch (error) {
    console.error('❌ Failed to generate env.js:', error.message);
    process.exit(1);
}
