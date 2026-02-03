#!/bin/bash

# BizBox SSL Setup Script
# Install Let's Encrypt certificates using certbot

set -e

DOMAIN="direco.com"
EMAIL="admin@${DOMAIN}"
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}"

echo "🔒 BizBox SSL Certificate Setup"
echo "================================"
echo "Domain: $DOMAIN"
echo "Email: $EMAIL"
echo ""

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Check if certificate already exists
if [ -d "$CERT_PATH" ]; then
    echo "✅ Certificate already exists at $CERT_PATH"
    echo "🔄 Attempting to renew..."
    certbot renew --quiet
    echo "✅ Certificate renewed successfully"
else
    echo "📝 Creating new SSL certificate..."
    certbot certonly \
        --nginx \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --non-interactive \
        --agree-tos \
        -m "$EMAIL" \
        --redirect

    if [ $? -eq 0 ]; then
        echo "✅ SSL certificate created successfully!"
    else
        echo "❌ Failed to create SSL certificate"
        exit 1
    fi
fi

# Setup automatic renewal
echo "⏰ Setting up automatic renewal..."
systemctl enable certbot.timer
systemctl start certbot.timer

# Create renewal hook
mkdir -p /etc/letsencrypt/renewal-hooks/post
cat > /etc/letsencrypt/renewal-hooks/post/nginx.sh << 'EOF'
#!/bin/bash
nginx -s reload
EOF
chmod +x /etc/letsencrypt/renewal-hooks/post/nginx.sh

echo ""
echo "✅ SSL Setup Complete!"
echo "Certificate path: $CERT_PATH"
echo "Auto-renewal: Enabled"
echo ""
echo "📋 Next steps:"
echo "1. Verify Nginx configuration: nginx -t"
echo "2. Reload Nginx: systemctl reload nginx"
echo "3. Test SSL: curl https://$DOMAIN"
