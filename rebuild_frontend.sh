#!/bin/bash
set -e
cd /home/ubuntu/rahim-law-chamber
git pull origin main
cd frontend

# Install dependencies and build
npm install
# Disable telemetry which can cause build issues on AWS
npx next telemetry disable
npm run build

# Restart PM2
pm2 stop law-firm-frontend || true
pm2 delete law-firm-frontend || true

# If standalone output is enabled, run the standalone server
# otherwise run the standard next start command
if [ -f ".next/standalone/server.js" ]; then
    echo "Running standalone Next.js server..."
    # We must run it from the standalone folder
    cp -r public .next/standalone/
    cp -r .next/static .next/standalone/.next/
    # PM2 needs PORT 3000
    export PORT=3000
    export HOSTNAME="0.0.0.0"
    pm2 start .next/standalone/server.js --name "law-firm-frontend" --env PORT=3000,HOSTNAME="0.0.0.0"
else
    echo "Running standard Next.js server..."
    pm2 start npm --name "law-firm-frontend" -- run start
fi

pm2 save
sudo systemctl restart nginx
