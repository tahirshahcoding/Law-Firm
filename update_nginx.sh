sudo tee /etc/nginx/sites-available/rahim-law-chamber > /dev/null << 'EOF'
server {
    listen 80;
    server_name 13.203.220.157;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        alias /home/ubuntu/rahim-law-chamber/backend/staticfiles/;
    }

    # Backend API endpoints
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django Admin endpoints
    location /admin/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo nginx -t
sudo systemctl restart nginx
