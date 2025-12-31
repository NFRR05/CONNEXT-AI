#!/usr/bin/env node

/**
 * n8n Environment Setup Script
 * Generates keys and creates .env.n8n file
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate secure keys
const encryptionKey = crypto.randomBytes(32).toString('base64');
const apiKey = crypto.randomBytes(32).toString('base64');
const dbPassword = crypto.randomBytes(24).toString('base64');
const adminPassword = crypto.randomBytes(16).toString('base64');

// Create .env.n8n content
const envContent = `# n8n Docker Configuration
# Generated automatically - do not commit to git

N8N_ADMIN_USER=admin
N8N_ADMIN_PASSWORD=${adminPassword}
N8N_ENCRYPTION_KEY=${encryptionKey}
N8N_API_KEY=${apiKey}
N8N_DB_PASSWORD=${dbPassword}
N8N_WEBHOOK_URL=http://localhost:5678/
N8N_HOST=localhost
N8N_PROTOCOL=http
N8N_SECURE_COOKIE=false
`;

// Write to .env.n8n
const envPath = path.join(process.cwd(), '.env.n8n');
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('==========================================');
console.log('✅ n8n Environment File Created!');
console.log('==========================================');
console.log('');
console.log('📁 File created: .env.n8n');
console.log('');
console.log('Generated Keys:');
console.log('==========================================');
console.log('🔐 Encryption Key:', encryptionKey);
console.log('🔑 API Key:', apiKey);
console.log('🗄️  DB Password:', dbPassword);
console.log('👤 Admin Password:', adminPassword);
console.log('');
console.log('==========================================');
console.log('📝 Next Steps:');
console.log('1. Start n8n: docker-compose -f docker-compose.n8n.yml up -d');
console.log('2. Access n8n at: http://localhost:5678');
console.log('3. Login with: admin / ' + adminPassword);
console.log('4. Get API key from n8n UI (Settings → API)');
console.log('5. Add N8N_API_KEY to .env.local');
console.log('==========================================');

// Export for potential use
module.exports = {
  encryptionKey,
  apiKey,
  dbPassword,
  adminPassword
};

