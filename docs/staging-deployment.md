# Staging Deployment Guide

## Overview

This document describes how to deploy the Longevity Platform to the staging environment.

**Staging URL:** `https://staging.longevity.pt`

**Branch:** `staging` — all deployments originate from this branch.

## Prerequisites

### DNS

Create an A record pointing `staging.longevity.pt` to the staging server IP.

### SSL Certificate

Obtain a certificate via Let's Encrypt:

```bash
# Install certbot on the staging server
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d staging.longevity.pt

# Copy to nginx ssl directory
sudo cp /etc/letsencrypt/live/staging.longevity.pt/fullchain.pem /opt/longevity-staging/docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/staging.longevity.pt/privkey.pem /opt/longevity-staging/docker/nginx/ssl/

# Generate Diffie-Hellman params
openssl dhparam -out /opt/longevity-staging/docker/nginx/ssl/dhparam.pem 2048

# Set up auto-renewal
echo "0 3 * * * certbot renew --post-hook 'docker restart longevity-staging-nginx'" | crontab -
```

### Server Preparation

```bash
# Install Docker and Docker Compose
sudo apt update
sudo apt install docker.io docker-compose-v2

# Create project directory
sudo mkdir -p /opt/longevity-staging
sudo chown $(whoami):$(whoami) /opt/longevity-staging
```

## First-Time Setup

```bash
# Clone the repository
git clone https://github.com/your-org/longevity-platform.git /opt/longevity-staging
cd /opt/longevity-staging
git checkout staging

# Create .env file
cp .env.staging.example .env.staging
# Edit .env.staging with real secrets

# Create network
docker network create longevity-staging

# Start services
docker compose -f docker/docker-compose.staging.yml up -d postgres redis

# Run migrations
docker compose -f docker/docker-compose.staging.yml run --rm api npx prisma migrate deploy

# Seed staging data
docker compose -f docker/docker-compose.staging.yml run --rm api npx ts-node prisma/seed-staging.ts

# Start remaining services
docker compose -f docker/docker-compose.staging.yml up -d api web nginx
```

## Deployment Process

Deployment is automated via GitHub Actions. See `.github/workflows/deploy-staging.yml`.

### Manual Deployment

```bash
# SSH into staging server
ssh user@staging.longevity.pt

cd /opt/longevity-staging

# Pull latest code
git pull origin staging

# Build and push Docker images
docker compose -f docker/docker-compose.staging.yml build api web

# Apply migrations
docker compose -f docker/docker-compose.staging.yml run --rm \
  -e DATABASE_URL="postgresql://longevity_staging:password@postgres:5432/longevity_staging?schema=public" \
  api npx prisma migrate deploy

# Restart services
docker compose -f docker/docker-compose.staging.yml up -d --force-recreate api web nginx

# Verify
curl https://staging.longevity.pt/api/v1/health/live
```

## Rollback

```bash
# Revert to previous tagged image
export COMMIT_SHA=<previous-commit-sha>
docker compose -f docker/docker-compose.staging.yml up -d --force-recreate api web nginx

# Or pull the last known good image
docker compose -f docker/docker-compose.staging.yml pull api web
docker compose -f docker/docker-compose.staging.yml up -d --force-recreate api web nginx

# If migrations need rollback, restore from backup first
# See backup-and-restore.md
```

## Environment Protection

The staging environment is protected by:

1. **IP allowlist** — nginx restricts access to VPN-authorized IPs (see `docker/nginx/includes/ip-allowlist.conf`)
2. **HTTPS** — all traffic is encrypted
3. **Strong credentials** — separate from development, rotated regularly
4. **No real data** — only synthetic data is used
5. **Mock providers** — all external integrations use mock implementations
