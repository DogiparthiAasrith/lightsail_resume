#!/bin/bash

# Deployment script for Lightsail
# Run this script ON your Lightsail instance after uploading the code

set -e

echo "🚀 Starting deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ NPM version: $(npm --version)"

# Install dependencies
echo "📦 Installing application dependencies..."
npm install --production

# Check if .env file exists, if not create it
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
AWS_REGION=us-east-1
S3_BUCKET_NAME=public-site-lightsail
PORT=3000
EOF
    echo "✅ .env file created"
    echo "⚠️  Update S3_BUCKET_NAME in .env if your bucket name is different"
else
    echo "✅ .env file found"
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Stop existing PM2 process if running
pm2 stop resume-app 2>/dev/null || true
pm2 delete resume-app 2>/dev/null || true

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start server.js --name resume-app

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
echo "⚙️  Setting up PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Install and configure Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt install nginx -y
fi

# Get instance IP
INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

# Create Nginx configuration
echo "⚙️  Configuring Nginx..."
sudo tee /etc/nginx/sites-available/resume-app > /dev/null << EOF
server {
    listen 80;
    server_name $INSTANCE_IP;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/resume-app /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
echo "🔄 Restarting Nginx..."
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify IAM role
echo "🔐 Checking IAM role..."
ROLE=$(curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/ || echo "NOT_FOUND")

if [ "$ROLE" = "NOT_FOUND" ] || [ -z "$ROLE" ]; then
    echo "⚠️  WARNING: No IAM role detected!"
    echo "⚠️  You need to attach an IAM role to this instance for S3 access"
    echo "⚠️  See DEPLOYMENT.md for instructions"
else
    echo "✅ IAM role detected: $ROLE"
fi

# Show status
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Access your application at: http://$INSTANCE_IP"
echo ""
echo "📝 Useful commands:"
echo "  - View logs: pm2 logs resume-app"
echo "  - Restart app: pm2 restart resume-app"
echo "  - Check status: pm2 status"
echo "  - Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""
