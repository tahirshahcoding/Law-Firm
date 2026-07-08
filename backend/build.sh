#!/usr/bin/env bash
set -o errexit
set -x

echo "Starting pip install..."
pip install -r requirements.txt

echo "Starting collectstatic..."
python manage.py collectstatic --no-input

echo "Starting migrate..."
python manage.py migrate --no-input

echo "Build complete."