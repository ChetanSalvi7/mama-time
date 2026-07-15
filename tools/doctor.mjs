import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const problems = [];
const warnings = [];
const notes = [];
let productionMode = false;

const nodeVersion = process.versions.node.split('.').map(Number);
const supported = nodeVersion[0] > 22 || (nodeVersion[0] === 22 && nodeVersion[1] >= 12) || (nodeVersion[0] === 20 && nodeVersion[1] >= 19);
if (!supported) problems.push(`Node.js ${process.versions.node} is not supported. Use Node 20.19+ or Node 22.12+.`);
else notes.push(`Node.js ${process.versions.node}: OK`);

const envPath = path.join(root, '.env');
if (!fs.existsSync(envPath)) {
  warnings.push('No .env file found. Run `npm run setup` before starting the application.');
} else {
  const env = Object.fromEntries(fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter((line) => line && !line.startsWith('#')).map((line) => {
    const index = line.indexOf('=');
    return index >= 0 ? [line.slice(0, index), line.slice(index + 1)] : [line, ''];
  }));
  if (!env.JWT_SECRET || env.JWT_SECRET.includes('replace-with') || env.JWT_SECRET.length < 40) problems.push('JWT_SECRET is missing or too short.');
  if (!env.IP_HASH_SECRET || env.IP_HASH_SECRET.includes('replace-with') || env.IP_HASH_SECRET.length < 40) problems.push('IP_HASH_SECRET is missing or too short.');
  if (!env.ADMIN_BOOTSTRAP_PASSWORD || env.ADMIN_BOOTSTRAP_PASSWORD === 'ChangeMe-Now-2026!') problems.push('The bootstrap admin password is still the documented default.');
  productionMode = env.NODE_ENV === 'production';
  if (productionMode && !String(env.APP_BASE_URL || '').startsWith('https://')) problems.push('Production APP_BASE_URL must start with https://.');
  if (!env.WHATSAPP_NUMBER) warnings.push('WHATSAPP_NUMBER is empty; WhatsApp buttons will fall back to the lead form.');
  if (!env.NOTIFICATION_EMAIL) warnings.push('NOTIFICATION_EMAIL is empty; leads will still be stored in the backoffice, but no email notification will be sent.');
  notes.push(`Environment file: ${env.NODE_ENV || 'not set'}`);
}

const legalPath = path.join(root, 'frontend', 'src', 'pages', 'LegalPage.jsx');
if (fs.existsSync(legalPath)) {
  const legalSource = fs.readFileSync(legalPath, 'utf8');
  const containsPlaceholder = /\[(?:Vollständige|Rechtlicher|Strasse|PLZ|ergänzen|Name und Funktion|Nur soweit)/.test(legalSource);
  if (containsPlaceholder) {
    const message = 'LegalPage.jsx still contains imprint/privacy placeholders.';
    if (productionMode) problems.push(message); else warnings.push(message);
  }
}

const distPath = path.join(root, 'frontend', 'dist', 'index.html');
if (!fs.existsSync(distPath)) warnings.push('Frontend build not found. Run `npm run build`.');
else notes.push('React production build: OK');

const dataDir = path.join(root, 'backend', 'data');
try {
  fs.mkdirSync(dataDir, { recursive: true });
  const probe = path.join(dataDir, `.write-test-${process.pid}`);
  fs.writeFileSync(probe, 'ok', { mode: 0o600 });
  fs.rmSync(probe);
  notes.push('Data directory is writable: OK');
} catch (error) {
  problems.push(`Data directory is not writable: ${error.message}`);
}

console.log('\nMAMA TIME SYSTEM CHECK\n======================');
for (const note of notes) console.log(`✓ ${note}`);
for (const warning of warnings) console.log(`! ${warning}`);
for (const problem of problems) console.log(`✗ ${problem}`);
console.log('');
if (problems.length) process.exit(1);
console.log(warnings.length ? 'System check passed with warnings.' : 'System check passed.');
