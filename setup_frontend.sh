#!/bin/bash
set -e

echo "1/5 Installing Node.js and PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

echo "2/5 Pulling latest code & Configuring Frontend Environment..."
cd /home/ubuntu/rahim-law-chamber
git pull origin main
cd frontend
cat << 'EOF' > .env.local
NEXT_PUBLIC_API_URL=http://13.203.220.157/api
EOF

echo "3/5 Installing NPM Dependencies & Building Next.js..."
npm install
npm run build

echo "4/5 Starting Next.js with PM2..."
pm2 stop law-firm-frontend || true
pm2 delete law-firm-frontend || true
pm2 start npm --name "law-firm-frontend" -- run start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

echo "5/5 Updating Nginx to route Frontend and Backend..."
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/rahim-law-chamber
server {
    listen 80;
    server_name _; # Catch-all for IP address

    # Route /api/ directly to Django Gunicorn
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
    }

    # Route Django Admin to Gunicorn
    location /admin/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
    }
    
    # Route Django Static Files
    location /static/ {
        alias /home/ubuntu/rahim-law-chamber/backend/staticfiles/;
    }

    # Route everything else to Next.js Frontend (PM2)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF'

sudo systemctl restart nginx

echo "✅ FRONTEND DEPLOYMENT COMPLETE! Visit http://13.203.220.157"
