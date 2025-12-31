#!/usr/bin/env node

/**
 * n8n Key Generator (Cross-platform)
 * Generates secure keys for n8n installation
 */

const crypto = require('crypto');

// Generate secure keys
const encryptionKey = crypto.randomBytes(32).toString('base64');
const apiKey = crypto.randomBytes(32).toString('base64');
const dbPassword = crypto.randomBytes(24).toString('base64');
const adminPassword = crypto.randomBytes(16).toString('base64');

console.log('==========================================');
console.log('n8n Setup - Key Generator');
console.log('==========================================');
console.log('');
console.log('Generated Secure Keys:');
console.log('==========================================');
console.log('');
console.log('🔐 Encryption Key:');
console.log(encryptionKey);
console.log('');
console.log('🔑 API Key (for CONNEXT AI):');
console.log(apiKey);
console.log('');
console.log('🗄️  Database Password:');
console.log(dbPassword);
console.log('');
console.log('👤 Admin Password:');
console.log(adminPassword);
console.log('');
console.log('==========================================');
console.log('');
console.log('📝 These keys will be saved to .env.n8n');
console.log('==========================================');
console.log('⚠️  IMPORTANT: Save these keys securely!');
console.log('==========================================');

// Export keys for use in other scripts
module.exports = {
  encryptionKey,
  apiKey,
  dbPassword,
  adminPassword
};

