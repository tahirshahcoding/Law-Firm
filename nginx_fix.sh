#!/bin/bash
sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/lawfirm
server {
    listen 80;
    server_name 13.203.220.157;

    location = /favicon.ico { access_log off; log_not_found off; }
    
    location /static/ {
        alias /home/ubuntu/Law-Firm/backend/staticfiles/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/Law-Firm/backend/lawfirm.sock;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
EOF'

sudo sed -i 's/DEBUG=True/DEBUG=False/' /home/ubuntu/Law-Firm/.env
sudo ln -sf /etc/nginx/sites-available/lawfirm /etc/nginx/sites-enabled
sudo systemctl restart nginx
sudo systemctl restart gunicorn
