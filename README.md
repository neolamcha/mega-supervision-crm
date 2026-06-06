# Mega Supervision

Smart CRM - Solution de pilotage et contrôle de l'activité terrain des délégués commerciaux.

## Architecture

```
├── backend/          # NestJS API (TypeScript)
├── web/              # Next.js Dashboard (TypeScript)
├── mobile/           # React Native App (TypeScript)
├── docker/           # Docker configuration
└── docs/             # Documentation
```

## Prérequis

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

## Installation Rapide

```bash
git clone <repo-url>
cd mega-supervision

# Installer les dépendances
make install

# Démarrer l'environnement de développement
make dev

# Initialiser la base de données
make seed
```

## Accès

| Service | URL | Identifiants |
|---------|-----|--------------|
| Dashboard Web | http://localhost:80 | Dg2026 / Mega2026 |
| API | http://localhost:3000/api/v1 | - |
| API Docs | http://localhost:3000/api/docs | - |
| PostgreSQL | localhost:5432 | mega_admin / MegaSupervision2026 |
| Redis | localhost:6379 | - |

## Déploiement

```bash
# Production
make deploy
```

## Fonctionnalités

- Gestion des délégués commerciaux
- Gestion des prospects avec calibrage GPS
- Suivi automatique des visites terrain
- Détection d'entrée/sortie des zones (rayon 4m)
- Pause déjeuner automatisée (13h-15h)
- Analyse et tableau de bord
- Génération de rapports PDF
- Mode hors ligne (Offline First)
- Détection d'anomalies
- Journalisation complète des audits
