#!/bin/bash
set -e

echo "1/7 Updating system and installing dependencies..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -q
sudo apt-get install -y -q python3-pip python3-venv nginx git libpq-dev python3-dev

echo "2/7 Cloning repository..."
cd /home/ubuntu
if [ ! -d "Law-Firm" ]; then
    git clone https://github.com/tahirshahcoding/Law-Firm.git
fi
cd Law-Firm/backend

echo "3/7 Creating .env file..."
cat << 'EOF' > .env
# --- 1. Supabase Cloud Database ---
DATABASE_URL=postgresql://postgres.umofxiibkgqrevnykjpr:Rahim989108@aws-1-ap-south-1.pooler.supabase.com:6543/postgres

# --- 2. Supabase Cloud File Storage (S3) ---
SUPABASE_S3_ACCESS_KEY=c802358eb9c9fe486ec388f86e00516c
SUPABASE_S3_SECRET_KEY=e3b93508a77dbd5dfe5ea9cc93135a62d614e6abbfdf11be8e6e2525426cdbd6
SUPABASE_S3_BUCKET_NAME=case-files
SUPABASE_S3_ENDPOINT=https://yeuvrhvdjgxqcnbgknfg.storage.supabase.co/storage/v1/s3
SUPABASE_S3_REGION=ap-northeast-1

# --- Production Settings ---
DEBUG=False
ALLOWED_HOSTS=*
CORS_ALLOW_ALL_ORIGINS=True
CSRF_TRUSTED_ORIGINS=https://rahimullah-advocate.tahirshah1175898.workers.dev
SECRET_KEY=django-insecure-production-key-change-me-later
EOF

echo "4/7 Setting up Virtual Environment..."
python3 -m venv venv
source venv/bin/activate
pip install -q -r requirements.txt
pip install -q gunicorn psycopg2-binary

echo "5/7 Running database migrations and collecting static files..."
python manage.py migrate
python manage.py collectstatic --noinput

echo "6/7 Setting up Gunicorn service..."
sudo bash -c 'cat << EOF > /etc/systemd/system/gunicorn.service
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/Law-Firm/backend
ExecStart=/home/ubuntu/Law-Firm/backend/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/home/ubuntu/Law-Firm/backend/lawfirm.sock core.wsgi:application

[Install]
WantedBy=multi-user.target
EOF'

sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

echo "7/7 Setting up Nginx..."
sudo bash -c 'cat << EOF > /etc/nginx/sites-available/lawfirm
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
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Host \$host;
    }
}
EOF'

sudo ln -sf /etc/nginx/sites-available/lawfirm /etc/nginx/sites-enabled
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
sudo chown -R ubuntu:www-data /home/ubuntu/Law-Firm/backend

echo "✅ SETUP COMPLETE! Your backend is now running at http://13.203.220.157"
