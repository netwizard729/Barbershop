#!/usr/bin/env bash
set -e

echo "==> Installing dependencies"
pip install -r requirements.txt

echo "==> Making migrations"
python manage.py makemigrations accounts
python manage.py makemigrations appointments

echo "==> Running migrations"
python manage.py migrate --fake-initial
python manage.py migrate

echo "==> Seeding default data"
python manage.py seed_data

echo "==> Collecting static files"
python manage.py collectstatic --no-input

echo "==> Build complete"
