# Plan de Déploiement - Mega Supervision

## Vue d'Ensemble

Ce document décrit la procédure de déploiement de l'application Mega Supervision de l'environnement de développement jusqu'à la production, incluant l'infrastructure Docker, la configuration SSL/TLS, les sauvegardes et le plan de rollback.

---

## Environnements

| Environnement | URL | Usage | Base de données |
|:--------------|:----|:------|:----------------|
| **Development** | `http://localhost:3000` | Développement local, tests unitaires | PostgreSQL locale (Docker) |
| **Staging** | `https://staging.mega-supervision.com` | Tests d'intégration, QA, UAT | PostgreSQL staging |
| **Production** | `https://mega-supervision.com` | Utilisateurs finaux | PostgreSQL production |

---

## Prérequis Infrastructure

### Configuration Minimale (Production)

| Ressource | Requis | Recommandé |
|:----------|:-------|:-----------|
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 GB | 8 GB |
| **Stockage** | 20 GB SSD | 50 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **Docker** | v24+ | v26+ |
| **Docker Compose** | v2.20+ | v2.27+ |
| **Réseau** | 100 Mbps | 1 Gbps |

### Logiciels Requis

```bash
# Installation Docker (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Installation Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Vérification
docker --version          # Docker version 26.x+
docker compose version    # Docker Compose version v2.27+
```

### Configuration Réseau

| Port | Service | Protocole |
|:-----|:--------|:----------|
| `80` | HTTP (redirect → 443) | TCP |
| `443` | HTTPS (Nginx) | TCP |
| `5432` | PostgreSQL (interne) | TCP |
| `6379` | Redis (interne) | TCP |
| `3000` | API Backend (interne) | TCP |

---

## Structure des Fichiers de Déploiement

```
mega-supervision/
├── docker-compose.yml          # Orchestration des services
├── Dockerfile.backend          # Build NestJS
├── Dockerfile.frontend         # Build Next.js
├── nginx/
│   ├── nginx.conf              # Configuration Nginx
│   └── ssl/                    # Certificats SSL (Let's Encrypt)
├── .env                        # Variables d'environnement
├── .env.example                # Exemple de configuration
└── scripts/
    ├── deploy.sh               # Script de déploiement automatisé
    ├── backup.sh               # Script de sauvegarde PostgreSQL
    └── seed.sh                 # Script d'initialisation des données
```

---

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    container_name: mega-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: mega_supervision
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d mega_supervision"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - mega_network

  redis:
    image: redis:7-alpine
    container_name: mega-redis
    restart: unless-stopped
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - mega_network

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: mega-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: mega_supervision
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_EXPIRES_IN: 24h
      JWT_REFRESH_EXPIRES_IN: 7d
      CORS_ORIGIN: ${CORS_ORIGIN}
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - backend_uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/auth/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - mega_network

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: mega-frontend
    restart: unless-stopped
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: https://mega-supervision.com/api/v1
    ports:
      - "127.0.0.1:3001:3000"
    networks:
      - mega_network

  nginx:
    image: nginx:1.25-alpine
    container_name: mega-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - frontend_build:/usr/share/nginx/html:ro
    depends_on:
      - backend
      - frontend
    networks:
      - mega_network

volumes:
  postgres_data:
  redis_data:
  backend_uploads:
  frontend_build:

networks:
  mega_network:
    driver: bridge
```

---

## Déploiement Production — Pas à Pas

### Étape 1: Préparation du Serveur

```bash
# Connexion SSH
ssh root@mega-supervision.com

# Mise à jour du système
apt-get update && apt-get upgrade -y
apt-get install -y curl git ufw

# Configuration firewall
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw deny 3000         # Backend (interne)
ufw deny 5432         # PostgreSQL (interne)
ufw deny 6379         # Redis (interne)
ufw enable

# Installation Docker (voir prérequis)
```

### Étape 2: Cloner et Configurer

```bash
# Cloner le dépôt
git clone https://github.com/entreprise/mega-supervision.git /opt/mega-supervision
cd /opt/mega-supervision

# Créer le fichier .env
cp .env.example .env
nano .env
```

### Étape 3: Configuration .env

```bash
# .env — Production
# Base de données
DB_USER=mega_user
DB_PASSWORD=<GENERATE_STRONG_PASSWORD_32_CHARS>

# JWT
JWT_SECRET=<GENERATE_64_CHAR_SECRET>
JWT_REFRESH_SECRET=<GENERATE_64_CHAR_SECRET>

# CORS
CORS_ORIGIN=https://mega-supervision.com

# Backend
NODE_ENV=production

# Redis (optionnel)
# REDIS_PASSWORD=<password>
```

### Étape 4: Déploiement

```bash
# Démarrer les services
docker compose up -d --build

# Vérifier que tous les conteneurs tournent
docker compose ps

# Attendre que PostgreSQL soit prêt
sleep 10

# Exécuter les migrations
docker compose exec -T backend npm run migration:run

# Exécuter le seed (données initiales)
docker compose exec -T backend npm run seed

# Créer l'admin initial
docker compose exec -T backend npm run create:admin
```

### Étape 5: Vérification

```bash
# Vérifier la santé du backend
curl http://localhost:3000/api/v1/auth/health

# Vérifier les logs
docker compose logs -f --tail=50

# Tester l'API
curl https://mega-supervision.com/api/v1/auth/health

# Vérifier le frontend
curl -I https://mega-supervision.com
```

---

## Configuration SSL

### Option 1: Let's Encrypt (Recommandé)

```bash
# Installation de Certbot
apt-get install -y certbot

# Obtention du certificat
docker run -it --rm -p 80:80 --name certbot \
  -v "/opt/mega-supervision/nginx/ssl:/etc/letsencrypt" \
  certbot/certbot certonly --standalone \
  -d mega-supervision.com \
  -d www.mega-supervision.com \
  --non-interactive --agree-tos \
  -m admin@mega-supervision.com

# Définir les permissions
chmod -R 755 /opt/mega-supervision/nginx/ssl

# Configurer le renouvellement automatique (cron)
(crontab -l 2>/dev/null; echo "0 3 * * * docker run --rm -v /opt/mega-supervision/nginx/ssl:/etc/letsencrypt certbot/certbot renew --quiet && docker compose exec nginx nginx -s reload") | crontab -
```

### Option 2: Certificat Payant

Placer les fichiers dans `/opt/mega-supervision/nginx/ssl/`:
- `fullchain.pem`
- `privkey.pem`

---

## Configuration Nginx

```nginx
# nginx/nginx.conf
events {
  worker_connections 1024;
  multi_accept on;
  use epoll;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

  # HTTP → HTTPS redirect
  server {
    listen 80;
    server_name mega-supervision.com www.mega-supervision.com;
    return 301 https://$server_name$request_uri;
  }

  # HTTPS server
  server {
    listen 443 ssl http2;
    server_name mega-supervision.com www.mega-supervision.com;

    ssl_certificate /etc/nginx/ssl/live/mega-supervision.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/mega-supervision.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Frontend (Next.js)
    location / {
      proxy_pass http://frontend:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Backend
    location /api/ {
      limit_req zone=api burst=20 nodelay;
      proxy_pass http://backend:3000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
      proxy_read_timeout 60s;
      proxy_send_timeout 60s;
    }

    # Uploads
    location /uploads/ {
      alias /app/uploads/;
      expires 30d;
      add_header Cache-Control "public, immutable";
    }

    # Health check (no rate limit)
    location /health {
      access_log off;
      return 200 "OK";
    }
  }
}
```

---

## Scripts de Déploiement

### deploy.sh

```bash
#!/bin/bash
# scripts/deploy.sh — Déploiement automatisé
set -euo pipefail

APP_DIR="/opt/mega-supervision"
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🚀 Déploiement Mega Supervision - $DATE"

cd $APP_DIR

# 1. Sauvegarde avant déploiement
echo "📦 Sauvegarde de la base de données..."
docker compose exec -T postgres pg_dump -U $DB_USER mega_supervision > "$BACKUP_DIR/pre-deploy-$DATE.sql"

# 2. Pull dernier code
echo "📥 Récupération du dernier code..."
git fetch --tags
git checkout $1  # tag ou branche
git pull origin $1

# 3. Build et déploiement
echo "🏗️  Build et déploiement..."
docker compose build --no-cache
docker compose up -d --force-recreate

# 4. Attendre que les services soient prêts
echo "⏳ Attente des services..."
sleep 15

# 5. Migrations
echo "🗄️  Exécution des migrations..."
docker compose exec -T backend npm run migration:run

# 6. Vérification
echo "✅ Vérification..."
if curl -sf http://localhost:3000/api/v1/auth/health > /dev/null; then
  echo "✅ Déploiement réussi !"
else
  echo "❌ Échec du déploiement — rollback en cours..."
  # Rollback automatique
  docker compose down
  git checkout previous-tag
  docker compose up -d --build
  exit 1
fi

# 7. Nettoyage
docker image prune -f
echo "✅ Terminé."
```

---

## Backup Strategy

### Script de Sauvegarde Automatique

```bash
#!/bin/bash
# scripts/backup.sh — Sauvegarde PostgreSQL
set -euo pipefail

DB_USER=${DB_USER:-mega_user}
DB_NAME=mega_supervision
BACKUP_DIR="/opt/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7
RETENTION_WEEKS=4
RETENTION_MONTHS=3

mkdir -p "$BACKUP_DIR/{daily,weekly,monthly}"

# Backup quotidien
echo "📦 Backup quotidien..."
docker compose exec -T postgres pg_dump \
  -U $DB_USER \
  -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --verbose \
  > "$BACKUP_DIR/daily/mega_$DATE.dump"

# Backup hebdomadaire (dimanche)
if [ $(date +%u) -eq 7 ]; then
  echo "📦 Backup hebdomadaire..."
  cp "$BACKUP_DIR/daily/mega_$DATE.dump" "$BACKUP_DIR/weekly/"
fi

# Backup mensuel (1er du mois)
if [ $(date +%d) -eq 1 ]; then
  echo "📦 Backup mensuel..."
  cp "$BACKUP_DIR/daily/mega_$DATE.dump" "$BACKUP_DIR/monthly/"
fi

# Nettoyage — retention
find "$BACKUP_DIR/daily" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR/weekly" -type f -mtime +$((RETENTION_WEEKS * 7)) -delete
find "$BACKUP_DIR/monthly" -type f -mtime +$((RETENTION_MONTHS * 30)) -delete

echo "✅ Backup terminé: mega_$DATE.dump"
```

### Restauration

```bash
# Restaurer un backup
docker compose exec -T postgres pg_restore \
  -U $DB_USER \
  -d mega_supervision \
  --clean \
  --if-exists \
  < /opt/backups/postgres/daily/mega_20250115_120000.dump
```

---

## Monitoring

### Commandes Quotidiennes

```bash
# Statut des conteneurs
docker compose ps

# Logs en temps réel
docker compose logs -f --tail=100

# Utilisation des ressources
docker stats

# Taille de la base de données
docker compose exec postgres psql -U $DB_USER -d mega_supervision -c "
  SELECT pg_size_pretty(pg_database_size('mega_supervision'));
"

# Connexions actives
docker compose exec postgres psql -U $DB_USER -d mega_supervision -c "
  SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
"
```

### Endpoint de Health Check

```bash
# Health check
curl https://mega-supervision.com/api/v1/auth/health
```

**Réponse attendue:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00Z",
  "version": "1.0.0",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected",
  "memory": { "used": 256, "total": 4096, "percentage": 6.25 }
}
```

---

## Rollback Plan

### Procédure de Rollback

```bash
# 1. Arrêter les services
docker compose down

# 2. Restaurer la version précédente
git checkout <previous-tag>

# 3. Rebuild et redémarrage
docker compose up -d --build

# 4. Restaurer la base de données (si nécessaire)
docker compose exec -T postgres pg_restore \
  -U $DB_USER \
  -d mega_supervision \
  --clean \
  --if-exists \
  < /opt/backups/pre-deploy-20250115_120000.dump

# 5. Vérifier
docker compose ps
curl https://mega-supervision.com/api/v1/auth/health
```

### Critères de Rollback

Un rollback est déclenché automatiquement si :
- Le health check échoue pendant plus de 30 secondes après déploiement
- Le taux d'erreur 5xx dépasse 5% en 5 minutes
- Le temps de réponse moyen dépasse 2 secondes
- Les migrations échouent

---

## Scaling

### Horizontal Scaling (Plusieurs Instances Backend)

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: .
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
    # ...

  nginx:
    # Round-robin entre les backends
    # upstream backend {
    #   server backend:3000;
    #   server backend:3000;
    #   server backend:3000;
    # }
```

### Read Replicas PostgreSQL

```yaml
# Configuration read replica (analytique)
services:
  postgres_replica:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: mega_supervision_replica
      PRIMARY_HOST: postgres
    # ...
```

### Redis Cluster

```yaml
# Redis cluster pour cache distribué
services:
  redis_cluster:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes
    # ...
```

---

## Checklist de Déploiement

### Pré-déploiement
- [ ] Tests unitaires passent (`npm run test`)
- [ ] Tests d'intégration passent (`npm run test:e2e`)
- [ ] Build réussi (`docker compose build`)
- [ ] `.env` configuré pour l'environnement cible
- [ ] Certificats SSL valides
- [ ] Backup de la base de données effectué
- [ ] Migrations testées sur staging
- [ ] Version taguée dans git

### Post-déploiement
- [ ] Health check OK
- [ ] API fonctionnelle (tester login)
- [ ] Frontend accessible (vérifier page dashboard)
- [ ] GPS events reçus correctement
- [ ] PDF généré sans erreur
- [ ] Logs sans erreur
- [ ] Monitoring actif
- [ ] Backup automatique configuré
