# Architecture Complète - Mega Supervision

## Vue d'Ensemble

Mega Supervision est une plateforme de géo-supervision commerciale permettant aux directeurs et délégués commerciaux de planifier, suivre et analyser les visites terrain. L'architecture suit un modèle **3-tiers** classique avec une couche de données, une couche applicative et une couche de présentation multi-support.

**Architecture 3-Tiers:**
- **Frontend (Next.js)** — Dashboard web pour directeurs commerciaux avec tableaux de bord, analytiques et rapports PDF
- **Mobile (React Native)** — Application Android pour délégués commerciaux avec suivi GPS temps réel et mode hors ligne
- **Backend (NestJS)** — API RESTful centralisée gérant l'authentification, la logique métier, le calcul GPS et la génération de PDF
- **Base de Données (PostgreSQL)** — Persistance relationnelle avec indexation spatiale pour les coordonnées GPS

**Flux Temps Réel:**
1. Le mobile du délégué envoie sa position GPS toutes les 5 secondes
2. Le backend calcule la distance Haversine entre la position et les prospects calibrés
3. Une visite est automatiquement débutée/terminée selon la proximité (seuil 4m)
4. Les événements GPS sont persistés en base pour analyse ultérieure
5. Le directeur consulte en temps réel l'activité via le dashboard web

**Offline-First:**
- SQLite local sur le mobile stocke tous les événements GPS
- File d'attente de synchronisation automatique lors du retour en ligne
- Résolution de conflits par timestamp (dernier écrit gagnant)

---

## Stack Technique

| Couche | Technologie | Version |
|--------|:-----------|:--------|
| **Frontend Web** | Next.js | 14 |
| | React | 18 |
| | TypeScript | 5.x |
| | TailwindCSS | 3.x |
| | Shadcn UI | latest |
| **Mobile** | React Native | 0.73 |
| | TypeScript | 5.x |
| **Backend** | NestJS | 10 |
| | TypeScript | 5.x |
| **Base de Données** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **Cartographie** | OpenStreetMap + Leaflet | web |
| | react-native-maps | mobile |
| **Génération PDF** | PDFKit | latest |
| **Authentification** | JWT + Refresh Token | — |
| **Conteneurisation** | Docker + Docker Compose | v3.8+ |

---

## Diagramme d'Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                CLIENTS                                       │
│  ┌─────────────────────┐  ┌──────────────────────┐  ┌────────────────────┐  │
│  │   Next.js Web        │  │   React Native        │  │      PWA           │  │
│  │   Dashboard DC       │  │   App Délégué         │  │    Mobile          │  │
│  │   Port 3000          │  │   Android APK         │  │  (fallback)        │  │
│  └──────────┬──────────┘  └───────────┬──────────┘  └────────┬───────────┘  │
└─────────────┼─────────────────────────┼──────────────────────┼──────────────┘
              │                         │                      │
              │    HTTPS (443)          │    HTTPS (443)       │  HTTPS (443)
              └─────────────────────────┼──────────────────────┘
                                        │
                              ┌─────────▼──────────────────────┐
                              │      NGINX Reverse Proxy       │
                              │    SSL Termination (Let's      │
                              │    Encrypt / Certbot)          │
                              │    Rate Limiting + CORS        │
                              └─────────┬──────────────────────┘
                                        │
                              ┌─────────▼──────────────────────┐
                              │       NestJS Backend           │
                              │        API REST (RESTful)      │
                              │       Port 3000 (interne)      │
                              │                                │
                              │  ┌──────────────────────────┐  │
                              │  │   Auth Module            │  │
                              │  │   Users Module           │  │
                              │  │   Prospects Module       │  │
                              │  │   GPS Engine             │  │
                              │  │   Visits Module          │  │
                              │  │   Analytics Module       │  │
                              │  │   PDF Module             │  │
                              │  │   Audit Module           │  │
                              │  └──────────────────────────┘  │
                              └───┬──────────────────────┬─────┘
                                  │                      │
                         ┌───────▼──────┐       ┌───────▼──────┐
                         │  PostgreSQL   │       │    Redis      │
                         │   Port 5432   │       │   Port 6379   │
                         │  (Données)    │       │  (Cache/Sess) │
                         │  PostGIS      │       │               │
                         └───────────────┘       └───────────────┘
```

---

## Data Flow Détaillé

### 1. Flux d'Authentification
```
Client                     NestJS                        PostgreSQL
  │                          │                              │
  │──── POST /auth/login ────→                              │
  │     {login, password}     │                              │
  │                          │──── SELECT user WHERE ───────→│
  │                          │    login = :login             │
  │                          │←─── user + hash ──────────────│
  │                          │                              │
  │                          │─── bcrypt.compare(password) ──│
  │                          │─── Generate JWT (24h) ────────│
  │                          │─── Generate Refresh (7d) ─────│
  │                          │──── INSERT refresh_token ────→│
  │←─ { accessToken,         │                              │
  │     refreshToken } ──────│                              │
```

### 2. Flux de Tracking GPS
```
Mobile GPS                  React Native                  NestJS                    PostgreSQL
  │   every 5s               │                              │                          │
  │──── position ───────────→│                              │                          │
  │  {lat, lng, speed, acc}  │                              │                          │
  │                          │──── POST /gps/event ────────→│                          │
  │                          │  {evenement: 'position',     │                          │
  │                          │   latitude, longitude, ...}   │                          │
  │                          │                              │──── INSERT gps_events ───→│
  │                          │                              │                          │
  │                          │                              │─── Haversine calc ───────│
  │                          │                              │─── Check proximity ──────│
  │                          │                              │                          │
  │                          │←── {visitDetected: true,     │                          │
  │                          │     visitId, action} ────────│                          │
```

### 3. Flux de Détection de Visite
```
GPS Engine                    NestJS                       PostgreSQL
  │                             │                              │
  │── new GpsEvent arrives ────→│                              │
  │                             │                              │
  │── getLastKnownVisit() ─────→│                              │
  │                             │──── SELECT visits ──────────→│
  │                             │←── latest visit or null ─────│
  │                             │                              │
  │── getCalibratedPoints() ───→│                              │
  │                             │──── SELECT calibrations ────→│
  │                             │←── calibrated prospects ─────│
  │                             │                              │
  │── haversineDistance(        │                              │
  │     current, calibrated)    │                              │
  │                             │                              │
  │── d <= 4m AND no active ───→│── CREATE visit ────────────→│
  │   visit? → START VISIT     │── INSERT gps_event (debut) ─→│
  │                             │                              │
  │── d > zone AND active ─────→│── UPDATE visit (fin) ──────→│
  │   visit? → END VISIT       │── INSERT gps_event (fin) ───→│
  │                             │                              │
  │── 13:00-15:00 AND           │                              │
  │   active visit? → PAUSE    │── INSERT gps_event (pause) ─→│
```

### 4. Flux Hors Ligne
```
Mobile (Hors Ligne)            SQLite Local                  Mobile (Reconnecté)         NestJS
  │                              │                              │                          │
  │── GpsEvent généré ──────────→│                              │                          │
  │                              │── INSERT event               │                          │
  │                              │   estSynchronise = false     │                          │
  │                              │                              │                          │
  │── (aucune connexion)         │                              │                          │
  │   ─ accumulate events ──────→│                              │                          │
  │                              │                              │                          │
  │── (connexion rétablie) ─────┼──────────────────────────────→│                          │
  │                              │                              │                          │
  │                              │                              │── POST /gps/sync ────────→│
  │                              │                              │   [{event1}, {event2}]    │
  │                              │                              │                          │
  │                              │                              │←── {synced: [ids]} ──────│
  │                              │                              │                          │
  │── UPDATE estSynchronise ────→│                              │                          │
  │   = true WHERE id IN (...)   │                              │                          │
  │                              │                              │                          │
  │── GET /prospects/sync ──────┼──────────────────────────────→│                          │
  │                              │                              │←── prospects mis à jour ─│
```

### 5. Flux Génération PDF
```
Dashboard Web                  NestJS                        PDFKit                       PostgreSQL
  │                              │                              │                          │
  │── GET /pdf/visits ──────────→│                              │                          │
  │   {dateDebut, dateFin,       │                              │                          │
  │    delegueId?}               │                              │                          │
  │                              │──── SELECT visites ────────→│                          │
  │                              │   JOIN users, prospects     │                          │
  │                              │←── données ─────────────────│                          │
  │                              │                              │                          │
  │                              │─── PDFKit.createDoc() ──────→│                          │
  │                              │─── Ajout en-tête ──────────→│                          │
  │                              │─── Tableau visites ─────────→│                          │
  │                              │─── Graphiques ─────────────→│                          │
  │                              │─── Pied de page ───────────→│                          │
  │                              │←── PDF Buffer ──────────────│                          │
  │                              │                              │                          │
  │←── PDF (Content-Disposition: │                              │                          │
  │     attachment) ────────────│                              │                          │
```

### 6. Flux Analytique
```
Dashboard Web                  NestJS                        PostgreSQL
  │                              │                              │
  │── GET /analytics/overview ──→│                              │
  │   {debut, fin}               │                              │
  │                              │── Complex queries on ───────→│
  │                              │   visits, gps_events,        │
  │                              │   users, prospects           │
  │                              │                              │
  │                              │←── aggregated data ─────────│
  │                              │                              │
  │── Transform + cache (Redis)  │                              │
  │                              │                              │
  │←── { stats, charts,         │                              │
  │      trends } ──────────────│                              │
```

---

## Sécurité

| Mesure | Implémentation |
|--------|:---------------|
| **JWT** | 24h access token + 7d refresh token (stocké hashé en DB) |
| **Hachage** | bcrypt, 10 rounds pour tous les mots de passe |
| **Rate Limiting** | 100 requêtes/min par IP (nest-rate-limiter) |
| **Headers** | Helmet (XSS, clickjacking, MIME sniffing, HSTS) |
| **CORS** | Restreint aux origines connues (env configurable) |
| **Validation** | class-validator + whitelist, pas d'entrées non validées |
| **Audit** | Toute mutation enregistrée dans `audit_logs` avec userId, IP, coordonnées GPS |
| **SQL Injection** | TypeORM requêtes paramétrées (pas de raw SQL) |
| **Secrets** | .env en production, jamais commités, jamais loggés |

---

## Modules de l'Application (NestJS)

```
src/
├── auth/               # Authentification JWT, refresh tokens
├── users/              # Gestion des utilisateurs (CRUD)
├── prospects/          # Gestion des prospects (CRUD)
├── calibrations/       # Calibrage GPS des prospects
├── gps/                # Réception et traitement des événements GPS
├── visits/             # Gestion des visites
├── analytics/          # Agrégation et statistiques
├── pdf/                # Génération de rapports PDF
├── audit/              # Journalisation des actions
├── common/             # Guards, interceptors, filters, pipes, decorators
│   ├── guards/         # JwtAuthGuard, RolesGuard
│   ├── interceptors/   # AuditInterceptor, LoggingInterceptor
│   ├── filters/        # GlobalExceptionFilter
│   └── decorators/     # @CurrentUser, @Roles
└── database/           # TypeORM entities, migrations, seeds
```

---

## Décisions Techniques

| Décision | Justification |
|----------|:--------------|
| **NestJS plutôt qu'Express pur** | Architecture modulaire, DI, décorateurs, mieux adapté à une app d'entreprise |
| **PostgreSQL plutôt que MongoDB** | Relations complexes (visites ↔ prospects ↔ users), intégrité référentielle, requêtes d'analytique |
| **JWT plutôt que sessions** | Sans état (stateless), adapté aux architectures mobile et API-first |
| **Leaflet plutôt que Google Maps** | Gratuit, pas de quota, OpenStreetMap, respect vie privée (pas de clé API Google) |
| **PDFKit** | Léger, sans dépendance externe, génération côté serveur |
| **SQLite offline-first** | Intégré React Native, pas de serveur, ACID, réveil rapide |
| **Docker Compose** | Un seul point de déploiement, reproductible, facile à maintenir |
