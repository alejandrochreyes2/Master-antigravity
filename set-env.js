/**
 * set-env.js
 * Lee GEMINI_API_KEY del archivo .env o de variables de entorno del sistema
 * y actualiza angular.json con el valor real antes de iniciar ng serve.
 */

const fs = require('fs');
const path = require('path');

// Leer .env si existe
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const apiKey = process.env['GEMINI_API_KEY'];

if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
  console.warn('\n⚠️  ADVERTENCIA: GEMINI_API_KEY no está configurada.');
  console.warn('   Edita el archivo .env y coloca tu API Key de Google AI Studio.');
  console.warn('   Obtenla en: https://aistudio.google.com/app/apikey\n');
  process.exit(1);
}

// Actualizar angular.json
const angularJsonPath = path.join(__dirname, 'angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf8'));

angularJson.projects.app.architect.build.options.define = {
  GEMINI_API_KEY: JSON.stringify(apiKey)
};

fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2), 'utf8');
console.log('✅ GEMINI_API_KEY configurada correctamente en angular.json');
