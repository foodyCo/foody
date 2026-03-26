#!/bin/bash
set -e

echo "====================================="
echo "  Deploying Foody to Yandex Cloud    "
echo "====================================="

# Make sure we are in the right directory
cd "$(dirname "$0")/.."

if [ ! -f ../.env ]; then
    echo "❌ ERROR: .env file is missing!"
    echo "Please copy .env.example to .env and fill it with production secrets:"
    echo "cp ../.env.example ../.env"
    exit 1
fi

echo "-> Building production images..."
docker compose build

echo "-> Stopping old containers and starting new ones..."
docker compose up -d

echo "-> Cleaning up unused images..."
docker image prune -f

echo "====================================="
echo "✅ Deployed successfully!            "
echo "====================================="
echo "The application is now running via Nginx on port 80."
echo "If you have pointed your domain to this IP, you can secure it with:"
echo "sudo certbot --nginx -d yourdomain.com"
