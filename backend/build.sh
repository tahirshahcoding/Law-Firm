#!/usr/bin/env bash
set -o errexit
set -x

echo "Starting collectstatic..."
python manage.py collectstatic --no-input

echo "Starting migrate..."
python manage.py migrate --no-input

echo "Build complete."