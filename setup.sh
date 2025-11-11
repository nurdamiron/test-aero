#!/bin/bash

echo "=================================================="
echo "ERP.AERO - Automated Setup Script"
echo "=================================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker is not installed"
    echo "Please install Docker from: https://www.docker.com/get-started"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "[ERROR] Docker Compose is not installed"
    echo "Please install Docker Compose"
    exit 1
fi

echo "[1/6] Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
fi
echo "[OK] Node.js $(node --version)"

echo ""
echo "[2/6] Installing npm dependencies..."
npm install

echo ""
echo "[3/6] Setting up environment file..."
if [ ! -f .env ]; then
    cp .env.example .env

    # Generate JWT secrets
    ACCESS_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    # Update .env with generated secrets
    sed -i.bak "s/your_access_secret_here/$ACCESS_SECRET/" .env
    sed -i.bak "s/your_refresh_secret_here/$REFRESH_SECRET/" .env
    rm .env.bak

    echo "[OK] .env file created with secure JWT secrets"
else
    echo "[OK] .env file already exists"
fi

echo ""
echo "[4/6] Starting MySQL with Docker..."
docker-compose up -d

echo ""
echo "[5/6] Waiting for MySQL to be ready..."
sleep 10

# Check if MySQL is ready
for i in {1..30}; do
    if docker-compose exec -T mysql mysql -u erp_user -perp_secure_password_2024 -e "SELECT 1" &> /dev/null; then
        echo "[OK] MySQL is ready"
        break
    fi
    echo "Waiting for MySQL... ($i/30)"
    sleep 1
done

echo ""
echo "[6/6] Running database migrations..."
docker-compose exec -T mysql mysql -u erp_user -perp_password erp_aero < migrations/init.sql

echo ""
echo "=================================================="
echo "Setup Complete!"
echo "=================================================="
echo ""
echo "To start the server:"
echo "  npm start"
echo ""
echo "To run tests:"
echo "  newman run ERP-AERO.postman_collection.json"
echo ""
echo "API will be available at: http://localhost:3333"
echo ""
