#!/bin/bash

# n8n Setup Script
# This script generates secure keys for n8n installation

echo "=========================================="
echo "n8n Setup - Key Generator"
echo "=========================================="
echo ""

# Generate secure keys
ENCRYPTION_KEY=$(openssl rand -base64 32)
API_KEY=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 24)
ADMIN_PASSWORD=$(openssl rand -base64 16)

echo "Generated Secure Keys:"
echo "=========================================="
echo ""
echo "🔐 Encryption Key:"
echo "$ENCRYPTION_KEY"
echo ""
echo "🔑 API Key (for CONNEXT AI):"
echo "$API_KEY"
echo ""
echo "🗄️  Database Password:"
echo "$DB_PASSWORD"
echo ""
echo "👤 Admin Password:"
echo "$ADMIN_PASSWORD"
echo ""
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo "1. Create a .env file in the same directory as docker-compose.n8n.yml"
echo "2. Add these variables:"
echo ""
echo "   N8N_ADMIN_USER=admin"
echo "   N8N_ADMIN_PASSWORD=$ADMIN_PASSWORD"
echo "   N8N_ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo "   N8N_API_KEY=$API_KEY"
echo "   N8N_DB_PASSWORD=$DB_PASSWORD"
echo "   N8N_WEBHOOK_URL=https://your-domain.com/"
echo "   N8N_HOST=your-domain.com"
echo "   N8N_PROTOCOL=https"
echo "   N8N_SECURE_COOKIE=true"
echo ""
echo "3. Save the API key to your CONNEXT AI .env file:"
echo "   N8N_API_KEY=$API_KEY"
echo "   N8N_API_URL=https://your-n8n-domain.com"
echo ""
echo "4. Start n8n: docker-compose -f docker-compose.n8n.yml up -d"
echo ""
echo "=========================================="
echo "⚠️  IMPORTANT: Save these keys securely!"
echo "=========================================="


