#!/bin/bash
set -e

sudo systemctl stop gunicorn || true

# Rename folder if it exists
if [ -d "/home/ubuntu/Law-Firm" ]; then
    mv /home/ubuntu/Law-Firm /home/ubuntu/rahim-law-chamber
fi

# Update Gunicorn service
sudo bash -c 'cat << "EOF" > /etc/systemd/system/gunicorn.service
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/rahim-law-chamber/backend
ExecStart=/home/ubuntu/rahim-law-chamber/backend/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock core.wsgi:application

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

# Update Nginx config
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/rahim-law-chamber
server {
    listen 80;
    server_name 13.203.220.157;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        alias /home/ubuntu/rahim-law-chamber/backend/staticfiles/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/rahim-law-chamber/backend/rahimlaw.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
EOF'

sudo rm -f /etc/nginx/sites-enabled/lawfirm
sudo rm -f /etc/nginx/sites-available/lawfirm
sudo ln -sf /etc/nginx/sites-available/rahim-law-chamber /etc/nginx/sites-enabled
sudo systemctl restart nginx
