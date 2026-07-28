sudo tee /etc/nginx/sites-available/rahim-law-chamber > /dev/null << 'EOF'
# API Server Block (Dedicated backend domain)
server {
    listen 80;
    server_name api.rahimlawchamber.com;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        alias /home/ubuntu/rahim-law-chamber/backend/staticfiles/;
    }

    location /media/ {
        alias /home/ubuntu/rahim-law-chamber/backend/media/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Portal Server Block (Frontend)
server {
    listen 80;
    server_name admin.rahimlawchamber.com 13.203.220.157;

    location = /favicon.ico { access_log off; log_not_found off; }

    # Keep the local reverse proxy for the frontend to avoid Cross-Origin cookie issues
    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /home/ubuntu/rahim-law-chamber/backend/staticfiles/;
    }

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
